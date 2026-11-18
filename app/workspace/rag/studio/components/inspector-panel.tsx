"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Boxes, Check, Database, Layers, Loader2, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMBEDDING_MODELS, STRATEGIES, type ChunkStrategy } from "../lib/types";
import { labelFor, type RagStudio } from "../lib/use-rag-studio";
import { Panel, PanelHeader, Segmented } from "./panel";
import { StageTrack } from "./stage-track";
import { SliderRow } from "./ask-panel";

type Tab = "chunks" | "settings" | "index";

export function InspectorPanel({ studio, className }: { studio: RagStudio; className?: string }) {
  const [tab, setTab] = useState<Tab>("chunks");
  const { focusedDoc, activeCitation, turns, setFocusedId } = studio;

  // When a citation is clicked in the conversation, jump to that chunk.
  const cited = useMemo(() => {
    if (!activeCitation) return null;
    const turn = turns.find((t) => t.id === activeCitation.turnId);
    return turn?.result?.retrievedChunks?.[activeCitation.index] ?? null;
  }, [activeCitation, turns]);

  useEffect(() => {
    if (!cited) return;
    setFocusedId(cited.documentId);
    setTab("chunks");
  }, [cited, setFocusedId]);

  return (
    <Panel className={cn("min-h-[420px]", className)}>
      <PanelHeader
        title="Inspector"
        subtitle={focusedDoc ? focusedDoc.fileName : "Select a source to inspect"}
        actions={
          <Segmented<Tab>
            size="xs"
            value={tab}
            onChange={setTab}
            options={[
              { value: "chunks", label: <Layers className="h-3.5 w-3.5" />, title: "Chunks" },
              { value: "settings", label: <Settings2 className="h-3.5 w-3.5" />, title: "Pipeline settings" },
              { value: "index", label: <Database className="h-3.5 w-3.5" />, title: "Vector index" },
            ]}
          />
        }
      />
      {focusedDoc && tab !== "index" && (
        <div className="px-4 pb-3">
          <StageTrack stages={studio.stagesOf(focusedDoc)} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto border-t border-white/[0.05]">
        {tab === "chunks" && (
          <ChunksTab studio={studio} highlight={cited && cited.documentId === focusedDoc?.id ? cited.chunkIndex : null} />
        )}
        {tab === "settings" && <SettingsTab studio={studio} />}
        {tab === "index" && <IndexTab studio={studio} />}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- Chunks

function ChunksTab({ studio, highlight }: { studio: RagStudio; highlight: number | null }) {
  const { chunks, chunkTotal, focusedDoc } = studio;
  const [selected, setSelected] = useState<number | null>(null);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  const current = highlight ?? selected;

  useEffect(() => {
    if (highlight == null) return;
    setSelected(highlight);
    refs.current[highlight]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  if (!focusedDoc) return <Empty icon={Layers} text="Add a source to see how it's split into chunks." />;
  if (!chunks.length) {
    return (
      <Empty
        icon={Layers}
        text={studio.running[focusedDoc.id] === "chunk" ? "Chunking…" : "This source hasn't been chunked yet."}
      />
    );
  }

  const max = Math.max(...chunks.map((c) => c.length));
  const avg = Math.round(chunks.reduce((s, c) => s + c.length, 0) / chunks.length);

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Chunks" value={chunkTotal || chunks.length} />
        <Stat label="Avg size" value={avg} unit="ch" />
        <Stat label="Largest" value={max} unit="ch" />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Chunk map</p>
        <div className="flex flex-wrap gap-[3px] rounded-xl border border-white/[0.05] bg-white/[0.015] p-2">
          {chunks.map((c) => (
            <button
              key={c.id}
              title={`Chunk ${c.index + 1} · ${c.length} chars`}
              onClick={() => {
                setSelected(c.index);
                refs.current[c.index]?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={cn(
                "h-4 rounded-[3px] transition-all",
                current === c.index
                  ? "bg-violet-300 ring-2 ring-violet-400/40"
                  : "bg-gradient-to-b from-violet-400/50 to-violet-500/25 hover:from-violet-300/80"
              )}
              style={{ width: `${Math.max(6, (c.length / max) * 28)}px` }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {chunks.map((c) => (
          <motion.div
            key={c.id}
            ref={(el) => {
              refs.current[c.index] = el;
            }}
            animate={current === c.index ? { scale: [1, 1.01, 1] } : {}}
            onClick={() => setSelected(selected === c.index ? null : c.index)}
            className={cn(
              "cursor-pointer rounded-xl border p-3 transition-colors",
              current === c.index ? "border-violet-400/40 bg-violet-500/[0.07]" : "border-white/[0.05] bg-white/[0.015] hover:border-white/10"
            )}
          >
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-mono text-neutral-400">#{c.index + 1}</span>
              <span className="font-mono text-neutral-600">{c.length} ch</span>
            </div>
            <p className={cn("text-xs leading-relaxed text-neutral-300", current !== c.index && "line-clamp-3")}>{c.text}</p>
          </motion.div>
        ))}
        {chunkTotal > chunks.length && (
          <p className="pt-1 text-center text-[11px] text-neutral-600">
            Showing first {chunks.length} of {chunkTotal} chunks
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Settings

function SettingsTab({ studio }: { studio: RagStudio }) {
  const { config, setConfig, focusedDoc, running, runPipeline, indexModel } = studio;
  const busy = focusedDoc ? running[focusedDoc.id] : undefined;
  const modelMismatch = indexModel && indexModel !== config.embeddingModel;

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-2.5">
        <Label>Chunking strategy</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {STRATEGIES.map((s) => (
            <button
              key={s.value}
              onClick={() => setConfig((c) => ({ ...c, strategy: s.value as ChunkStrategy }))}
              className={cn(
                "rounded-xl border p-2.5 text-left transition",
                config.strategy === s.value
                  ? "border-violet-400/40 bg-violet-500/[0.08]"
                  : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14]"
              )}
            >
              <p className="text-xs font-medium text-neutral-100">{s.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">{s.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SliderRow
          label="Chunk size"
          value={config.chunkSize}
          display={`${config.chunkSize} ch`}
          min={200}
          max={2000}
          step={50}
          onChange={(v) => setConfig((c) => ({ ...c, chunkSize: v }))}
        />
        <SliderRow
          label="Overlap"
          hint="Characters shared between neighbouring chunks, so context isn't lost at the edges"
          value={config.chunkOverlap}
          display={`${config.chunkOverlap} ch`}
          min={0}
          max={500}
          step={25}
          onChange={(v) => setConfig((c) => ({ ...c, chunkOverlap: v }))}
        />
        <OverlapPreview size={config.chunkSize} overlap={config.chunkOverlap} />
      </section>

      <section className="space-y-2.5">
        <Label>Embedding model</Label>
        <div className="space-y-1.5">
          {EMBEDDING_MODELS.map((m) => (
            <button
              key={m.value}
              onClick={() => setConfig((c) => ({ ...c, embeddingModel: m.value }))}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition",
                config.embeddingModel === m.value
                  ? "border-violet-400/40 bg-violet-500/[0.08]"
                  : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14]"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  config.embeddingModel === m.value ? "border-violet-300 bg-violet-400" : "border-white/20"
                )}
              >
                {config.embeddingModel === m.value && <Check className="h-2.5 w-2.5 text-neutral-950" />}
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-100">{m.label}</p>
                <p className="text-[11px] text-neutral-500">{m.note}</p>
              </div>
              <span className="font-mono text-[11px] text-neutral-400">{m.dim}d</span>
            </button>
          ))}
        </div>
        {modelMismatch && (
          <p className="text-[11px] leading-relaxed text-amber-300/90">
            Your index was built with {indexModel}. Rebuild your sources so queries and documents use the same model.
          </p>
        )}
      </section>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
        <div>
          <p className="text-xs font-medium text-neutral-100">Auto-process new sources</p>
          <p className="text-[11px] text-neutral-500">Run chunk, embed and index right after upload</p>
        </div>
        <Toggle checked={config.autoRun} onChange={(v) => setConfig((c) => ({ ...c, autoRun: v }))} />
      </label>

      <button
        disabled={!focusedDoc || !!busy}
        onClick={() => focusedDoc && runPipeline(focusedDoc.id, "chunk")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-white to-neutral-300 px-3 py-2.5 text-xs font-semibold text-neutral-900 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {busy ? `${labelFor(busy)}…` : focusedDoc ? "Rebuild this source with these settings" : "Select a source to rebuild"}
      </button>
    </div>
  );
}

/** Tiny diagram showing two neighbouring chunks and their shared overlap. */
function OverlapPreview({ size, overlap }: { size: number; overlap: number }) {
  const ratio = Math.min(overlap / size, 0.5);
  const w = 100 / (2 - ratio);
  return (
    <div className="relative h-6 rounded-lg bg-white/[0.02] ring-1 ring-white/[0.05]">
      <div className="absolute inset-y-1 left-1 rounded-md bg-violet-400/30" style={{ width: `calc(${w}% - 4px)` }} />
      <div className="absolute inset-y-1 right-1 rounded-md bg-cyan-300/25" style={{ width: `calc(${w}% - 4px)` }} />
      {ratio > 0 && (
        <div
          className="absolute inset-y-1 rounded-sm bg-gradient-to-r from-violet-300/60 to-cyan-200/60"
          style={{ left: `${100 - w}%`, width: `${w * 2 - 100}%` }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Index

function IndexTab({ studio }: { studio: RagStudio }) {
  const { stats, documents, setFocusedId } = studio;
  const indexed = new Set(stats?.indexedDocumentIds ?? []);
  const pct = Math.min(100, stats?.usagePercentage ?? 0);
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
          <circle cx="40" cy="40" r={R} className="fill-none stroke-white/[0.07]" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            stroke="url(#mem)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C - (C * Math.max(pct, 1)) / 100 }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          />
          <defs>
            <linearGradient id="mem" x1="0" x2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-neutral-100">{pct.toFixed(1)}%</p>
          <p className="text-xs text-neutral-500">
            {stats?.memoryUsageMB.toFixed(2) ?? "0.00"} MB used · {stats?.remainingMemoryMB.toFixed(0) ?? "50"} MB free
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-300/90">
            <ShieldCheck className="h-3 w-3" /> In-memory only, never written to disk
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Vectors" value={stats?.totalVectors ?? 0} />
        <Stat label="Dimensions" value={stats?.dimensions ?? 0} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 text-xs">
        <span className="flex items-center gap-2 text-neutral-400">
          <Boxes className="h-3.5 w-3.5" /> Collection
        </span>
        <span className="flex items-center gap-2 font-mono text-neutral-200">
          {stats?.collection ?? "rag-documents"}
          <span className="relative flex h-2 w-2">
            {stats?.connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", stats?.connected ? "bg-emerald-400" : "bg-neutral-600")} />
          </span>
        </span>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Sources in index</p>
        {documents.length === 0 ? (
          <p className="text-xs text-neutral-600">Nothing here yet.</p>
        ) : (
          <ul className="space-y-1">
            {documents.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setFocusedId(d.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/[0.04]"
                >
                  <span className="truncate text-neutral-300">{d.fileName}</span>
                  <span className={cn("shrink-0 font-mono text-[11px]", indexed.has(d.id) ? "text-emerald-300" : "text-neutral-600")}>
                    {indexed.has(d.id) ? `${d.chunkCount ?? 0} vec` : "not indexed"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- bits

function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-2">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="font-mono text-base font-semibold tabular-nums text-neutral-100">
        {value.toLocaleString()}
        {unit && <span className="ml-0.5 text-[11px] font-normal text-neutral-500">{unit}</span>}
      </p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-neutral-200">{children}</p>;
}

function Empty({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon className="h-6 w-6 text-neutral-700" />
      <p className="max-w-[220px] text-xs text-neutral-500">{text}</p>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-white/10"
      )}
    >
      <motion.span
        layout
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
        style={{ left: checked ? 18 : 2 }}
      />
    </button>
  );
}
