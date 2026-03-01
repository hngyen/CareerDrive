from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Application(BaseModel):
    company: str
    role: str
    status: str = "applied"
    date_applied: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None

@app.get("/applications")
def get_applications():
    response = supabase.table("applications").select("*").execute()
    return response.data

@app.post("/applications")
def create_application(app: Application):
    response = supabase.table("applications").insert(app.model_dump()).execute()
    return response.data

@app.patch("/applications/{id}")
def update_application(id: str, app: Application):
    response = supabase.table("applications").update(app.model_dump()).eq("id", id).execute()
    return response.data

@app.delete("/applications/{id}")
def delete_application(id: str):
    response = supabase.table("applications").delete().eq("id", id).execute()
    return {"message": "deleted"}