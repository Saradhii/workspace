"use client";

import { useMemo } from "react";
import { useRagStudio } from "../lib/use-rag-studio";
import { LibraryPanel } from "./library-panel";
import { AskPanel } from "./ask-panel";
import { InspectorPanel } from "./inspector-panel";
import { PipelineRail } from "./pipeline-rail";

/**
 * Three-pane RAG workbench:
 *   Knowledge base (sources + pipeline state) · Ask (grounded chat) · Inspector (chunks, settings, index)
 */
export function RAGStudioMain({ toolbar }: { toolbar?: React.ReactNode }) {
  const studio = useRagStudio();
  const runningStages = useMemo(
    () => new Set(Object.values(studio.running).filter(Boolean) as string[]),
    [studio.running]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PipelineRail counts={studio.counts} runningStages={runningStages} ready={studio.counts.indexed > 0} />
        {toolbar}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <LibraryPanel studio={studio} />
        <AskPanel studio={studio} />
        <InspectorPanel studio={studio} className="lg:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
