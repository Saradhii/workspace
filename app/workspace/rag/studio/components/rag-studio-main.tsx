"use client";

import { useState } from "react";
import { BentoGrid } from "@/components/ui/bento-grid";
import { PipelineVisualizer } from "./pipeline-visualizer";
import { DocumentIngestionCard } from "./document-ingestion-card";
import { TextProcessingCard } from "./text-processing-card";
import { EmbeddingCard } from "./embedding-card";
import { VectorStoreCard } from "./vector-store-card";
import { QueryInterfaceCard } from "./query-interface-card";
import { ResultsCard } from "./results-card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export function RAGStudioMain() {
  const [pipelineStatus, setPipelineStatus] = useState({
    ingestion: "idle",
    processing: "idle",
    embedding: "idle",
    storage: "idle",
    query: "idle",
    results: "idle",
  });

  return (
    <div className="w-full min-h-full space-y-4">
      {/* Pipeline Visualization Header */}
      <div>
        <PipelineVisualizer status={pipelineStatus} />
      </div>

      {/* Main Bento Grid - Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DocumentIngestionCard
          onStatusChange={(status) =>
            setPipelineStatus(prev => ({ ...prev, ingestion: status }))
          }
        />
        <TextProcessingCard
          onStatusChange={(status) =>
            setPipelineStatus(prev => ({ ...prev, processing: status }))
          }
        />
        <EmbeddingCard
          onStatusChange={(status) =>
            setPipelineStatus(prev => ({ ...prev, embedding: status }))
          }
        />
        <VectorStoreCard
          onStatusChange={(status) =>
            setPipelineStatus(prev => ({ ...prev, storage: status }))
          }
        />
        <QueryInterfaceCard
          onStatusChange={(status) =>
            setPipelineStatus(prev => ({ ...prev, query: status }))
          }
        />
        <ResultsCard
          onStatusChange={(status) =>
            setPipelineStatus(prev => ({ ...prev, results: status }))
          }
        />
      </div>
    </div>
  );
}
