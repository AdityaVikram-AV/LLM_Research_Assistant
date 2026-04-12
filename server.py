from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sys
import os

sys.path.append(os.path.dirname(__file__))
from Research_Assistant_RAG import (ingest,ask,retrieve_chunks,get_or_create_collection,COLLECTION_NAME,TOP_K)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["http://localhost:8080"],
    allow_methods = ["*"],
    allow_headers = ["*"]
)

# Get collection name from environment or use default
ACTIVE_COLLECTION = os.getenv("COLLECTION_NAME", COLLECTION_NAME)

class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)

@app.get("/status")
def status():
    try:
        import ollama
        import chromadb
        # Test Ollama connection
        ollama.list()
        ollama_status = "running"
    except Exception as e:
        ollama_status = "error"
    
    try:
        # Test ChromaDB connection
        client = chromadb.PersistentClient(path="./chroma_db")
        client.list_collections()
        chromadb_status = "connected"
    except Exception as e:
        chromadb_status = "error"
    
    return {
        "status": "success",
        "data": {
            "ollama": ollama_status,
            "chromadb": chromadb_status,
            "embed_model": "nomic-embed-text",
            "llm_model": "llama3.2"
        }
    }

@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"status": "error", "message": "Only PDF files are allowed"}
    
    pdf_path = os.path.join(".", file.filename)
    try:
        with open(pdf_path, "wb") as f:
            f.write(await file.read())
        ingest(pdf_path)
        # Clean up the uploaded PDF file after ingestion
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        return {"status": "success", "message": f"Ingestion of {file.filename} complete"}
    except Exception as e:
        # Clean up on error as well
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        return {"status": "error", "message": str(e)}

@app.get("/collection-info")
def collection_info():
    try:
        coll = get_or_create_collection(ACTIVE_COLLECTION)
        # Get count of items in collection
        count = coll.count()
        
        # Get all metadatas to find max page
        all_items = coll.get(include=["metadatas"])
        max_page = 0
        if all_items["metadatas"]:
            max_page = max(m.get("page", 0) for m in all_items["metadatas"])
        
        return {
            "status": "success",
            "collection_name": ACTIVE_COLLECTION,
            "chunks_count": count,
            "max_page": max_page
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "chunks_count": 0, "max_page": 0}

@app.post("/query")
def query(request: QuestionRequest):
    if not request.question.strip():
        return {"status": "error", "message": "Question cannot be empty"}
    
    try:
        coll = get_or_create_collection(ACTIVE_COLLECTION)
        chunks = retrieve_chunks(coll, request.question, TOP_K)
        answer = ask(request.question)
        return {
            "answer": answer,
            "chunks": [
                {
                    "page": c["page"],
                    "text": c["text"][:100] + "...",
                    "distance": round(1 - c["distance"], 4)
                }
                for c in chunks
            ]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}