# ResearchGPT - Llama Research Assistant

A fully local, AI-powered research assistant that lets you upload PDFs and ask questions using retrieval-augmented generation (RAG). Powered by Ollama, ChromaDB, and Llama 3.2.

## Features

- 📄 **PDF Upload & Ingestion** - Upload PDFs and automatically extract and index content
- 🤖 **AI-Powered Q&A** - Ask natural language questions about your documents
- 🔍 **Source Attribution** - Get page numbers and referenced chunks for every answer
- 📊 **Real-time Status Monitoring** - Check Ollama and ChromaDB health in real-time
- 🏠 **Fully Local** - No cloud dependencies, complete privacy
- ⚡ **Fast & Responsive** - Built with React, Vite, and FastAPI

## Tech Stack

**Frontend:**
- React with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Radix UI components

**Backend:**
- FastAPI (Python)
- ChromaDB (vector database)
- Ollama (LLM & embeddings)
- PyMuPDF (PDF processing)

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16+) - [Download](https://nodejs.org/)
2. **Python** (v3.8+) - [Download](https://www.python.org/)
3. **Ollama** - [Download](https://ollama.ai/)
   - Required models (pull these first):
     ```bash
     ollama pull nomic-embed-text
     ollama pull llama3.2
     ```

## Installation

### 1. Clone or Navigate to Project

```bash
cd LLM_Research_Assistant
```

### 2. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
npm install
```

## Setup

### 1. Start Ollama

Before running the backend, ensure Ollama is running:

```bash
# macOS (if not running as daemon):
ollama serve

# Or ensure the Ollama app is running
```

Pull the required models (if not already done):
```bash
ollama pull nomic-embed-text
ollama pull llama3.2
```

### 2. Start Backend Server

In a terminal window, run:

```bash
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Start Frontend Development Server

In another terminal window, run:

```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## Usage

1. **Ingest a PDF:**
   - Click "Step 1 — Choose a Book" 
   - Select a PDF file from your computer
   - Click "Ingest Book"
   - Wait for the ingestion to complete

2. **Ask Questions:**
   - Once ingestion is complete, go to "Step 2 — Ask Your Book"
   - Type your question in the input field
   - Press Enter or click "Send"
   - View the AI response with page sources

3. **Monitor System:**
   - Check the "System Status" section to ensure Ollama and ChromaDB are running
   - All indicators should be green

## API Endpoints

- `GET /status` - Check system health (Ollama, ChromaDB, models)
- `POST /ingest` - Upload and ingest a PDF file
- `GET /collection-info` - Get collection metadata (chunk count, pages)
- `POST /query` - Query the ingested documents

## Configuration

You can customize the collection name using environment variables:

```bash
export COLLECTION_NAME=my_custom_collection
python server.py
```

Default collection name: `my_book`

## Troubleshooting

### Models not found error
```
Error: model "nomic-embed-text" not found
```
**Solution:** Pull the models first:
```bash
ollama pull nomic-embed-text
ollama pull llama3.2
```

### Backend won't start
- Ensure Ollama is running
- Check that port 8000 is available
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend can't connect to backend
- Make sure backend is running on `http://localhost:8000`
- Clear browser cache and refresh
- Check browser console (F12) for network errors

### Ingestion fails
- Ensure the PDF file is valid
- Check that ChromaDB is accessible
- Monitor backend terminal for error messages

## Folder Structure

```
LLM_Research_Assistant/
├── src/
│   ├── components/
│   │   └── rag/           # RAG-specific components
│   ├── lib/
│   │   └── api.ts         # API client
│   └── pages/
│       └── Index.tsx      # Main application page
├── server.py              # FastAPI backend
├── Research_Assistant_RAG.py  # RAG logic
├── requirements.txt       # Python dependencies
└── package.json          # Node.js dependencies
```

## Development

### Build for Production

Frontend:
```bash
npm run build
```

### Run Tests

```bash
npm run test
```

## Performance Notes

- First query may take 10-30 seconds as the LLM initializes
- Subsequent queries are faster as the model stays in memory
- Ingestion time depends on PDF size (typically 5-15 seconds)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please check the troubleshooting section or review the browser console (F12) and backend terminal logs for error messages.

---

**Happy researching! 🚀**
