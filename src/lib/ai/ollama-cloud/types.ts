// Ollama Cloud API Types
// Based on https://docs.ollama.com

// =================================
// Base Types
// =================================

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[]; // base64 encoded images
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
  };
}

export interface ChatOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  num_ctx?: number;
  num_predict?: number;
  stop?: string[];
  seed?: number;
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  repeat_last_n?: number;
  repeat_penalty?: number;
  tfs_z?: number;
  typical_p?: number;
}

// =================================
// Chat Completion Types
// =================================

export interface ChatRequest {
  model: string;
  messages: Message[];
  stream?: boolean; // default: true
  tools?: Tool[];
  format?: 'json' | Record<string, any>; // for structured outputs
  options?: ChatOptions;
  think?: boolean; // for reasoning models
  keep_alive?: string; // e.g., "5m", "10m"
  template?: string;
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
    thinking?: string; // for reasoning models
    tool_calls?: ToolCall[];
  };
  done: true;
  total_duration: number; // nanoseconds
  prompt_eval_count: number;
  prompt_eval_duration: number; // nanoseconds
  eval_count: number;
  eval_duration: number; // nanoseconds
  load_duration?: number; // nanoseconds
  context?: number[];
}

export interface ChatChunk {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string; // partial
    thinking?: string; // partial
    tool_calls?: ToolCall[];
  };
  done?: boolean; // false for chunks, true for final
  // Metrics only included in final chunk when done=true
  total_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  load_duration?: number;
  context?: number[];
}

// =================================
// Embedding Types
// =================================

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_ctx?: number;
    num_predict?: number;
    repeat_last_n?: number;
    repeat_penalty?: number;
    seed?: number;
    tfs_z?: number;
    typical_p?: number;
  };
}

export interface EmbeddingResponse {
  embeddings: number[][]; // L2-normalized vectors
  model: string;
  created_at: string;
  total_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
  load_duration?: number;
}

// =================================
// Model Information Types
// =================================

export interface ModelDetails {
  parent_model?: string;
  format?: string;
  family?: string;
  families?: string[];
  parameter_size?: string;
  quantization_level?: string;
}

export interface ModelSpec {
  pricing?: {
    input?: {
      usd?: number;
      diem?: number;
    };
    output?: {
      usd?: number;
      diem?: number;
    };
    generation?: {
      usd?: number;
      diem?: number;
    };
    upscale?: {
      '2x'?: {
        usd?: number;
        diem?: number;
      };
      '4x'?: {
        usd?: number;
        diem?: number;
      };
    };
  };
  availableContextTokens?: number;
  capabilities?: {
    optimizedForCode?: boolean;
    quantization?: string;
    supportsFunctionCalling?: boolean;
    supportsReasoning?: boolean;
    supportsResponseSchema?: boolean;
    supportsVision?: boolean;
    supportsWebSearch?: boolean;
    supportsLogProbs?: boolean;
  };
  constraints?: {
    temperature?: {
      default?: number;
    };
    top_p?: {
      default?: number;
    };
    promptCharacterLimit?: number;
    steps?: {
      default?: number;
      max?: number;
    };
    widthHeightDivisor?: number;
  };
  name?: string;
  modelSource?: string;
  offline?: boolean;
  traits?: string[];
}

export interface Model {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: ModelDetails;
  model_spec?: ModelSpec;
  object: 'model';
  owned_by: string;
  type: 'text' | 'image';
}

export interface ModelsResponse {
  models: Model[];
  object: 'list';
  type: 'text' | 'image';
}

// =================================
// Error Types
// =================================

export interface OllamaErrorData {
  error: string;
  type?: string;
  code?: string;
}

export class OllamaError extends Error {
  public readonly type?: string;
  public readonly code?: string;

  constructor(data: OllamaErrorData) {
    super(data.error);
    this.name = 'OllamaError';
    this.type = data.type;
    this.code = data.code;
  }
}

// =================================
// Streaming Types
// =================================

export interface StreamEvent {
  type: 'start' | 'content' | 'thinking' | 'tool_call' | 'complete' | 'error';
  timestamp: string;
  content?: string;
  thinking?: string;
  tool_calls?: ToolCall[];
  error?: string;
  done?: boolean;
  metrics?: {
    total_duration: number;
    prompt_eval_count: number;
    eval_count: number;
  };
}

// =================================
// Model Capabilities
// =================================

export interface ModelCapabilities {
  supportsThinking: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStructuredOutputs: boolean;
  supportsEmbeddings: boolean;
  maxTokens?: number;
  contextWindow?: number;
}

// =================================
// Provider Configuration
// =================================

export interface OllamaConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// =================================
// Type Guards
// =================================

export function isChatChunk(obj: any): obj is ChatChunk {
  return obj && typeof obj === 'object' && 'model' in obj && 'message' in obj;
}

export function hasThinking(obj: ChatChunk | ChatResponse): boolean {
  return !!(obj.message?.thinking);
}

export function hasToolCalls(obj: ChatChunk | ChatResponse): boolean {
  return !!(obj.message?.tool_calls) && obj.message.tool_calls.length > 0;
}

export function isImageModel(model: Model): boolean {
  return model.type === 'image';
}

export function isTextModel(model: Model): boolean {
  return model.type === 'text';
}