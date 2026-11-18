"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AnswerPayload,
  Chunk,
  PendingUpload,
  PipelineConfig,
  RetrievalSettings,
  StageId,
  StageState,
  StudioDocument,
  Turn,
  VectorStats,
} from "./types";

const POLL_MS = 4000;
const PIPELINE: StageId[] = ["ingest", "chunk", "embed", "index"];

async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}

const postJson = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const shortModel = (m?: string) => m?.split("/").pop();

export function useRagStudio() {
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [running, setRunning] = useState<Record<string, StageId | undefined>>({});
  const [failures, setFailures] = useState<Record<string, { stage: StageId; message: string }>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activeCitation, setActiveCitation] = useState<{ turnId: string; index: number } | null>(null);
  const [config, setConfig] = useState<PipelineConfig>({
    strategy: "sentence",
    chunkSize: 500,
    chunkOverlap: 50,
    embeddingModel: "all-MiniLM-L6-v2",
    autoRun: true,
  });
  const [retrieval, setRetrieval] = useState<RetrievalSettings>({ topK: 5, minScore: 0 });

  const configRef = useRef(config);
  configRef.current = config;

  // ---------- data loading ----------

  const refresh = useCallback(async () => {
    try {
      const [docs, vs] = await Promise.all([
        api<{ documents: StudioDocument[] }>("/api/rag/documents/upload"),
        api<any>("/api/rag/vector-store/stats"),
      ]);
      setDocuments(docs.documents ?? []);
      setStats({
        totalVectors: vs.stats?.totalVectors ?? 0,
        dimensions: vs.stats?.dimensions ?? 0,
        indexedDocuments: vs.stats?.indexedDocuments ?? 0,
        indexedDocumentIds: vs.stats?.indexedDocumentIds ?? [],
        memoryUsageMB: Number(vs.stats?.memoryUsageMB ?? 0),
        remainingMemoryMB: Number(vs.stats?.remainingMemoryMB ?? 0),
        usagePercentage: Number(vs.quota?.percentage ?? 0),
        collection: vs.vectorStore?.collection ?? "rag-documents",
        connected: vs.vectorStore?.status === "connected",
      });
    } catch (err) {
      console.error("[RAG Studio] refresh failed", err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const loadChunks = useCallback(async (docId: string) => {
    try {
      const res = await api<any>(`/api/rag/documents/${docId}/process`);
      setChunks(res.document?.chunks ?? []);
      setChunkTotal(res.document?.chunkCount ?? 0);
    } catch {
      setChunks([]);
      setChunkTotal(0);
    }
  }, []);

  // Keep a sensible focus and its chunks in sync.
  useEffect(() => {
    const first = documents[0];
    if (!focusedId && first) setFocusedId(first.id);
    if (focusedId && !documents.some((d) => d.id === focusedId) && !pending.length) {
      setFocusedId(documents[0]?.id ?? null);
    }
  }, [documents, focusedId, pending.length]);

  const focusedDoc = documents.find((d) => d.id === focusedId) ?? null;
  const focusedChunkCount = focusedDoc?.chunkCount ?? 0;

  useEffect(() => {
    if (focusedId && focusedChunkCount > 0) loadChunks(focusedId);
    else {
      setChunks([]);
      setChunkTotal(0);
    }
  }, [focusedId, focusedChunkCount, loadChunks]);

  // ---------- derived state ----------

  const indexedIds = useMemo(() => new Set(stats?.indexedDocumentIds ?? []), [stats]);

  const stagesOf = useCallback(
    (doc: StudioDocument): Record<StageId, StageState> => {
      const done: Record<StageId, boolean> = {
        ingest: doc.textLength > 0,
        chunk: doc.hasChunks,
        embed: doc.hasEmbeddings,
        index: indexedIds.has(doc.id),
      };
      const run = running[doc.id];
      const fail = failures[doc.id];
      const out = {} as Record<StageId, StageState>;
      for (const s of PIPELINE) {
        out[s] = run === s ? "running" : fail?.stage === s ? "error" : done[s] ? "done" : "todo";
      }
      return out;
    },
    [indexedIds, running, failures]
  );

  /** The embedding model the index was built with, if any — queries must use the same one. */
  const indexModel = useMemo(() => {
    const doc = documents.find((d) => indexedIds.has(d.id) && d.embeddingModel);
    return shortModel(doc?.embeddingModel);
  }, [documents, indexedIds]);

  // ---------- pipeline actions ----------

  const runStage = useCallback(async (docId: string, stage: StageId) => {
    const cfg = configRef.current;
    if (stage === "chunk") {
      return api(`/api/rag/documents/${docId}/process`, postJson({
        chunkSize: cfg.chunkSize,
        chunkOverlap: cfg.chunkOverlap,
        strategy: cfg.strategy,
      }));
    }
    if (stage === "embed") {
      return api("/api/rag/embeddings/generate", postJson({
        documentId: docId,
        model: cfg.embeddingModel,
        provider: "huggingface",
      }));
    }
    if (stage === "index") {
      return api("/api/rag/vector-store/index", postJson({ documentId: docId }));
    }
  }, []);

  /** Runs every stage from `from` through indexing, stopping at the first failure. */
  const runPipeline = useCallback(
    async (docId: string, from: Exclude<StageId, "ingest"> = "chunk") => {
      const order: StageId[] = ["chunk", "embed", "index"];
      setFailures((f) => {
        const { [docId]: _, ...rest } = f;
        return rest;
      });
      for (const stage of order.slice(order.indexOf(from))) {
        setRunning((r) => ({ ...r, [docId]: stage }));
        try {
          await runStage(docId, stage);
          await refresh();
          if (stage === "chunk" && docId === focusedId) await loadChunks(docId);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setFailures((f) => ({ ...f, [docId]: { stage, message } }));
          setRunning((r) => ({ ...r, [docId]: undefined }));
          toast.error(`${labelFor(stage)} failed`, { description: message });
          return false;
        }
      }
      setRunning((r) => ({ ...r, [docId]: undefined }));
      return true;
    },
    [runStage, refresh, loadChunks, focusedId]
  );

  /** Continues a document from its first unfinished stage. */
  const resume = useCallback(
    (doc: StudioDocument) => {
      const s = stagesOf(doc);
      const from = s.chunk !== "done" ? "chunk" : s.embed !== "done" ? "embed" : "index";
      return runPipeline(doc.id, from);
    },
    [stagesOf, runPipeline]
  );

  const upload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setPending((p) => [...p, { tempId, fileName: file.name, fileSize: file.size }]);
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await api<any>("/api/rag/documents/upload", { method: "POST", body: form });
          setPending((p) => p.filter((x) => x.tempId !== tempId));
          await refresh();
          const id: string = res.document.id;
          setFocusedId(id);
          toast.success(`${file.name} added`, {
            description: `Extracted ${(res.document.textLength / 1000).toFixed(1)}k characters`,
          });
          if (configRef.current.autoRun) await runPipeline(id, "chunk");
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setPending((p) => p.map((x) => (x.tempId === tempId ? { ...x, error: message } : x)));
          toast.error(`Couldn't add ${file.name}`, { description: message });
        }
      }
    },
    [refresh, runPipeline]
  );

  const dismissPending = (tempId: string) => setPending((p) => p.filter((x) => x.tempId !== tempId));

  const removeDocument = useCallback(
    async (docId: string) => {
      try {
        await api(`/api/rag/documents/${docId}`, { method: "DELETE" });
        await refresh();
      } catch (err) {
        toast.error("Couldn't remove document", { description: (err as Error).message });
      }
    },
    [refresh]
  );

  const clearAll = useCallback(async () => {
    try {
      await api("/api/rag/documents/clear", { method: "POST" });
      setTurns([]);
      setFocusedId(null);
      await refresh();
      toast.success("Knowledge base cleared");
    } catch (err) {
      toast.error("Couldn't clear documents", { description: (err as Error).message });
    }
  }, [refresh]);

  const runAll = useCallback(async () => {
    for (const doc of documents) {
      const s = stagesOf(doc);
      if (s.index !== "done" && !running[doc.id]) await resume(doc);
    }
  }, [documents, stagesOf, running, resume]);

  // ---------- asking ----------

  const ask = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) return;
      const id = `turn-${Date.now()}`;
      setTurns((t) => [...t, { id, query: q, status: "pending" }]);
      try {
        const result = await api<AnswerPayload>("/api/rag/generate", postJson({
          query: q,
          topK: retrieval.topK,
          minScore: retrieval.minScore,
          model: indexModel ?? configRef.current.embeddingModel,
          provider: "ollama",
          llmModel: "gpt-oss:20b",
        }));
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: "done", result } : x)));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: "error", error: message } : x)));
      }
    },
    [retrieval, indexModel]
  );

  const counts = useMemo(() => {
    const c = { total: documents.length, chunked: 0, embedded: 0, indexed: 0 };
    for (const d of documents) {
      if (d.hasChunks) c.chunked++;
      if (d.hasEmbeddings) c.embedded++;
      if (indexedIds.has(d.id)) c.indexed++;
    }
    return c;
  }, [documents, indexedIds]);

  return {
    documents,
    pending,
    stats,
    counts,
    running,
    failures,
    focusedId,
    focusedDoc,
    setFocusedId,
    chunks,
    chunkTotal,
    turns,
    activeCitation,
    setActiveCitation,
    config,
    setConfig,
    retrieval,
    setRetrieval,
    indexModel,
    stagesOf,
    upload,
    dismissPending,
    runPipeline,
    resume,
    runAll,
    removeDocument,
    clearAll,
    ask,
    clearConversation: () => setTurns([]),
  };
}

export type RagStudio = ReturnType<typeof useRagStudio>;

export function labelFor(stage: StageId) {
  return { ingest: "Extract", chunk: "Chunking", embed: "Embedding", index: "Indexing" }[stage];
}
