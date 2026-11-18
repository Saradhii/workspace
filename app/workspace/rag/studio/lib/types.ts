export type StageId = "ingest" | "chunk" | "embed" | "index";

export type StageState = "todo" | "running" | "done" | "error";

export interface StudioDocument {
  id: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  extractionMethod?: string;
  extractionModel?: string;
  textLength: number;
  chunkCount?: number;
  hasChunks: boolean;
  hasEmbeddings: boolean;
  embeddingModel?: string;
  dimensions?: number;
  timestamp?: string;
}

/** A file that is still uploading (not yet known to the server). */
export interface PendingUpload {
  tempId: string;
  fileName: string;
  fileSize: number;
  error?: string;
}

export interface Chunk {
  id: string;
  index: number;
  text: string;
  length: number;
}

export type ChunkStrategy = "fixed" | "sentence" | "paragraph" | "semantic";

export interface PipelineConfig {
  strategy: ChunkStrategy;
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  autoRun: boolean;
}

export interface RetrievalSettings {
  topK: number;
  minScore: number;
}

export interface VectorStats {
  totalVectors: number;
  dimensions: number;
  indexedDocuments: number;
  indexedDocumentIds: string[];
  memoryUsageMB: number;
  remainingMemoryMB: number;
  usagePercentage: number;
  collection: string;
  connected: boolean;
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  fileName: string;
  text: string;
  score: number;
  chunkIndex: number;
}

export interface AnswerPayload {
  query: string;
  answer: string;
  retrievedChunks: RetrievedChunk[];
  metadata?: {
    llmModel?: string;
    embeddingModel?: string;
    tokensUsed?: number;
    topK?: number;
  };
  performance?: {
    embeddingTimeMs?: number;
    searchTimeMs?: number;
    generationTimeMs?: number;
    totalTimeMs?: number;
  };
}

export interface Turn {
  id: string;
  query: string;
  status: "pending" | "done" | "error";
  result?: AnswerPayload;
  error?: string;
}

export const EMBEDDING_MODELS = [
  { value: "all-MiniLM-L6-v2", label: "MiniLM L6 v2", dim: 384, note: "Fast · compact" },
  { value: "all-mpnet-base-v2", label: "MPNet base v2", dim: 768, note: "Higher recall" },
] as const;

export const STRATEGIES: { value: ChunkStrategy; label: string; hint: string }[] = [
  { value: "sentence", label: "Sentence", hint: "Respects sentence boundaries" },
  { value: "paragraph", label: "Paragraph", hint: "Keeps paragraphs whole" },
  { value: "fixed", label: "Fixed", hint: "Exact character windows" },
  { value: "semantic", label: "Semantic", hint: "Groups by meaning" },
];

export const EXTRACTION_LABELS: Record<string, string> = {
  direct: "Direct text",
  "ocr-deepseek": "DeepSeek OCR",
  "ocr-ollama": "Ollama Vision",
  "pdf-text": "PDF text",
  hybrid: "Text + OCR",
};
