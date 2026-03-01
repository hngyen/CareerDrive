from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase
from pydantic import BaseModel
from typing import Optional
import anthropic
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

app = FastAPI()
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    response = supabase.auth.get_user(token)
    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.user

class Application(BaseModel):
    company: str
    role: str
    status: str = "applied"
    date_applied: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None

@app.get("/applications")
def get_applications(user=Depends(get_current_user)):
    response = supabase.table("applications").select("*").eq("user_id", user.id).execute()
    return response.data

@app.post("/applications")
def create_application(app: Application, user=Depends(get_current_user)):
    data = app.model_dump()
    data["user_id"] = user.id
    response = supabase.table("applications").insert(data).execute()
    return response.data

@app.patch("/applications/{id}")
def update_application(id: str, app: Application, user=Depends(get_current_user)):
    response = supabase.table("applications").update(app.model_dump()).eq("id", id).eq("user_id", user.id).execute()
    return response.data

@app.delete("/applications/{id}")
def delete_application(id: str, user=Depends(get_current_user)):
    supabase.table("applications").delete().eq("id", id).eq("user_id", user.id).execute()
    return {"message": "deleted"}

@app.post("/parse-job")
def parse_job(payload: dict, user=Depends(get_current_user)):
    text = payload.get("text", "")
    
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Extract job details from this job description and return ONLY a JSON object with these fields:
                - company
                - role
                - notes (a brief 1-2 sentence summary of the role)
                
                Job description:
                {text}
                
                Return only valid JSON, no explanation."""
            }
        ]
    )
    
    import json
    result = json.loads(message.content[0].text)
    return result