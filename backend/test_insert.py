import asyncio
from core.supabase import insert_dataset_record, upload_dataset_to_storage
import traceback

async def main():
    try:
        print("Testing storage upload...")
        path = upload_dataset_to_storage(b"test", "test.csv")
        print(f"Storage path: {path}")
    except Exception as e:
        print(f"Storage Error: {e}")
        
    try:
        print("Testing table insert...")
        id = insert_dataset_record("test/path.csv", "test.csv")
        print(f"Table ID: {id}")
    except Exception as e:
        print(f"Table Error: {e}")

asyncio.run(main())
