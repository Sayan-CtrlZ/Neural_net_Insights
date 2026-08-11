from supabase import create_client, Client
from core.config import settings
import logging

logger = logging.getLogger(__name__)

supabase_client: Client = None

if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
