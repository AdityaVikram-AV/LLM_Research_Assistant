import { BookOpen } from "lucide-react";

const Header = () => (
  <div className="text-center py-8">
    <div className="inline-flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
        <BookOpen className="h-5 w-5 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Llama Research Assistant</h1>
    </div>
    <p className="text-muted-foreground text-sm">
      Retrieval-Augmented Generation · Fully Local · Free
    </p>
    <p className="text-muted-foreground/60 text-xs mt-1 font-mono">
      Powered by Ollama + ChromaDB + Llama 3.2
    </p>
  </div>
);

export default Header;
