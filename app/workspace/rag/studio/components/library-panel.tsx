"use client";

import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EXTRACTION_LABELS, type StudioDocument } from "../lib/types";
import { labelFor, type RagStudio } from "../lib/use-rag-studio";
import { StageTrack, stageSummary } from "./stage-track";
import { Panel, PanelHeader } from "./panel";

// Mirrors the types the upload route accepts.
const ACCEPT = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "text/csv": [".csv"],
  "text/html": [".html"],
  "application/json": [".json"],
  "application/xml": [".xml"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

export function LibraryPanel({ studio }: { studio: RagStudio }) {
  const { documents, pending, counts, focusedId, setFocusedId, upload, clearAll, runAll, running } = studio;
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files) => files.length && upload(files),
    accept: ACCEPT,
    noClick: true,
  });

  const isEmpty = documents.length === 0 && pending.length === 0;
  const anyRunning = Object.values(running).some(Boolean);
  const unfinished = counts.total - counts.indexed;

  return (
    <Panel className="min-h-[420px]" {...getRootProps()}>
      <input {...getInputProps()} />
      <PanelHeader
        title="Knowledge base"
        subtitle={isEmpty ? "No sources yet" : `${counts.total} source${counts.total === 1 ? "" : "s"} · ${counts.indexed} searchable`}
        actions={
          !isEmpty && (
            <button
              onClick={clearAll}
              className="rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-rose-300"
              title="Remove all sources"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )
        }
      />

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={open}
          className={cn(
            "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed text-center transition-all",
            isEmpty ? "gap-3 py-10" : "gap-1 py-4",
            isDragActive
              ? "border-violet-400/60 bg-violet-500/10"
              : "border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.03]"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-gradient-to-b from-white/10 to-white/[0.02] ring-1 ring-white/10 transition-transform group-hover:scale-105",
              isEmpty ? "h-12 w-12" : "h-8 w-8"
            )}
          >
            <UploadCloud className={cn("text-neutral-300", isEmpty ? "h-5 w-5" : "h-4 w-4")} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-200">
              {isDragActive ? "Drop to add" : isEmpty ? "Drop files to build your knowledge base" : "Add sources"}
            </p>
            <p className="text-xs text-neutral-500">PDF, text, Markdown, CSV, JSON or images (OCR included)</p>
          </div>
        </button>
      </div>

      {!isEmpty && unfinished > 0 && (
        <div className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-200/90">
          <span>{unfinished} not searchable yet</span>
          <button
            onClick={runAll}
            disabled={anyRunning}
            className="flex shrink-0 items-center gap-1 rounded-md bg-amber-300/10 px-2 py-1 font-medium text-amber-100 transition hover:bg-amber-300/20 disabled:opacity-50"
          >
            {anyRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Process all
          </button>
        </div>
      )}

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        <AnimatePresence initial={false}>
          {pending.map((p) => (
            <motion.div
              key={p.tempId}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-xl border p-3",
                p.error ? "border-rose-500/30 bg-rose-500/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-3">
                <FileIcon name={p.fileName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-200">{p.fileName}</p>
                  <p className={cn("text-xs", p.error ? "text-rose-300" : "text-neutral-500")}>
                    {p.error ?? "Extracting text…"}
                  </p>
                </div>
                {p.error ? (
                  <button onClick={() => studio.dismissPending(p.tempId)} className="text-neutral-500 hover:text-neutral-200">
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                )}
              </div>
              {!p.error && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              )}
            </motion.div>
          ))}

          {documents.map((doc) => (
            <motion.div key={doc.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}>
              <DocumentRow doc={doc} studio={studio} focused={doc.id === focusedId} onFocus={() => setFocusedId(doc.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Panel>
  );
}

function DocumentRow({
  doc,
  studio,
  focused,
  onFocus,
}: {
  doc: StudioDocument;
  studio: RagStudio;
  focused: boolean;
  onFocus: () => void;
}) {
  const stages = studio.stagesOf(doc);
  const runningStage = studio.running[doc.id];
  const failure = studio.failures[doc.id];
  const ready = stages.index === "done";
  const summary = stageSummary(stages, runningStage && `${labelFor(runningStage)}…`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFocus()}
      className={cn(
        "group relative cursor-pointer rounded-xl border p-3 outline-none transition-all",
        focused
          ? "border-violet-400/30 bg-gradient-to-b from-violet-500/[0.08] to-transparent shadow-[0_0_0_1px_rgba(167,139,250,0.08),0_8px_30px_-12px_rgba(139,92,246,0.35)]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.035] focus-visible:border-white/20"
      )}
    >
      <div className="flex items-start gap-3">
        <FileIcon name={doc.fileName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-100">{doc.fileName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-neutral-500">
            <span>{(doc.textLength / 1000).toFixed(1)}k chars</span>
            {doc.chunkCount ? (
              <>
                <Dot />
                <span>{doc.chunkCount} chunks</span>
              </>
            ) : null}
            {doc.extractionMethod && (
              <>
                <Dot />
                <span>{EXTRACTION_LABELS[doc.extractionMethod] ?? doc.extractionMethod}</span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            studio.removeDocument(doc.id);
          }}
          className="rounded-md p-1 text-neutral-600 opacity-0 transition hover:bg-white/5 hover:text-rose-300 group-hover:opacity-100 focus-visible:opacity-100"
          title="Remove source"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <StageTrack stages={stages} className="mt-3" />

      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            runningStage ? "text-violet-300" : failure ? "text-rose-300" : ready ? "text-emerald-300" : "text-neutral-400"
          )}
        >
          {runningStage && <Loader2 className="h-3 w-3 animate-spin" />}
          {failure && !runningStage && <AlertTriangle className="h-3 w-3" />}
          {summary}
        </span>
        {!runningStage && !ready && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              studio.resume(doc);
            }}
            className="flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-neutral-200 transition hover:bg-white/[0.12]"
          >
            {failure ? <RotateCcw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {failure ? "Retry" : "Continue"}
          </button>
        )}
      </div>
      {failure && !runningStage && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-rose-300/80">{failure.message}</p>
      )}
    </div>
  );
}

const Dot = () => <span className="text-neutral-700">•</span>;

export function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const { Icon, tone } = /png|jpe?g|webp|gif/.test(ext)
    ? { Icon: FileImage, tone: "from-sky-400/20 text-sky-200" }
    : /xlsx?|csv/.test(ext)
      ? { Icon: FileSpreadsheet, tone: "from-emerald-400/20 text-emerald-200" }
      : ext === "pdf"
        ? { Icon: FileText, tone: "from-rose-400/20 text-rose-200" }
        : { Icon: FileText, tone: "from-violet-400/20 text-violet-200" };
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b to-transparent ring-1 ring-white/10",
        tone,
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
