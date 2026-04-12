const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function ingestBook(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Ingestion failed: ${res.statusText}`);
  }
  return res.json();
}

export async function queryBook(question: string) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    throw new Error(`Query failed: ${res.statusText}`);
  }
  return res.json();
}

export async function getCollectionInfo() {
  const res = await fetch(`${API_BASE}/collection-info`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch collection info");
  }
  return res.json();
}