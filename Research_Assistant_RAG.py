"""
==============================================================
  RAG (Retrieval-Augmented Generation) System
  Fully local · Free · Mac-compatible (Ollama + ChromaDB)
==============================================================

HOW IT WORKS (High-Level):
  1. INGESTION  → Read PDF → Split into chunks → Embed → Store in vector DB
  2. QUERYING   → Embed question → Find similar chunks → Send to LLM → Answer

DEPENDENCIES (install once):
  pip install pymupdf sentence-transformers chromadb ollama

OLLAMA SETUP (install once):
  brew install ollama
  ollama pull llama3.2          # the LLM that answers questions
  ollama pull nomic-embed-text  # the model that creates embeddings
"""

# ──────────────────────────────────────────────────────────────
# IMPORTS
# ──────────────────────────────────────────────────────────────

import pymupdf          # Extracts text from PDF files (formerly PyMuPDF / fitz)
import chromadb         # Local vector database — stores and searches embeddings
import ollama           # Python client for talking to locally-running Ollama models
import re               # Standard library for text cleaning via regular expressions


# ──────────────────────────────────────────────────────────────
# CONFIGURATION — change these to suit your book / hardware
# ──────────────────────────────────────────────────────────────

PDF_PATH        = "/Users/adityavikram/Documents/HP Documents/Guide to Competitive Programming Learning and Improving Algorithms Through Contests (Undergraduate Topics in Computer Science) (Antti Laaksonen) (z-lib.org).pdf"          # Path to your PDF file
COLLECTION_NAME = "my_book"          # Name for the ChromaDB collection (like a table name)
EMBED_MODEL     = "nomic-embed-text" # Ollama embedding model (fast, free, local)
LLM_MODEL       = "llama3.2"         # Ollama LLM model that answers your questions
CHUNK_SIZE      = 500                # How many characters per chunk (tune this: 300–700 works well)
CHUNK_OVERLAP   = 50                 # Characters shared between consecutive chunks
                                     # Overlap prevents an answer from being cut in half at a boundary
TOP_K           = 5                  # How many chunks to retrieve per question


# ──────────────────────────────────────────────────────────────
# STEP 1 — PDF PARSING
# Extract all text from every page of the PDF.
# ──────────────────────────────────────────────────────────────

def load_pdf(path: str) -> list[dict]:
    """
    Opens the PDF and reads every page.

    Returns a list of dicts, one per page:
        { "text": "...", "page": 1 }

    We keep track of page numbers so later we can tell the user
    *where* in the book an answer came from.
    """
    pages = []
    doc = pymupdf.open(path)          # Open the PDF (works with .pdf, not scanned images)

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()        # Extract raw text from this page
        text = clean_text(text)       # Remove noise (extra whitespace, weird characters)

        if text.strip():              # Skip blank pages
            pages.append({
                "text": text,
                "page": page_num
            })

    doc.close()
    print(f"✅ Loaded {len(pages)} pages from '{path}'")
    return pages


def clean_text(text: str) -> str:
    """
    Cleans raw PDF text before chunking.

    PDF extraction often includes:
      - Multiple consecutive spaces or tabs
      - Weird hyphenation at line breaks (e.g. "inter-\nnational")
      - Extra blank lines

    This function normalises all of that.
    """
    text = re.sub(r'-\n', '', text)        # Rejoin hyphenated words split across lines
    text = re.sub(r'\n+', ' ', text)       # Replace all newlines with a single space
    text = re.sub(r'\s+', ' ', text)       # Collapse multiple spaces into one
    return text.strip()


# ──────────────────────────────────────────────────────────────
# STEP 2 — TEXT CHUNKING
# Split each page's text into smaller, overlapping pieces.
#
# WHY CHUNK?
#   A 500-page book is ~250,000 words — too large to send to an LLM.
#   We split it into bite-sized chunks, embed each one, and at query
#   time retrieve only the *relevant* chunks (typically 3–5).
#
# WHY OVERLAP?
#   If a sentence starts at position 498 of a 500-char chunk, it gets
#   cut off. Overlapping means the next chunk starts 50 chars earlier,
#   so that sentence appears fully in at least one chunk.
# ──────────────────────────────────────────────────────────────

def chunk_pages(pages: list[dict], chunk_size: int, overlap: int) -> list[dict]:
    """
    Splits page text into overlapping chunks.

    Returns a list of chunk dicts:
        { "text": "...", "page": 3, "chunk_id": "page_3_chunk_0" }

    chunk_id is a unique string used to identify each chunk in ChromaDB.
    """
    chunks = []

    for page in pages:
        text = page["text"]
        page_num = page["page"]
        start = 0
        chunk_index = 0

        while start < len(text):
            end = start + chunk_size               # End of this chunk
            chunk_text = text[start:end]           # Slice out the chunk

            chunks.append({
                "text":     chunk_text,
                "page":     page_num,
                "chunk_id": f"page_{page_num}_chunk_{chunk_index}"
            })

            start += chunk_size - overlap          # Move forward, but back-step by `overlap`
            chunk_index += 1

    print(f"✅ Created {len(chunks)} chunks  "
          f"(chunk_size={chunk_size}, overlap={overlap})")
    return chunks


# ──────────────────────────────────────────────────────────────
# STEP 3 — EMBEDDINGS
# Convert each chunk of text into a vector (a list of numbers).
#
# WHY?
#   Vectors encode *meaning*. Two chunks about the same topic will
#   have vectors that point in similar directions, even if they use
#   different words. This is what lets us do semantic search.
#
# MODEL: nomic-embed-text (free, runs locally via Ollama, 768 dims)
# ──────────────────────────────────────────────────────────────

def embed_text(text: str) -> list[float]:
    """
    Calls the local Ollama embedding model and returns a vector.

    The vector is a list of ~768 floats that represent the meaning
    of the input text in high-dimensional space.
    """
    response = ollama.embeddings(
        model=EMBED_MODEL,
        prompt=text
    )
    return response["embedding"]   # A list like [0.021, -0.104, 0.338, ...]


# ──────────────────────────────────────────────────────────────
# STEP 4 — VECTOR DATABASE (ChromaDB)
# Store all chunk embeddings in a searchable local database.
#
# ChromaDB saves everything to disk in a local folder called
# "chroma_db". You only need to run ingestion ONCE per book.
# After that, just load the existing collection and query it.
# ──────────────────────────────────────────────────────────────

def get_or_create_collection(collection_name: str):
    """
    Connects to (or creates) a persistent ChromaDB collection on disk.

    - PersistentClient saves data to './chroma_db' between runs.
    - get_or_create_collection means: use existing if it exists, else make a new one.
    """
    client = chromadb.PersistentClient(path="./chroma_db")   # Data saved to disk here
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}   # Use cosine similarity for vector search
    )
    return collection


def ingest_chunks(collection, chunks: list[dict]) -> None:
    """
    Embeds every chunk and stores it in ChromaDB.

    ChromaDB stores three things per chunk:
      - documents: the raw text (so we can return it later)
      - embeddings: the vector (so we can search by similarity)
      - metadatas: extra info like page number (for citations)
      - ids: unique string identifier for each chunk

    We batch in groups of 50 to avoid memory spikes on large books.
    """
    BATCH_SIZE = 50
    total = len(chunks)

    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]

        documents  = [c["text"]     for c in batch]
        metadatas  = [{"page": c["page"]} for c in batch]
        ids        = [c["chunk_id"] for c in batch]
        embeddings = [embed_text(c["text"]) for c in batch]   # ← the expensive step

        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"  Ingested {min(i + BATCH_SIZE, total)}/{total} chunks...")

    print("✅ All chunks stored in ChromaDB")


# ──────────────────────────────────────────────────────────────
# STEP 5 — RETRIEVAL
# Given a question, find the most relevant chunks.
#
# HOW IT WORKS:
#   1. Embed the question into a vector
#   2. Ask ChromaDB: "which stored vectors are closest to this one?"
#   3. ChromaDB returns the TOP_K most similar chunks
#
# This is "semantic search" — it matches meaning, not keywords.
# ──────────────────────────────────────────────────────────────

def retrieve_chunks(collection, question: str, top_k: int) -> list[dict]:
    """
    Searches the vector DB for chunks most relevant to the question.

    Returns a list of result dicts:
        { "text": "...", "page": 42, "distance": 0.12 }

    Lower distance = more similar to the question.
    """
    question_vector = embed_text(question)   # Embed the question the same way as chunks

    results = collection.query(
        query_embeddings=[question_vector],  # Search against this vector
        n_results=top_k,                     # Return the top K matches
        include=["documents", "metadatas", "distances"]
    )

    # Unpack ChromaDB's response structure into clean dicts
    retrieved = []
    for text, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        retrieved.append({
            "text":     text,
            "page":     meta["page"],
            "distance": round(dist, 4)
        })

    return retrieved


# ──────────────────────────────────────────────────────────────
# STEP 6 — GENERATION
# Send the retrieved chunks + question to the LLM and get an answer.
#
# This is the "Augmented Generation" part of RAG.
# The LLM only sees the retrieved context, not the whole book.
# The system prompt tells it to stay grounded in that context.
# ──────────────────────────────────────────────────────────────

def build_prompt(question: str, retrieved_chunks: list[dict]) -> str:
    """
    Builds the full prompt that gets sent to the LLM.

    Structure:
      [System instruction]
      [Chunk 1 — with page citation]
      [Chunk 2 — with page citation]
      ...
      [User's question]

    Including page numbers lets the LLM cite sources in its answer.
    """
    context_parts = []
    for chunk in retrieved_chunks:
        context_parts.append(f"[Page {chunk['page']}]\n{chunk['text']}")

    context = "\n\n---\n\n".join(context_parts)   # Separate chunks visually

    prompt = f"""You are a helpful assistant answering questions about a book.
Use ONLY the context passages below to answer. If the answer isn't in the context, say so.
Always mention which page(s) your answer comes from.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
    return prompt


def generate_answer(question: str, retrieved_chunks: list[dict]) -> str:
    """
    Sends the prompt to the local Llama 3.2 model via Ollama
    and returns the generated answer as a string.
    """
    prompt = build_prompt(question, retrieved_chunks)

    response = ollama.chat(
        model=LLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    return response["message"]["content"]


# ──────────────────────────────────────────────────────────────
# MAIN PIPELINE
# Combines all steps above into two public functions:
#   ingest(pdf_path) — run once per book
#   ask(question)    — run as many times as you like
# ──────────────────────────────────────────────────────────────

def ingest(pdf_path: str = PDF_PATH) -> None:
    """
    Full ingestion pipeline: PDF → chunks → embeddings → ChromaDB.

    Run this ONCE per book. Takes a few minutes for 500 pages.
    After it finishes, the data is saved to ./chroma_db on disk.
    """
    print(f"\n📖 Starting ingestion of '{pdf_path}' ...\n")

    pages  = load_pdf(pdf_path)                            # Step 1: extract text
    chunks = chunk_pages(pages, CHUNK_SIZE, CHUNK_OVERLAP) # Step 2: split into chunks
    coll   = get_or_create_collection(COLLECTION_NAME)     # Step 3: connect to DB
    ingest_chunks(coll, chunks)                            # Step 4: embed + store

    print("\n🎉 Ingestion complete! You can now ask questions.\n")


def ask(question: str) -> str:
    """
    Full query pipeline: question → retrieve chunks → generate answer.

    Assumes ingestion has already been run (./chroma_db exists).
    Call this as many times as you like — it's fast (a few seconds).
    """
    coll      = get_or_create_collection(COLLECTION_NAME)      # Load existing DB
    chunks    = retrieve_chunks(coll, question, TOP_K)          # Find relevant chunks
    answer    = generate_answer(question, chunks)               # Ask the LLM

    # Print source pages so you can verify the answer
    pages_used = sorted(set(c["page"] for c in chunks))
    print(f"\n📄 Sources: pages {pages_used}")

    return answer


# ──────────────────────────────────────────────────────────────
# ENTRY POINT
# Run the script directly to ingest your PDF and start a Q&A loop.
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":

    # ── INGESTION (comment this out after the first run) ──────
    ingest(PDF_PATH)

    # ── INTERACTIVE Q&A LOOP ──────────────────────────────────
    print("💬 Ask anything about your book. Type 'quit' to exit.\n")

    while True:
        question = input("You: ").strip()

        if not question:
            continue
        if question.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break

        answer = ask(question)
        print(f"\nAssistant: {answer}\n")
