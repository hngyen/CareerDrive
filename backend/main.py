from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase
from pydantic import BaseModel
from typing import Optional, List
from google import genai as google_genai
import os
import time

app = FastAPI()
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://careerdrive.vercel.app"
    ],
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
    match_score: int
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None

@app.get("/")
@app.head("/")
def read_root():
    return {"status": "online", "message": "CareerDrive Backend is awake"}

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

@app.get("/profile")
def get_profile(user=Depends(get_current_user)):
    response = supabase.table("profiles").select("*").eq("id", user.id).execute()
    return response.data[0] if response.data else {}

@app.post("/profile")
def save_profile(payload: dict, user=Depends(get_current_user)):
    data = { "id": user.id, "skills": payload.get("skills", ""), "experience": payload.get("experience", "") }
    response = supabase.table("profiles").upsert(data).execute()
    return response.data[0]

google_client = google_genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.post("/parse-job")
def parse_job(payload: dict, user=Depends(get_current_user)):
    text = payload.get("text", "")
    
    response = None
    start_time = time.time()
    success = False
    
    # fetch user profile
    profile_response = supabase.table("profiles").select("*").eq("id", user.id).execute()
    profile = profile_response.data[0] if profile_response.data else {}
    skills = profile.get("skills", "")
    experience = profile.get("experience", "")

    try:
        response = google_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f""" You are a Senior Technical Lead at a Tier 1 Sydney Tech Firm. 
                Your goal is to provide a brutal, honest, and high-signal assessment of a candidate for an engineering role.

                Analyze the provided Job Description against the Candidate Profile. 
                Return ONLY a raw JSON object with these EXACT keys:

                "company": "string",
                "role": "string",
                "notes": "1-2 sentence technical summary focusing on the core challenge of the role.",
                "match_score": "integer 0-100 (weighted: 50% Technical Stack, 30% Domain Experience, 20% Education/Projects)",
                "pros": ["Up to 3 specific technical strengths or library overlaps"],
                "cons": ["Up to 3 specific tech gaps, missing cloud providers, or seniority mismatches"],
                Rules:
                1. Be objective. If the JD asks for 5 years of C++ and the user has 1 year of Python, the match_score must reflect that (e.g., < 30).
                2. If skills are 'Not provided', match_score should be 0.
                3. Return only valid JSON, no explanation, no markdown backticks.

                Candidate Data:
                Skills: {skills}
                Experience: {experience}

                Job Description:
                {text}""",
            config={"temperature": 0}
        )

        import json
        result = json.loads(response.text)
        success = True
        
    finally:
        latency = round(time.time() - start_time, 3)
        prompt_tokens = response.usage_metadata.prompt_token_count or 0
        output_tokens = response.usage_metadata.candidates_token_count or 0
        total_tokens = response.usage_metadata.total_token_count or 0
        cost = round((prompt_tokens / 1_000_000 * 0.30) + (output_tokens / 1_000_000 * 2.50), 8)

        supabase.table("parse_logs").insert({
            "user_id": user.id,
            "prompt_tokens": prompt_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "latency_seconds": latency,
            "estimated_cost_usd": cost,
            "success": success
        }).execute()

    return result

@app.get("/parse-logs")
def get_parse_logs(user=Depends(get_current_user)):
    response = supabase.table("parse_logs").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    return response.data