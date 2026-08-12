import optuna
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from xgboost import XGBClassifier, XGBRegressor
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def objective(
    trial: optuna.Trial, 
    X: pd.DataFrame, 
    y: pd.Series, 
    problem_type: str, 
    run_id: str = None, 
    runs_store: dict = None,
    heartbeats_store: dict = None
):
    # Check if run has been cancelled by user
    if runs_store and run_id and runs_store.get(run_id, {}).get("status") == "cancelled":
        trial.study.stop()
        raise optuna.TrialPruned("Optimization cancelled by user.")

    # Check heartbeat timeout
    if heartbeats_store and run_id:
        import time
        last_hb = heartbeats_store.get(run_id)
        if last_hb and (time.time() - last_hb > 10.0):
            if runs_store and run_id in runs_store:
                runs_store[run_id]["status"] = "cancelled"
            trial.study.stop()
            raise optuna.TrialPruned("Optimization stopped due to client disconnect (heartbeat timeout).")

    if problem_type == "classification":
        model_name = trial.suggest_categorical("model", ["logreg", "rf", "xgb"])
        
        if model_name == "logreg":
            C = trial.suggest_float("C", 1e-3, 10, log=True)
            model = LogisticRegression(C=C, max_iter=500, n_jobs=1)
            
        elif model_name == "rf":
            n_estimators = trial.suggest_int("n_estimators", 20, 80)
            max_depth = trial.suggest_int("max_depth", 3, 10)
            model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, n_jobs=1)
            
        else:
            eta = trial.suggest_float("eta", 0.01, 0.3, log=True)
            max_depth = trial.suggest_int("max_depth", 3, 6)
            model = XGBClassifier(n_estimators=50, learning_rate=eta, max_depth=max_depth, eval_metric="logloss", n_jobs=1)
            
        scoring = "accuracy"
        
    elif problem_type == "regression":
        model_name = trial.suggest_categorical("model", ["linreg", "rf", "xgb"])
        
        if model_name == "linreg":
            model = LinearRegression(n_jobs=1)
            
        elif model_name == "rf":
            n_estimators = trial.suggest_int("n_estimators", 20, 80)
            max_depth = trial.suggest_int("max_depth", 3, 10)
            model = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, n_jobs=1)
            
        else:
            eta = trial.suggest_float("eta", 0.01, 0.3, log=True)
            max_depth = trial.suggest_int("max_depth", 3, 6)
            model = XGBRegressor(n_estimators=50, learning_rate=eta, max_depth=max_depth, n_jobs=1)
            
        scoring = "r2"
    else:
        raise ValueError(f"Unknown problem_type: {problem_type}")

    # Compute cross-validated score with proper memory cleanup
    try:
        score = cross_val_score(model, X, y, cv=3, scoring=scoring, error_score='raise').mean()
        return score
    finally:
        del model
        import gc
        gc.collect()

def run_optimization_local(
    X: pd.DataFrame, 
    y: pd.Series, 
    problem_type: str, 
    run_id: str, 
    n_trials: int = 10, 
    runs_store: dict = None,
    heartbeats_store: dict = None
):
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
    
    study.optimize(lambda trial: objective(trial, X, y, problem_type, run_id, runs_store, heartbeats_store), n_trials=n_trials)
    
    logger.info(f"Best trial score: {study.best_value}")
    logger.info(f"Best trial params: {study.best_params}")
    
    return study

def run_optimization_background(
    client, 
    user_id: str, 
    run_id: str, 
    dataset_id: str,
    problem_type: str, 
    target_column: str, 
    storage_path: str, 
    runs_store: dict, 
    n_trials: int = 15,
    heartbeats_store: dict = None
):
    """
    Background task that downloads the dataset, runs Optuna, updates the database, and cleans up the dataset.
    """
    logger.info(f"Starting background run {run_id} for user {user_id}")
    
    from services.storage import download_dataset_to_temp
    from services.preprocessing import load_dataset
    import os
    
    temp_file_path = None
    try:
        # Download dataset from Supabase Storage
        temp_file_path = download_dataset_to_temp(client, storage_path)
        
        # Load via chunking and downcasting
        df = load_dataset(temp_file_path)
        
        # Check target column exists
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")
            
        # Downsample dataset to maximum 20,000 rows for memory scaling on 512MB RAM
        if len(df) > 20000:
            logger.info(f"Dataset has {len(df)} rows. Downsampling to 20,000 rows for memory efficiency during optimization.")
            if problem_type == 'classification':
                try:
                    from sklearn.model_selection import train_test_split
                    # downsample keeping class ratio
                    df, _ = train_test_split(df, train_size=20000, stratify=df[target_column], random_state=42)
                except Exception:
                    df = df.sample(n=20000, random_state=42)
            else:
                df = df.sample(n=20000, random_state=42)

        y = df[target_column]
        X = df.drop(columns=[target_column])
        
        # Label encode the target if it's classification (e.g. for XGBoost)
        if problem_type == 'classification':
            from sklearn.preprocessing import LabelEncoder
            y = pd.Series(LabelEncoder().fit_transform(y))
        
        # Simple automatic preprocessing
        from sklearn.impute import SimpleImputer
        from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
        from sklearn.compose import ColumnTransformer
        from sklearn.pipeline import Pipeline
        
        numeric_cols = X.select_dtypes(include=['number']).columns
        categorical_cols = X.select_dtypes(exclude=['number']).columns
        
        # Categorize by cardinality to save memory and avoid dense matrix explosion
        low_card_cols = [col for col in categorical_cols if X[col].nunique() <= 10]
        high_card_cols = [col for col in categorical_cols if X[col].nunique() > 10]
        
        transformers = []
        if len(numeric_cols) > 0:
            transformers.append(('num', Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ]), numeric_cols))
            
        if len(low_card_cols) > 0:
            transformers.append(('cat_low', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]), low_card_cols))
            
        if len(high_card_cols) > 0:
            transformers.append(('cat_high', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
            ]), high_card_cols))
            
        preprocessor = ColumnTransformer(transformers=transformers)
        
        X_processed = preprocessor.fit_transform(X)
        if hasattr(X_processed, "toarray"):
            X_processed = X_processed.toarray()
            
        # Convert to float32 to reduce memory footprint by 50%
        X_processed_df = pd.DataFrame(X_processed).astype('float32')
        
        # Run optimization with user-defined trials
        study = run_optimization_local(
            X_processed_df, 
            y, 
            problem_type, 
            run_id, 
            n_trials=n_trials, 
            runs_store=runs_store,
            heartbeats_store=heartbeats_store
        )
        
        if runs_store and runs_store.get(run_id, {}).get("status") == "cancelled":
            raise Exception("Optimization stopped by user or client disconnect")

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
        status = "failed"
        if runs_store and runs_store.get(run_id, {}).get("status") == "cancelled":
            status = "failed" # will be stored as failed with cancelled message
        
        if client:
            client.table("runs").update({
                "status": status,
                "error": str(e)
            }).eq("id", run_id).execute()
            
        runs_store[run_id] = {
            "status": status,
            "error": str(e)
        }
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
                
        # Clean up database dataset record and storage file
        if client and dataset_id:
            try:
                # 1. Nullify dataset_id in the run to avoid foreign key violation
                client.table("runs").update({"dataset_id": None}).eq("id", run_id).execute()
                # 2. Delete from datasets table
                client.table("datasets").delete().eq("id", dataset_id).execute()
                # 3. Delete file from storage
                client.storage.from_("datasets").remove([storage_path])
                logger.info(f"Dataset {dataset_id} cleaned up successfully from DB and storage.")
            except Exception as cleanup_err:
                logger.error(f"Failed to clean up dataset {dataset_id}: {cleanup_err}")

        # Clean up telemetry data from database if the run is failed, stopped, or cancelled
        run_status = runs_store.get(run_id, {}).get("status") if runs_store else None
        if run_status != "completed":
            try:
                from core.config import settings
                if settings.SUPABASE_DB_URI:
                    import optuna
                    storage = optuna.storages.RDBStorage(
                        url=settings.SUPABASE_DB_URI,
                        engine_kwargs={"pool_size": 5, "max_overflow": 0}
                    )
                    study_name = f"study_{run_id}"
                    try:
                        optuna.delete_study(study_name=study_name, storage=storage)
                        logger.info(f"Optuna study {study_name} telemetry cleared from DB.")
                    except KeyError:
                        pass
            except Exception as clear_err:
                logger.error(f"Failed to clear telemetry study: {clear_err}")

        # Clean up heartbeat dict
        if heartbeats_store and run_id in heartbeats_store:
            try:
                del heartbeats_store[run_id]
            except Exception:
                pass
