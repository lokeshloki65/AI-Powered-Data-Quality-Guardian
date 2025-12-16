from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pydantic import BaseModel

app = FastAPI(title="AI Data Quality Guardian")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
from .data_processor import load_dataset, get_dataset_summary
from .ai_engine import get_gemini_analysis

# In-memory storage for demo purposes
DATA_STORE = {}

class APIKeyRequest(BaseModel):
    api_key: str

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = load_dataset(contents, file.filename)
        
        # specific to demo: save to memory
        file_id = file.filename # simplified ID
        DATA_STORE[file_id] = df
        
        # basic internal summary
        summary = get_dataset_summary(df)
        
        # Get preview rows (first 5) - Convert NaN to None for JSON compatibility
        preview = df.head(5).where(pd.notnull(df), None).to_dict(orient='records')
        
        return {
            "filename": file.filename, 
            "total_rows": len(df), 
            "columns": list(df.columns),
            "summary_text": summary,
            "preview_rows": preview
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze")
async def analyze_data_endpoint(filename: str, key_data: APIKeyRequest):
    if filename not in DATA_STORE:
        raise HTTPException(status_code=404, detail="File not found")
        
    df = DATA_STORE[filename]
    summary_text = get_dataset_summary(df)
    
    # Call Gemini
    analysis_result = get_gemini_analysis(summary_text, api_key=key_data.api_key)
    
    return analysis_result

# Mount frontend at the root
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
