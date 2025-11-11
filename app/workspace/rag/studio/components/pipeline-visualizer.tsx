"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileUp,
  Scissors,
  Sparkles,
  Database,
  Search,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface PipelineVisualizerProps {
  status: {
    ingestion: string;
    processing: string;
    embedding: string;
    storage: string;
    query: string;
    results: string;
  };
}

const stages = [
  {
    id: "ingestion",
    label: "Ingest",
    icon: FileUp,
    description: "Upload and ingest documents"
  },
  {
    id: "processing",
    label: "Process",
    icon: Scissors,
    description: "Split text into chunks"
  },
  {
    id: "embedding",
    label: "Embed",
    icon: Sparkles,
    description: "Generate vector embeddings"
  },
  {
    id: "storage",
    label: "Store",
    icon: Database,
    description: "Store in vector database"
  },
  {
    id: "query",
    label: "Query",
    icon: Search,
    description: "Semantic search query"
  },
  {
    id: "results",
    label: "Results",
    icon: MessageSquare,
    description: "Retrieve and display results"
  },
];

export function PipelineVisualizer({ status }: PipelineVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getStatusColor = (stageStatus: string) => {
    switch (stageStatus) {
      case "active":
        return {
          bg: "bg-gradient-to-br from-green-500/30 to-emerald-500/20",
          border: "border-green-500/50",
          text: "text-green-400",
          glow: "shadow-lg shadow-green-500/30",
          gradientStart: "#10b981",
          gradientStop: "#059669",
        };
      case "processing":
        return {
          bg: "bg-gradient-to-br from-blue-500/30 to-purple-500/20",
          border: "border-blue-500/50",
          text: "text-blue-400",
          glow: "shadow-lg shadow-blue-500/30",
          gradientStart: "#3b82f6",
          gradientStop: "#8b5cf6",
        };
      case "error":
        return {
          bg: "bg-gradient-to-br from-red-500/30 to-rose-500/20",
          border: "border-red-500/50",
          text: "text-red-400",
          glow: "shadow-lg shadow-red-500/30",
          gradientStart: "#ef4444",
          gradientStop: "#f43f5e",
        };
      default:
        return {
          bg: "bg-muted/50",
          border: "border-muted-foreground/20",
          text: "text-muted-foreground",
          glow: "",
          gradientStart: "#6b7280",
          gradientStop: "#9ca3af",
        };
    }
  };

  const isStageActive = (stageStatus: string) => {
    return stageStatus === "active" || stageStatus === "processing";
  };

  return (
    <TooltipProvider>
      <Card className="relative p-6 bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
        <div
          ref={containerRef}
          className="relative flex items-center justify-between gap-8 min-h-[100px]"
        >
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const stageStatus = status[stage.id as keyof typeof status];
            const colors = getStatusColor(stageStatus);
            const isActive = isStageActive(stageStatus);

            return (
              <div key={stage.id} className="flex flex-col items-center gap-2 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      ref={(el) => {
                        stageRefs.current[index] = el;
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-500 backdrop-blur-sm cursor-pointer",
                        colors.bg,
                        colors.border,
                        colors.text,
                        colors.glow,
                        stageStatus === "processing" && "animate-pulse"
                      )}
                    >
                      <Icon className="h-6 w-6 relative z-10" />

                      {/* Border Beam for active/processing stages */}
                      {isActive && (
                        <BorderBeam
                          size={80}
                          duration={3}
                          delay={index * 0.2}
                          colorFrom={colors.gradientStart}
                          colorTo={colors.gradientStop}
                          borderWidth={2}
                        />
                      )}

                      {/* Processing indicator */}
                      {stageStatus === "processing" && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-background"></span>
                        </span>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">{stage.label}</p>
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                      <p className="text-xs mt-1 capitalize">Status: {stageStatus}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className={cn(
                    "text-xs font-medium text-center transition-colors",
                    colors.text
                  )}
                >
                  {stage.label}
                </motion.span>
              </div>
            );
          })}

          {/* Animated Beams connecting stages */}
          {stages.map((stage, index) => {
            if (index < stages.length - 1) {
              const currentStatus = status[stage.id as keyof typeof status];
              const nextStage = stages[index + 1];
              const nextStatus = status[nextStage.id as keyof typeof status];

              // Only show beam if current stage is active/processing
              const shouldAnimate = isStageActive(currentStatus);
              const colors = getStatusColor(currentStatus);

              return shouldAnimate && stageRefs.current[index] && stageRefs.current[index + 1] ? (
                <AnimatedBeam
                  key={`beam-${stage.id}`}
                  containerRef={containerRef}
                  fromRef={{ current: stageRefs.current[index] }}
                  toRef={{ current: stageRefs.current[index + 1] }}
                  curvature={0}
                  pathColor="gray"
                  pathWidth={2}
                  pathOpacity={0.2}
                  gradientStartColor={colors.gradientStart}
                  gradientStopColor={colors.gradientStop}
                  duration={2}
                  delay={0}
                />
              ) : null;
            }
            return null;
          })}
        </div>
      </Card>
    </TooltipProvider>
  );
}
