import uuid
from core.supabase import supabase_client
import logging
import tempfile
import os

logger = logging.getLogger(__name__)

def upload_dataset_to_storage(client, file_bytes: bytes, filename: str) -> str:
    """
    Uploads a dataset to Supabase storage and returns the storage path.
    """
    if not client:
        logger.error("Supabase client not provided")
        raise Exception("Storage not configured")
        
    ext = filename.split(".")[-1] if "." in filename else "csv"
    storage_path = f"{uuid.uuid4()}.{ext}"
    
    # We upload directly to a 'datasets' bucket
    # Note: the bucket 'datasets' must exist in the Supabase project
    response = client.storage.from_("datasets").upload(
        file=file_bytes,
        path=storage_path,
        file_options={"content-type": "text/csv"}
    )
    
    return storage_path

def download_dataset_to_temp(client, storage_path: str) -> str:
    """
    Downloads a dataset from Supabase to a temporary file and returns its path.
    """
    if not client:
        raise Exception("Storage not configured")
        
    res = client.storage.from_("datasets").download(storage_path)
    
    # Save to a temp file so pandas chunked reading can read it
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, storage_path)
    
    with open(temp_file_path, "wb") as f:
        f.write(res)
        
    return temp_file_path
