import optuna
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from xgboost import XGBClassifier, XGBRegressor
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def objective(trial: optuna.Trial, X: pd.DataFrame, y: pd.Series, problem_type: str):
    if problem_type == "classification":
        model_name = trial.suggest_categorical("model", ["logreg", "rf", "xgb"])
        
        if model_name == "logreg":
            C = trial.suggest_float("C", 1e-3, 10, log=True)
            model = LogisticRegression(C=C, max_iter=1000)
            
        elif model_name == "rf":
            n_estimators = trial.suggest_int("n_estimators", 50, 300)
            max_depth = trial.suggest_int("max_depth", 3, 20)
            model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth)
            
        else:
            eta = trial.suggest_float("eta", 0.01, 0.3, log=True)
            max_depth = trial.suggest_int("max_depth", 3, 10)
            model = XGBClassifier(learning_rate=eta, max_depth=max_depth, eval_metric="logloss")
            
        scoring = "accuracy"
        
    elif problem_type == "regression":
        model_name = trial.suggest_categorical("model", ["linreg", "rf", "xgb"])
        
        if model_name == "linreg":
            model = LinearRegression()
            
        elif model_name == "rf":
            n_estimators = trial.suggest_int("n_estimators", 50, 300)
            max_depth = trial.suggest_int("max_depth", 3, 20)
            model = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth)
            
        else:
            eta = trial.suggest_float("eta", 0.01, 0.3, log=True)
            max_depth = trial.suggest_int("max_depth", 3, 10)
            model = XGBRegressor(learning_rate=eta, max_depth=max_depth)
            
        scoring = "r2"
    else:
        raise ValueError(f"Unknown problem_type: {problem_type}")

    # Compute cross-validated score
    score = cross_val_score(model, X, y, cv=3, scoring=scoring, error_score='raise').mean()
    return score

def run_optimization_local(X: pd.DataFrame, y: pd.Series, problem_type: str, run_id: str, n_trials: int = 10):
    """
    Run Optuna optimization locally in-memory for testing purposes.
    """
    logger.info(f"Starting local optimization for {problem_type} with {n_trials} trials (Run: {run_id})")
    
    # We maximize both accuracy and r2 in this setup
    from core.config import settings
    
    storage = None
    if settings.SUPABASE_DB_URI:
        # Use Postgres for persistent storage
        storage = optuna.storages.RDBStorage(
            url=settings.SUPABASE_DB_URI,
            engine_kwargs={"pool_size": 20, "max_overflow": 0}
        )
        logger.info("Using PostgreSQL for Optuna storage")
    else:
        logger.warning("SUPABASE_DB_URI not found. Using in-memory storage for Optuna.")

    study = optuna.create_study(
        direction="maximize", 
        pruner=optuna.pruners.MedianPruner(),
        storage=storage,
        load_if_exists=True,
        study_name=f"study_{run_id}"
    )
    
    study.optimize(lambda trial: objective(trial, X, y, problem_type), n_trials=n_trials)
    
    logger.info(f"Best trial score: {study.best_value}")
    logger.info(f"Best trial params: {study.best_params}")
    
    return study

def run_optimization_background(client, user_id: str, run_id: str, problem_type: str, target_column: str, storage_path: str, runs_store: dict, n_trials: int = 15):
    """
    Background task that downloads the dataset, runs Optuna, and updates the database.
    """
    logger.info(f"Starting background run {run_id} for user {user_id}")
    
    from services.storage import download_dataset_to_temp
    from services.preprocessing import load_dataset
    import os
    
    try:
        # Download dataset from Supabase Storage
        temp_file_path = download_dataset_to_temp(client, storage_path)
        
        # Load via chunking and downcasting
        df = load_dataset(temp_file_path)
        
        # Preprocessing (impute, encode, scale)
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")
            
        y = df[target_column]
        X = df.drop(columns=[target_column])
        
        # Label encode the target if it's classification (e.g. for XGBoost)
        if problem_type == 'classification':
            from sklearn.preprocessing import LabelEncoder
            y = pd.Series(LabelEncoder().fit_transform(y))
        
        # Simple automatic preprocessing
        from sklearn.impute import SimpleImputer
        from sklearn.preprocessing import StandardScaler, OneHotEncoder
        from sklearn.compose import ColumnTransformer
        from sklearn.pipeline import Pipeline
        
        numeric_cols = X.select_dtypes(include=['number']).columns
        categorical_cols = X.select_dtypes(exclude=['number']).columns
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', Pipeline([
                    ('imputer', SimpleImputer(strategy='median')),
                    ('scaler', StandardScaler())
                ]), numeric_cols),
                ('cat', Pipeline([
                    ('imputer', SimpleImputer(strategy='most_frequent')),
                    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
                ]), categorical_cols)
            ]
        )
        
        X_processed = preprocessor.fit_transform(X)
        # Convert back to DataFrame for Optuna runner which expects pd.DataFrame
        # Get new column names from one-hot encoding if needed, or just use indices
        X_processed_df = pd.DataFrame(X_processed)
        
        # Run optimization with user-defined trials
        study = run_optimization_local(X_processed_df, y, problem_type, run_id, n_trials=n_trials)
        
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        # Update Supabase DB
        if client:
            client.table("runs").update({
                "status": "completed",
                "best_value": study.best_value,
                "best_params": study.best_params
            }).eq("id", run_id).execute()
            
        runs_store[run_id] = {
            "status": "completed",
            "best_params": study.best_params,
            "best_value": study.best_value
        }
        logger.info(f"Run {run_id} completed successfully.")
        
    except Exception as e:
        logger.error(f"Run {run_id} failed: {e}")
        if client:
            client.table("runs").update({
                "status": "failed",
                "error": str(e)
            }).eq("id", run_id).execute()
            
        runs_store[run_id] = {
            "status": "failed",
            "error": str(e)
        }
