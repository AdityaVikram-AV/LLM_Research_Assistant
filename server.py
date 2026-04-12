from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

class QuestionRequest(BaseModel):
    question: str

@app.get("/status")
def status():
    return { "ollama": "running",
        "chromadb": "connected",
        "embed_model": "nomic-embed-text",
        "llm_model": "llama3.2"}

@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    pdf_path = "book.pdf"
    with open(pdf_path, "wb") as f:
        f.write(await file.read())
    ingest(pdf_path)
    return {"status": "success", "message": "Ingestion complete"}

@app.post("/query")
def query(request: QuestionRequest):
    coll = get_or_create_collection(COLLECTION_NAME)
    chunks = retrieve_chunks(coll, request.question, TOP_K)
    answer = ask(request.question)
    return {
            "answer": answer,
            "chunks": [
                {
                    "page": c["page"],
                    "text": c["text"][:100] + "...",
                    "score": round(1 - c["distance"], 4)
                }
                for c in chunks
            ]
        }