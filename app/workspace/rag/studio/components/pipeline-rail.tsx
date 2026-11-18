"use client";

import { motion } from "motion/react";
import { Database, FileUp, MessageSquareText, Scissors, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  total: number;
  active: boolean;
}

/**
 * Compact horizontal rail summarising the whole knowledge base:
 * how many documents have reached each pipeline stage.
 */
export function PipelineRail({
  counts,
  runningStages,
  ready,
}: {
  counts: { total: number; chunked: number; embedded: number; indexed: number };
  runningStages: Set<string>;
  ready: boolean;
}) {
  const steps: Step[] = [
    { key: "ingest", label: "Extract", icon: FileUp, value: counts.total, total: counts.total, active: false },
    { key: "chunk", label: "Chunk", icon: Scissors, value: counts.chunked, total: counts.total, active: runningStages.has("chunk") },
    { key: "embed", label: "Embed", icon: Sparkles, value: counts.embedded, total: counts.total, active: runningStages.has("embed") },
    { key: "index", label: "Index", icon: Database, value: counts.indexed, total: counts.total, active: runningStages.has("index") },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
      {steps.map((step, i) => {
        const complete = step.total > 0 && step.value === step.total && !step.active;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1.5 shrink-0">
            <div
              className={cn(
                "relative flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors",
                step.active
                  ? "border-violet-400/40 bg-violet-500/10 text-violet-200"
                  : complete
                    ? "border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-200"
                    : "border-white/[0.08] bg-white/[0.02] text-neutral-400"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-medium">{step.label}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-70">
                {step.value}/{step.total}
              </span>
              {step.active && (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-violet-400/50"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
            </div>
            <Connector active={steps[i + 1]?.active || step.active} />
          </div>
        );
      })}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          ready
            ? "border-cyan-300/30 bg-gradient-to-r from-violet-500/15 to-cyan-400/15 text-cyan-100"
            : "border-white/[0.08] text-neutral-500"
        )}
      >
        <MessageSquareText className="h-3.5 w-3.5" />
        {ready ? "Ready to ask" : "Ask"}
      </div>
    </div>
  );
}

function Connector({ active }: { active?: boolean }) {
  return (
    <span className="relative block h-px w-4 overflow-hidden bg-white/10">
      {active && (
        <motion.span
          className="absolute inset-y-0 w-2 bg-gradient-to-r from-transparent via-violet-300 to-transparent"
          initial={{ x: -8 }}
          animate={{ x: 16 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      )}
    </span>
  );
}
