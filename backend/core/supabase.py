from supabase import create_client, Client
from core.config import settings
import logging
import optuna

logger = logging.getLogger(__name__)

supabase_client: Client = None

if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")

optuna_storage = None
if settings.SUPABASE_DB_URI:
    try:
        optuna_storage = optuna.storages.RDBStorage(
            url=settings.SUPABASE_DB_URI,
            engine_kwargs={
                "pool_size": 10,
                "max_overflow": 5,
                "pool_recycle": 1800,
                "pool_pre_ping": True
            }
        )
        logger.info("Shared Optuna RDBStorage initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize shared Optuna RDBStorage: {e}")
