import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const chunks = [
  { page: 47, preview: '"The chapter opens with a vivid description…"', score: 0.9821 },
  { page: 53, preview: '"Authority is depicted as both visible and…"', score: 0.9743 },
  { page: 55, preview: '"Through a series of flashbacks, the narrat…"', score: 0.9601 },
  { page: 51, preview: '"Cultural identity becomes a battleground…"', score: 0.948 },
  { page: 58, preview: '"Loss permeates the final pages of the chap…"', score: 0.9102 },
];

const getScoreColor = (score: number) => {
  if (score >= 0.97) return "text-status-green";
  if (score >= 0.95) return "text-status-amber";
  return "text-muted-foreground";
};

const ChunksTable = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <h2 className="text-sm font-semibold">Retrieved Chunks (last query)</h2>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="overflow-x-auto">
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
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3 font-mono">p. {chunk.page}</td>
                  <td className="px-3 py-3 text-muted-foreground italic truncate max-w-md">{chunk.preview}</td>
                  <td className={`px-5 py-3 text-right font-mono font-medium ${getScoreColor(chunk.score)}`}>
                    {chunk.score.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChunksTable;
