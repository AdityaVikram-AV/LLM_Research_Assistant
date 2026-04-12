import { useState } from "react";
import Header from "@/components/rag/Header";
import StatusBar from "@/components/rag/StatusBar";
import IngestSection from "@/components/rag/IngestSection";
import ChatSection from "@/components/rag/ChatSection";
import ChunksTable from "@/components/rag/ChunksTable";
import QuickActions from "@/components/rag/QuickActions";

interface Chunk {
  page: number;
  text: string;
  distance: number;
}

const Index = () => {
  const [chunks, setChunks] = useState<Chunk[]>([]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <Header />
        <div className="space-y-5">
          <StatusBar />
          <IngestSection />
          <ChatSection onChunksReceived={setChunks} />
          <ChunksTable chunks={chunks} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Index;
