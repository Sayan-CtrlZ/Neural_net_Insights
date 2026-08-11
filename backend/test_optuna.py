import pandas as pd
from services.optuna_runner import run_optimization_local

if __name__ == "__main__":
    # Create a small dummy classification dataset
    import numpy as np
    X = pd.DataFrame(np.random.randn(100, 5), columns=[f"feature_{i}" for i in range(5)])
    y = pd.Series(np.random.randint(0, 2, 100), name="target")
    
    print("Testing classification...")
    study = run_optimization_local(X, y, problem_type="classification", n_trials=3)
    
    # Create a small dummy regression dataset
    y_reg = pd.Series(np.random.randn(100), name="target")
    print("\nTesting regression...")
    study_reg = run_optimization_local(X, y_reg, problem_type="regression", n_trials=3)
    
    print("Optuna local test completed successfully!")
