import { useState } from "react";
import { Send, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: string;
  thinking?: boolean;
}

const sampleMessages: Message[] = [
  {
    role: "user",
    content: "What are the main themes explored in chapter 3?",
    time: "10:42 am",
  },
  {
    role: "assistant",
    time: "10:42 am",
    content: `Chapter 3 explores three central themes:

1. **Identity and belonging** — the protagonist struggles to reconcile their cultural roots with their new environment. (p. 47–51)

2. **Power and resistance** — the author contrasts formal authority with grassroots organising. (p. 53)

3. **Memory and loss** — flashback sequences show how characters reconstruct the past. (p. 55–58)`,
    sources: "Pages 47, 51, 53, 55, 58",
  },
  {
    role: "user",
    content: "Who is the antagonist and what motivates them?",
    time: "10:44 am",
  },
  {
    role: "assistant",
    content: "",
    time: "",
    thinking: true,
  },
];

const ChatSection = () => {
  const [input, setInput] = useState("");

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/40">
        <h2 className="text-sm font-semibold">Step 2 — Ask Your Book</h2>
        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">2/2</span>
      </div>

      {/* Collection info */}
      <div className="flex items-center gap-4 px-5 py-3 border-b text-sm">
        <div className="flex items-center gap-1.5 text-primary font-medium">
          <BookOpen className="h-4 w-4" />
          my_book
        </div>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground font-mono text-xs">1,960 chunks</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground font-mono text-xs">500 pages indexed</span>
      </div>

      {/* Chat area */}
      <div className="p-5">
        <div className="rounded-lg border bg-muted/20 p-4 space-y-4 max-h-[420px] overflow-y-auto mb-4">
          {sampleMessages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg p-4 ${
                msg.role === "user" ? "bg-chat-user" : "bg-chat-assistant"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">
                  {msg.role === "user" ? "🧑" : "🤖"}
                </span>
                <span className="text-xs font-semibold">
                  {msg.role === "user" ? "You" : "Assistant"}
                </span>
                {msg.time && (
                  <span className="text-xs text-muted-foreground">· {msg.time}</span>
                )}
                {msg.thinking && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                    thinking...
                  </span>
                )}
              </div>

              {msg.thinking ? (
                <div className="h-4 w-48 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
              ) : (
                <>
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {msg.content.split("**").map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j}>{part}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                  {msg.sources && (
                    <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
                      📄 Sources used: {msg.sources}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your book..."
            className="flex-1"
          />
          <Button className="gap-1.5 px-5">
            Send
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
