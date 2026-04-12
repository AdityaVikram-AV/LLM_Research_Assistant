import { useEffect, useState } from "react";

interface Status {
  label: string;
  status: string;
  healthy: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const StatusBar = () => {
  const [statuses, setStatuses] = useState<Status[]>([
    { label: "Ollama", status: "Loading...", healthy: false },
    { label: "ChromaDB", status: "Loading...", healthy: false },
    { label: "nomic-embed", status: "Loading...", healthy: false },
    { label: "llama3.2", status: "Loading...", healthy: false },
  ]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/status`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();

        setStatuses([
          {
            label: "Ollama",
            status: data.data?.ollama || "Unknown",
            healthy: data.data?.ollama === "running",
          },
          {
            label: "ChromaDB",
            status: data.data?.chromadb || "Unknown",
            healthy: data.data?.chromadb === "connected",
          },
          {
            label: "nomic-embed",
            status: data.data?.embed_model || "Unknown",
            healthy: true,
          },
          {
            label: "llama3.2",
            status: data.data?.llm_model || "Unknown",
            healthy: true,
          },
        ]);
      } catch (error) {
        setStatuses((prev) =>
          prev.map((s) => ({ ...s, status: "Error", healthy: false }))
        );
      }
    };

    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        System Status
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statuses.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2.5 rounded-md bg-accent/50 px-3 py-2.5"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-40 ${
                  s.healthy ? "animate-ping bg-status-green" : "bg-destructive"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  s.healthy ? "bg-status-green" : "bg-destructive"
                }`}
              />
            </span>
            <div>
              <p className="text-sm font-medium leading-none">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusBar;
