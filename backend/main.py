from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(title="Neural Net Insights API")

# Configure CORS for Next.js dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Neural Net Insights API"}

@app.on_event("startup")
async def startup_event():
    from core.supabase import supabase_client
    if supabase_client:
        try:
            # Mark all orphaned 'running' runs as 'failed' (interrupted)
            supabase_client.table("runs").update({
                "status": "failed",
                "error": "Interrupted by server restart or client timeout"
            }).eq("status", "running").execute()
            print("Successfully cleaned up orphaned running instances on server startup.")
        except Exception as e:
            print(f"Failed to clean up orphaned running instances: {e}")
