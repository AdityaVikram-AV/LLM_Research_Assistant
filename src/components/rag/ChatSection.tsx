import { useState, useRef, useEffect } from "react";
import { Send, BookOpen } from "lucide-react";
import { queryBook, getCollectionInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: string;
  thinking?: boolean;
}

interface Chunk {
  page: number;
  text: string;
  distance: number;
}

interface ChatSectionProps {
  onChunksReceived?: (chunks: Chunk[]) => void;
}

const ChatSection = ({ onChunksReceived }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chunksCount, setChunksCount] = useState(0);
  const [maxPage, setMaxPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch collection info on mount
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await getCollectionInfo();
        if (info.status === "success") {
          setChunksCount(info.chunks_count);
          setMaxPage(info.max_page);
        }
      } catch (error) {
        console.error("Failed to fetch collection info:", error);
      }
    };
    fetchInfo();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add thinking message
    const thinkingMessage: Message = {
      role: "assistant",
      content: "",
      time: "",
      thinking: true,
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const response = await queryBook(input);

      // Check if response is an error
      if (response.status === "error") {
        throw new Error(response.message);
      }

      // Pass chunks to parent component
      if (onChunksReceived && response.chunks) {
        onChunksReceived(
          response.chunks.map((c: any) => ({
            page: c.page,
            text: c.text,
            distance: c.distance,
          }))
        );
      }

      // Remove thinking message and add real answer
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.thinking);
        const pagesUsed = response.chunks
          .map((c: { page: number }) => c.page)
          .filter((p: number, i: number, arr: number[]) => arr.indexOf(p) === i)
          .sort((a: number, b: number) => a - b)
          .join(", ");

        const assistantMessage: Message = {
          role: "assistant",
          content: response.answer,
          time: getCurrentTime(),
          sources: `Pages ${pagesUsed}`,
        };
        return [...filtered, assistantMessage];
      });
    } catch (error) {
      // Remove thinking message and add error
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.thinking);
        const errorMessage: Message = {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Failed to get a response.",
          time: getCurrentTime(),
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <span className="text-muted-foreground font-mono text-xs">
          {chunksCount.toLocaleString()} chunks
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground font-mono text-xs">
          {maxPage} pages indexed
        </span>
      </div>

      {/* Chat area */}
      <div className="p-5">
        <div
          ref={scrollRef}
          className="rounded-lg border bg-muted/20 p-4 space-y-4 max-h-[420px] overflow-y-auto mb-4"
        >
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">
                No messages yet. Ask a question about your book to get started.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
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
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleSendMessage();
              }
            }}
            placeholder="Ask a question about your book..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            className="gap-1.5 px-5"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            Send
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
