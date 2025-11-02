import type { UIMessage } from "ai";

export type Attachment = {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  contentType?: string;
};

export type ChatMessage = UIMessage & {
  reasoning?: string;
  model?: string;
  tokens?: number;
};

export interface RAGSourceDocument {
  content: string;
  metadata: {
    document_id: string;
    chunk_number?: number;
    page_number?: number;
    file_name?: string;
    similarity_score?: number;
  };
}

export interface AIStatus {
  enabled: boolean;
  service?: string;
  status?: string; // success, fallback, disabled, error
  model?: string;
  error_type?: string;
  warning_message?: string;
  request_id?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface RAGQueryResponse {
  results: RAGSourceDocument[];
  total_found: number;
  ai_status?: AIStatus;
  generated_with_ai?: boolean;
}