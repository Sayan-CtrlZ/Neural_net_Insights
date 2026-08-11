import pandas as pd
from typing import List

def load_dataset(path: str, chunksize: int = 50_000) -> pd.DataFrame:
    """
    Loads a CSV dataset in chunks, drops empty rows, and downcasts numeric 
    columns to reduce memory usage.
    """
    chunks: List[pd.DataFrame] = []
    
    # We use engine='python' for robust CSV parsing though 'c' is faster. 
    # Usually 'c' is fine unless we encounter weird formatting.
    for chunk in pd.read_csv(path, chunksize=chunksize):
        chunk = chunk.dropna(how="all")
        for col in chunk.select_dtypes("int64").columns:
            chunk[col] = pd.to_numeric(chunk[col], downcast="integer")
        for col in chunk.select_dtypes("float64").columns:
            chunk[col] = pd.to_numeric(chunk[col], downcast="float")
        chunks.append(chunk)
        
    return pd.concat(chunks, ignore_index=True)
