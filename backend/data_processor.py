import pandas as pd
import io

def load_dataset(file_content: bytes, filename: str) -> pd.DataFrame:
    """Loads dataset from bytes into a Pandas DataFrame."""
    if filename.endswith('.csv'):
        return pd.read_csv(io.BytesIO(file_content))
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        return pd.read_excel(io.BytesIO(file_content))
    elif filename.endswith('.json'):
        return pd.read_json(io.BytesIO(file_content))
    else:
        raise ValueError("Unsupported file format")

def get_dataset_summary(df: pd.DataFrame) -> str:
    """Generates a text summary of the dataframe for the AI."""
    summary = []
    summary.append(f"Total Rows: {len(df)}")
    summary.append(f"Columns: {', '.join(df.columns)}")
    
    for col in df.columns:
        nulls = df[col].isnull().sum()
        unique = df[col].nunique()
        dtype = str(df[col].dtype)
        sample = df[col].dropna().head(3).tolist()
        summary.append(f"- Column '{col}': Type={dtype}, Nulls={nulls}, Unique={unique}, Sample={sample}")
        
    return "\n".join(summary)

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Basic cleaning steps (can be expanded)."""
    # Example: duplicate removal
    df = df.drop_duplicates()
    return df
