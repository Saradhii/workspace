"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "motion/react";
import {
  ArrowUp,
  Check,
  Copy,
  Eraser,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { AnswerPayload, RetrievedChunk, Turn } from "../lib/types";
import type { RagStudio } from "../lib/use-rag-studio";
import { Panel, PanelHeader } from "./panel";
import { FileIcon } from "./library-panel";

const SUGGESTIONS = [
  "Summarize the key points",
  "What decisions or action items are mentioned?",
  "List every date, deadline and number",
  "Explain this to a newcomer",
];

export function AskPanel({ studio }: { studio: RagStudio }) {
  const { turns, ask, counts, retrieval, setRetrieval, indexModel, config, clearConversation } = studio;
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canAsk = counts.indexed > 0;
  const busy = turns.some((t) => t.status === "pending");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const submit = (q = draft) => {
    if (!q.trim() || !canAsk || busy) return;
    ask(q);
    setDraft("");
  };

  return (
    <Panel className="min-h-[560px]">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600/20 via-fuchsia-500/10 to-cyan-400/20 blur-3xl" />

      <PanelHeader
        title="Ask your documents"
        subtitle={
          canAsk
            ? `Grounded in ${counts.indexed} source${counts.indexed === 1 ? "" : "s"} · answers cite their evidence`
            : "Index at least one source to start asking"
        }
        className="relative"
        actions={
          <>
            <ModelPill label="LLM" value="gpt-oss:20b" />
            <ModelPill label="Embed" value={(indexModel ?? config.embeddingModel).replace("all-", "")} />
            {turns.length > 0 && (
              <button
                onClick={clearConversation}
                className="ml-1 rounded-md p-1.5 text-neutral-500 transition hover:bg-white/5 hover:text-neutral-200"
                title="Clear conversation"
              >
                <Eraser className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        }
      />

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 md:px-6">
        {turns.length === 0 ? (
          <EmptyState canAsk={canAsk} onPick={(s) => submit(s)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-8 py-4">
            {turns.map((t) => (
              <TurnView key={t.id} turn={t} studio={studio} />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative px-4 pb-4 pt-2 md:px-6">
        <div
          className={cn(
            "mx-auto max-w-3xl rounded-2xl border bg-neutral-900/80 p-2 shadow-[0_10px_40px_-20px_rgba(139,92,246,0.5)] transition-colors",
            canAsk ? "border-white/10 focus-within:border-violet-400/40" : "border-white/[0.05] opacity-60"
          )}
        >
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            disabled={!canAsk}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={canAsk ? "Ask a question about your sources…" : "Add and index a source first"}
            className="block w-full resize-none bg-transparent px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="mt-1 flex items-center justify-between">
            <RetrievalPopover
              topK={retrieval.topK}
              minScore={retrieval.minScore}
              onChange={(r) => setRetrieval((prev) => ({ ...prev, ...r }))}
            />
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-neutral-600 sm:block">Enter to send · Shift+Enter for newline</span>
              <button
                onClick={() => submit()}
                disabled={!draft.trim() || !canAsk || busy}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-white to-neutral-300 text-neutral-900 transition hover:brightness-110 disabled:from-neutral-700 disabled:to-neutral-800 disabled:text-neutral-500"
                aria-label="Send"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ModelPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 text-[11px] text-neutral-400 lg:flex">
      <span className="text-neutral-600">{label}</span>
      <span className="font-mono text-neutral-300">{value}</span>
    </span>
  );
}

function EmptyState({ canAsk, onPick }: { canAsk: boolean; onPick: (s: string) => void }) {
  return (
    <div className="flex h-full min-h-[340px] flex-col items-center justify-center py-10 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-6 flex h-16 w-16 items-center justify-center"
      >
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#8b5cf6,#22d3ee,#ec4899,#8b5cf6)] opacity-70 blur-md" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 ring-1 ring-white/10">
          <Sparkles className="h-6 w-6 text-violet-200" />
        </div>
      </motion.div>
      <h3 className="text-xl font-semibold tracking-tight text-neutral-100">
        {canAsk ? "What do you want to know?" : "Turn documents into answers"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        {canAsk
          ? "Questions are matched against your indexed chunks, and every answer links back to the passages it used."
          : "Drop files into the knowledge base. They're extracted, chunked, embedded and indexed automatically, in memory only."}
      </p>
      {canAsk ? (
        <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-left text-xs text-neutral-300 transition hover:border-violet-400/30 hover:bg-violet-500/[0.06] hover:text-neutral-100"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <ol className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-500">
          {["Add", "Chunk", "Embed", "Index", "Ask"].map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 font-mono text-[10px] text-neutral-400">
                {i + 1}
              </span>
              {s}
              {i < 4 && <span className="h-px w-4 bg-white/10" />}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function TurnView({ turn, studio }: { turn: Turn; studio: RagStudio }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-sm text-neutral-100">
          {turn.query}
        </p>
      </div>
      {turn.status === "pending" && <Thinking />}
      {turn.status === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-sm text-rose-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Couldn&apos;t answer that</p>
            <p className="mt-0.5 text-xs text-rose-300/80">{turn.error}</p>
          </div>
        </div>
      )}
      {turn.status === "done" && turn.result && <Answer turnId={turn.id} result={turn.result} studio={studio} />}
    </motion.div>
  );
}

function Thinking() {
  return (
    <div className="flex gap-3">
      <Avatar spinning />
      <div className="flex-1 space-y-2 pt-1">
        <p className="text-xs text-neutral-500">Searching your sources and drafting an answer…</p>
        {[92, 78, 60].map((w) => (
          <div key={w} className="h-3 overflow-hidden rounded bg-white/[0.04]" style={{ width: `${w}%` }}>
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({ spinning }: { spinning?: boolean }) {
  return (
    <div className="relative mt-0.5 h-7 w-7 shrink-0">
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#8b5cf6,#22d3ee,#ec4899,#8b5cf6)]",
          spinning && "animate-spin"
        )}
      />
      <div className="absolute inset-[2px] flex items-center justify-center rounded-full bg-neutral-950">
        <Sparkles className="h-3.5 w-3.5 text-violet-200" />
      </div>
    </div>
  );
}

function Answer({ turnId, result, studio }: { turnId: string; result: AnswerPayload; studio: RagStudio }) {
  const [copied, setCopied] = useState(false);
  const { activeCitation, setActiveCitation } = studio;
  const active = activeCitation?.turnId === turnId ? activeCitation.index : null;
  const sources = result.retrievedChunks ?? [];

  // Turn "[2]" into a link we can render as a citation chip (skip real markdown links).
  const markdown = (result.answer ?? "").replace(/\[(\d+)\](?!\()/g, "[$1](#cite-$1)");

  const focus = (i: number) => setActiveCitation(active === i ? null : { turnId, index: i });

  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-3 text-sm leading-relaxed text-neutral-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5 marker:text-violet-300/70">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5 marker:text-neutral-500">{children}</ol>,
              strong: ({ children }) => <strong className="font-semibold text-neutral-50">{children}</strong>,
              h1: ({ children }) => <h3 className="text-base font-semibold text-neutral-50">{children}</h3>,
              h2: ({ children }) => <h3 className="text-base font-semibold text-neutral-50">{children}</h3>,
              h3: ({ children }) => <h4 className="text-sm font-semibold text-neutral-50">{children}</h4>,
              code: ({ children }) => <code className="rounded bg-white/[0.07] px-1 py-0.5 font-mono text-[12px] text-violet-200">{children}</code>,
              pre: ({ children }) => <pre className="overflow-x-auto rounded-lg bg-white/[0.04] p-3 text-xs">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-violet-400/40 pl-3 text-neutral-400">{children}</blockquote>,
              a: ({ href, children }) => {
                const m = href?.match(/^#cite-(\d+)$/);
                if (!m) return <a href={href} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-2">{children}</a>;
                const i = Number(m[1]) - 1;
                if (!sources[i]) return <span>[{m[1]}]</span>;
                return (
                  <button
                    onClick={() => focus(i)}
                    className={cn(
                      "mx-0.5 inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded px-1 align-middle font-mono text-[10px] font-semibold no-underline transition",
                      active === i ? "bg-violet-400 text-neutral-950" : "bg-violet-400/15 text-violet-200 hover:bg-violet-400/30"
                    )}
                  >
                    {m[1]}
                  </button>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.answer);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-500 transition hover:bg-white/5 hover:text-neutral-200"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <Timing perf={result.performance} />
        </div>

        {sources.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Sources · {sources.length}
            </p>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {sources.map((s, i) => (
                <SourceCard key={s.id} source={s} n={i + 1} active={active === i} onClick={() => focus(i)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceCard({ source, n, active, onClick }: { source: RetrievedChunk; n: number; active: boolean; onClick: () => void }) {
  const pct = Math.max(0, Math.min(1, source.score));
  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border p-3 text-left transition-colors",
        active ? "border-violet-400/40 bg-violet-500/[0.07]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14]"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold",
            active ? "bg-violet-400 text-neutral-950" : "bg-white/[0.07] text-neutral-300"
          )}
        >
          {n}
        </span>
        <FileIcon name={source.fileName} className="h-5 w-5 rounded-md [&_svg]:h-3 [&_svg]:w-3" />
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">{source.fileName}</span>
        <span className="font-mono text-[10px] text-neutral-500">#{source.chunkIndex + 1}</span>
      </div>
      <p className={cn("mt-2 text-xs leading-relaxed text-neutral-400", !active && "line-clamp-2")}>{source.text}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] tabular-nums text-neutral-400">{(pct * 100).toFixed(0)}% match</span>
      </div>
    </motion.button>
  );
}

function Timing({ perf }: { perf?: AnswerPayload["performance"] }) {
  if (!perf?.totalTimeMs) return null;
  const parts = [
    { label: "Embed", ms: perf.embeddingTimeMs ?? 0, tone: "bg-sky-400" },
    { label: "Search", ms: perf.searchTimeMs ?? 0, tone: "bg-violet-400" },
    { label: "Generate", ms: perf.generationTimeMs ?? 0, tone: "bg-fuchsia-400" },
  ];
  const total = Math.max(perf.totalTimeMs, 1);
  return (
    <div className="flex items-center gap-2 text-[11px] text-neutral-500" title={parts.map((p) => `${p.label}: ${p.ms}ms`).join(" · ")}>
      <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
        {parts.map((p) => (
          <span key={p.label} className={p.tone} style={{ width: `${(p.ms / total) * 100}%` }} />
        ))}
      </div>
      <span className="font-mono tabular-nums">{(perf.totalTimeMs / 1000).toFixed(2)}s</span>
    </div>
  );
}

function RetrievalPopover({
  topK,
  minScore,
  onChange,
}: {
  topK: number;
  minScore: number;
  onChange: (r: { topK?: number; minScore?: number }) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-neutral-400 transition hover:bg-white/5 hover:text-neutral-200">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>
            Top <span className="font-mono text-neutral-200">{topK}</span>
          </span>
          <span className="text-neutral-700">·</span>
          <span>
            min <span className="font-mono text-neutral-200">{minScore.toFixed(2)}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 border-white/10 bg-neutral-950/95 backdrop-blur-xl">
        <div className="space-y-5">
          <SliderRow
            label="Passages to retrieve"
            hint="How many chunks are sent to the model as context"
            value={topK}
            display={String(topK)}
            min={1}
            max={20}
            step={1}
            onChange={(v) => onChange({ topK: v })}
          />
          <SliderRow
            label="Minimum similarity"
            hint="Drop passages that score below this"
            value={minScore}
            display={minScore.toFixed(2)}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onChange({ minScore: v })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SliderRow({
  label,
  hint,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-neutral-200">{label}</span>
        <span className="font-mono text-xs tabular-nums text-violet-200">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(vals) => onChange(vals[0] ?? value)} />
      {hint && <p className="text-[11px] text-neutral-500">{hint}</p>}
    </div>
  );
}

