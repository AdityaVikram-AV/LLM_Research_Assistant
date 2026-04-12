import { useRef, useState } from "react";
import { Upload, FolderOpen, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { ingestBook } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const progressSteps = [
  { label: "Parsing PDF", current: 312, total: 500, unit: "pages" },
  { label: "Chunking text", current: 1240, total: 1960, unit: "chunks" },
  { label: "Embedding", current: 620, total: 1960, unit: "chunks" },
  { label: "Storing in DB", current: 310, total: 1960, unit: "chunks" },
];

const IngestSection = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartIngestion = async () => {
    if (!selectedFile) {
      setErrorMessage("Please choose a PDF file before starting ingestion.");
      return;
    }

    setIngesting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await ingestBook(selectedFile);
      setStatusMessage("Ingestion completed successfully.");
      setSelectedFile(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Ingestion failed.";
      console.error("Ingest error:", errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/40">
        <h2 className="text-sm font-semibold">Step 1 — Ingest Your Book</h2>
        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          1/2
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* File input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={selectedFile?.name ?? "Select a PDF file..."}
              readOnly
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={handleBrowseClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="icon" onClick={handleBrowseClick}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {statusMessage}
          </div>
        )}

        {/* Advanced settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          {showAdvanced ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Advanced Settings
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-md border bg-muted/30 p-4">
            <div>
              <label className="text-xs text-muted-foreground">Chunk Size</label>
              <div className="flex items-center gap-1.5 mt-1">
                <Input defaultValue="500" className="font-mono text-sm h-8" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">chars</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Overlap</label>
              <div className="flex items-center gap-1.5 mt-1">
                <Input defaultValue="50" className="font-mono text-sm h-8" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">chars</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Top K</label>
              <div className="flex items-center gap-1.5 mt-1">
                <Input defaultValue="5" className="font-mono text-sm h-8" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Embed Model</label>
              <select className="mt-1 w-full rounded-md border bg-card px-2 py-1.5 text-sm font-mono h-8">
                <option>nomic-embed-text</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">LLM Model</label>
              <select className="mt-1 w-full rounded-md border bg-card px-2 py-1.5 text-sm font-mono h-8">
                <option>llama3.2</option>
              </select>
            </div>
          </div>
        )}

        {/* Start button */}
        <Button className="w-full gap-2" size="lg" onClick={handleStartIngestion} disabled={ingesting}>
          <Rocket className="h-4 w-4" />
          {ingesting ? "Ingesting…" : "Start Ingestion"}
        </Button>

        {/* Progress */}
        {ingesting && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h4>
            {progressSteps.map((step) => {
              const pct = Math.round((step.current / step.total) * 100);
              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{step.label}</span>
                    <span className="text-muted-foreground font-mono">
                      {step.current.toLocaleString()} / {step.total.toLocaleString()} {step.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-progress-track overflow-hidden">
                    <div
                      className="h-full rounded-full bg-progress-fill transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground font-mono">
              ⏱ Elapsed: 2m 14s &nbsp;·&nbsp; Est. remaining: 3m 40s
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngestSection;
