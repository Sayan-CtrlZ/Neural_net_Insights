from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, HTTPException, Depends
import uuid
import pandas as pd
from services.optuna_runner import run_optimization_background
from services.storage import upload_dataset_to_storage
from core.security import get_auth_client
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
runs = {}  # Fallback memory store if DB insert fails
active_heartbeats = {}

@router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...), client: Client = Depends(get_auth_client)):
    try:
        # Prevent database/storage bursting: Max 50MB
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
            
        contents = await file.read()
        storage_path = upload_dataset_to_storage(client, contents, file.filename)
        
        dataset_id = str(uuid.uuid4())
        
        # Save to Supabase DB (if available)
        if client:
            client.table("datasets").insert({
                "id": dataset_id,
                "user_id": client.user.id,
                "filename": file.filename,
                "storage_path": storage_path
            }).execute()
            
        return {"dataset_id": dataset_id, "filename": file.filename, "storage_path": storage_path}
    except Exception as e:
        logger.error(f"Failed to upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def start_optimization(
    dataset_id: str = Form(...), 
    problem_type: str = Form(...),
    target_column: str = Form(...),
    storage_path: str = Form(...),
    n_trials: int = Form(15),
    background_tasks: BackgroundTasks = None,
    client: Client = Depends(get_auth_client)
):
    run_id = str(uuid.uuid4())
    
    # Save run to Supabase
    if client:
        try:
            client.table("runs").insert({
                "id": run_id,
                "user_id": client.user.id,
                "dataset_id": dataset_id,
                "status": "running",
                "problem_type": problem_type,
                "target_column": target_column
            }).execute()
        except Exception as e:
            logger.error(f"Could not save run to DB: {e}")
            
    runs[run_id] = {"status": "running"}
    
    import time
    active_heartbeats[run_id] = time.time()
    
    if background_tasks:
        background_tasks.add_task(
            run_optimization_background, 
            client=client,
            user_id=client.user.id,
            run_id=run_id, 
            dataset_id=dataset_id,
            problem_type=problem_type, 
            target_column=target_column,
            storage_path=storage_path,
            runs_store=runs,
            n_trials=n_trials,
            heartbeats_store=active_heartbeats
        )
    
    return {"run_id": run_id}

@router.post("/optimize/{run_id}/heartbeat")
async def receive_heartbeat(run_id: str):
    import time
    active_heartbeats[run_id] = time.time()
    return {"status": "ok"}

@router.post("/optimize/{run_id}/cancel")
async def cancel_optimization(run_id: str, client: Client = Depends(get_auth_client)):
    # 1. Update memory store flag to let background thread know it should stop
    if run_id in runs:
        runs[run_id]["status"] = "cancelled"
    else:
        runs[run_id] = {"status": "cancelled"}
        
    # 2. Update status in Supabase DB if available
    if client:
        try:
            client.table("runs").update({
                "status": "failed",
                "error": "Cancelled by user"
            }).eq("id", run_id).execute()
        except Exception as e:
            logger.error(f"Could not update status to cancelled: {e}")
            
    return {"message": "Optimization cancellation request received."}

@router.get("/optimize/{run_id}/status")
async def get_status(run_id: str, client: Client = Depends(get_auth_client)):
    if client:
        try:
            res = client.table("runs").select("*").eq("id", run_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"DB Error: {e}")
            
    # Fallback to memory
    return runs.get(run_id, {"status": "not_found"})

@router.get("/optimize/{run_id}/results")
async def get_results(run_id: str):
    # This would query the optuna tables using psycopg2 or sqlalchemy directly
    # Since Optuna manages those tables, we can just load the study to get best params.
    return {"message": "Not implemented yet - Optuna direct DB query needed"}

@router.get("/optimize/{run_id}/history")
async def get_history(run_id: str, client: Client = Depends(get_auth_client)):
    """
    Returns the trial history (trial number vs score) for plotting the optimization curve.
    """
    if client:
        try:
            # Instead of looking up by problem_type, each run now has its own unique study name
            study_name = f"study_{run_id}"
            
            # Since Optuna creates its own relational tables, it's easier to load the study via Optuna 
            # if we have the connection string.
            import optuna
            from core.config import settings
            
            if settings.SUPABASE_DB_URI:
                storage = optuna.storages.RDBStorage(
                    url=settings.SUPABASE_DB_URI,
                    skip_table_creation=True
                )
                try:
                    study = optuna.load_study(study_name=study_name, storage=storage)
                    trials = []
                    for t in study.trials:
                        if t.state == optuna.trial.TrialState.COMPLETE and t.value is not None:
                            trials.append({
                                "number": t.number, 
                                "value": t.value,
                                "model": t.params.get("model", "Unknown")
                            })
                    return {"trials": trials}
                except KeyError:
                    # Study doesn't exist yet
                    return {"trials": []}
                except Exception as e:
                    # Tables might not be created yet by the background worker
                    return {"trials": []}
        except Exception as e:
            logger.error(f"Error fetching history: {e}")
            
    return {"trials": []}

