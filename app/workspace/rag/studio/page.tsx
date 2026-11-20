"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, FlaskConical, Lock, ScanText, Sparkles, Waypoints } from "lucide-react";
import { RAGStudioMain } from "./components/rag-studio-main";
import { Panel, Segmented } from "./components/panel";

type View = "studio" | "ocr" | "embeddings" | "hf-embeddings";

const LABS: Record<Exclude<View, "studio">, { src: string; title: string }> = {
  ocr: { src: "/test-ocr", title: "OCR lab" },
  embeddings: { src: "/test-embeddings", title: "Embeddings lab" },
  "hf-embeddings": { src: "/test-hf-embeddings", title: "HuggingFace embeddings lab" },
};

export default function RAGStudioPage() {
  const [view, setView] = useState<View>("studio");

  const switcher = (
    <Segmented<View>
      className="max-w-full shrink-0 overflow-x-auto [scrollbar-width:none]"
      value={view}
      onChange={setView}
      options={[
        { value: "studio", label: <><Waypoints className="h-3.5 w-3.5" /> Studio</> },
        { value: "ocr", label: <><ScanText className="h-3.5 w-3.5" /> OCR</>, title: "OCR lab" },
        { value: "embeddings", label: <><FlaskConical className="h-3.5 w-3.5" /> Embeddings</>, title: "Embeddings lab" },
        { value: "hf-embeddings", label: <><Sparkles className="h-3.5 w-3.5" /> HF</>, title: "HuggingFace embeddings lab" },
      ]}
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 lg:h-[calc(100vh-4rem)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace/rag"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-neutral-400 transition hover:text-neutral-100"
            aria-label="Back to RAG overview"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[conic-gradient(from_180deg,#8b5cf6,#22d3ee,#ec4899,#8b5cf6)] p-px">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-neutral-950">
              <Waypoints className="h-4 w-4 text-neutral-100" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-neutral-50">RAG Studio</h1>
            <p className="text-xs text-neutral-500">Turn documents into grounded, cited answers</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1 text-[11px] font-medium text-emerald-200/90">
          <Lock className="h-3 w-3" />
          Private by design · in-memory · open-source models
        </span>
      </header>

      {view === "studio" ? (
        <RAGStudioMain toolbar={switcher} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex justify-end">{switcher}</div>
          <Panel className="flex-1">
            <iframe src={LABS[view].src} title={LABS[view].title} className="h-[calc(100dvh-14rem)] w-full border-0 lg:h-full" />
          </Panel>
        </div>
      )}
    </div>
  );
}
