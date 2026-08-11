from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, HTTPException
import uuid
import pandas as pd
from services.optuna_runner import run_optimization_background
from services.storage import upload_dataset_to_storage
from core.supabase import supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
runs = {}  # Fallback memory store if DB insert fails

@router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        # Prevent database/storage bursting: Max 50MB
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
            
        contents = await file.read()
        storage_path = upload_dataset_to_storage(contents, file.filename)
        
        dataset_id = str(uuid.uuid4())
        
        # Save to Supabase DB (if available)
        if supabase_client:
            supabase_client.table("datasets").insert({
                "id": dataset_id,
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
    background_tasks: BackgroundTasks = None
):
    run_id = str(uuid.uuid4())
    
    # Save run to Supabase
    if supabase_client:
        try:
            supabase_client.table("runs").insert({
                "id": run_id,
                "dataset_id": dataset_id,
                "status": "running",
                "problem_type": problem_type,
                "target_column": target_column
            }).execute()
        except Exception as e:
            logger.error(f"Could not save run to DB: {e}")
            
    runs[run_id] = {"status": "running"}
    
    if background_tasks:
        background_tasks.add_task(
            run_optimization_background, 
            run_id=run_id, 
            problem_type=problem_type, 
            target_column=target_column,
            storage_path=storage_path,
            runs_store=runs,
            n_trials=n_trials
        )
    
    return {"run_id": run_id}

@router.get("/optimize/{run_id}/status")
async def get_status(run_id: str):
    if supabase_client:
        try:
            res = supabase_client.table("runs").select("*").eq("id", run_id).execute()
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
async def get_history(run_id: str):
    """
    Returns the trial history (trial number vs score) for plotting the optimization curve.
    """
    if supabase_client:
        try:
            # Get problem_type to know the study name
            run_res = supabase_client.table("runs").select("problem_type").eq("id", run_id).execute()
            if not run_res.data:
                return {"trials": []}
            
            problem_type = run_res.data[0]["problem_type"]
            study_name = f"study_{problem_type}"
            
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
                            trials.append({"number": t.number, "value": t.value})
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

