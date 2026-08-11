from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client, ClientOptions
from core.config import settings
from typing import Dict, Any

security = HTTPBearer()

def get_auth_client(credentials: HTTPAuthorizationCredentials = Security(security)) -> Client:
    """
    Creates a new Supabase client initialized with the user's JWT token.
    This ensures all database operations performed with this client are
    subject to the user's Row Level Security (RLS) policies.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    token = credentials.credentials
    try:
        # Create a new client instance with the Authorization header
        options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, options=options)
        
        # Verify user
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        # Attach user to client for easy access
        client.user = user_response.user
        return client
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Supabase auth error: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
