import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Chunk {
  page: number;
  text: string;
  distance: number;
}

interface ChunksTableProps {
  chunks: Chunk[];
}

const getScoreColor = (score: number) => {
  if (score >= 0.97) return "text-status-green";
  if (score >= 0.95) return "text-status-amber";
  return "text-muted-foreground";
};

const ChunksTable = ({ chunks }: ChunksTableProps) => {
  const [open, setOpen] = useState(true);

  const getPreview = (text: string, length: number = 60) => {
    return text.length > length ? text.substring(0, length) + "…" : text;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
        type="button"
      >
        <h2 className="text-sm font-semibold">
          Retrieved Chunks {chunks.length > 0 && `(${chunks.length})`}
        </h2>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="overflow-x-auto">
          {chunks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground">
                No chunks retrieved yet. Ask a question to see results.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium w-10">#</th>
                  <th className="px-3 py-2.5 text-left font-medium w-20">Page</th>
                  <th className="px-3 py-2.5 text-left font-medium">Preview</th>
                  <th className="px-5 py-2.5 text-right font-medium w-20">Score</th>
                </tr>
              </thead>
              <tbody>
                {chunks.map((chunk, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-3 font-mono">p. {chunk.page}</td>
                    <td className="px-3 py-3 text-muted-foreground italic truncate max-w-md">
                      "{getPreview(chunk.text)}"
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-mono font-medium ${
                        getScoreColor(chunk.distance)
                      }`}
                    >
                      {chunk.distance.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ChunksTable;
