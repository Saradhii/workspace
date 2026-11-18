"use client";

import { cn } from "@/lib/utils";
import type { StageId, StageState } from "../lib/types";

const ORDER: StageId[] = ["ingest", "chunk", "embed", "index"];
const LABEL: Record<StageId, string> = {
  ingest: "Extracted",
  chunk: "Chunked",
  embed: "Embedded",
  index: "Indexed",
};

const FAILED: Record<StageId, string> = {
  ingest: "Extraction",
  chunk: "Chunking",
  embed: "Embedding",
  index: "Indexing",
};

export const stateTone: Record<StageState, string> = {
  todo: "bg-white/[0.08]",
  running: "bg-violet-400/80 animate-pulse",
  done: "bg-emerald-400/90",
  error: "bg-rose-500",
};

/** Four-segment progress bar showing where a document sits in the pipeline. */
export function StageTrack({
  stages,
  className,
}: {
  stages: Record<StageId, StageState>;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="list" aria-label="Pipeline progress">
      {ORDER.map((s) => (
        <span
          key={s}
          role="listitem"
          title={`${LABEL[s]}: ${stages[s]}`}
          className={cn("h-1 flex-1 rounded-full transition-colors duration-500", stateTone[stages[s]])}
        />
      ))}
    </div>
  );
}

export function stageSummary(stages: Record<StageId, StageState>, runningLabel?: string) {
  if (runningLabel) return runningLabel;
  const failed = ORDER.find((s) => stages[s] === "error");
  if (failed) return `${FAILED[failed]} failed`;
  if (stages.index === "done") return "Ready";
  if (stages.embed === "done") return "Needs indexing";
  if (stages.chunk === "done") return "Needs embeddings";
  return "Needs chunking";
}
