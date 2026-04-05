const statuses = [
  { label: "Ollama", status: "Running" },
  { label: "ChromaDB", status: "Connected" },
  { label: "nomic-embed", status: "Loaded" },
  { label: "llama3.2", status: "Ready" },
];

const StatusBar = () => (
  <div className="rounded-lg border bg-card p-4">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      System Status
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statuses.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 rounded-md bg-accent/50 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-green opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-green" />
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

export default StatusBar;
