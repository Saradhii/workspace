// Message and Chat related types

import { Attachment } from './components';

// Base Message Type
export interface BaseMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'function' | 'tool';

// Message Metadata
export interface MessageMetadata {
  model?: string;
  provider?: string;
  tokens?: TokenUsage;
  processing_time_ms?: number;
  finish_reason?: string;
  temperature?: number;
  seed?: number;
  request_id?: string;
  context?: Record<string, unknown>;
  attachments_count?: number;
  edited?: boolean;
  edited_at?: Date;
}

// Token Usage
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd?: number;
}

// Content Types
export interface MessageContent {
  type: 'text' | 'image' | 'video' | 'code' | 'file';
  text?: string;
  url?: string;
  base64?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

// Specialized Message Types
export interface TextMessage extends BaseMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  type: 'text';
}

export interface ImageMessage extends BaseMessage {
  role: 'user' | 'assistant';
  content: string; // Prompt or description
  attachments: Attachment[];
  type: 'image';
  generation_params?: ImageGenerationParams;
}

export interface VideoMessage extends BaseMessage {
  role: 'user' | 'assistant';
  content: string; // Prompt or description
  attachments: Attachment[];
  type: 'video';
  generation_params?: VideoGenerationParams;
}

export interface CodeMessage extends BaseMessage {
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  type: 'code';
  execution_result?: CodeExecutionResult;
}

export interface FileMessage extends BaseMessage {
  role: 'user';
  content: string; // Description or context
  attachments: Attachment[];
  type: 'file';
}

export type ChatMessage = TextMessage | ImageMessage | VideoMessage | CodeMessage | FileMessage;

// Generation Parameters
export interface ImageGenerationParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  model?: 'chroma' | 'neta-lumina';
}

export interface VideoGenerationParams {
  prompt: string;
  image_base64?: string;
  negative_prompt?: string;
  frames?: number;
  fps?: number;
  resolution?: '480p' | '720p';
  guidance_scale?: number;
  fast?: boolean;
  seed?: number;
}

export interface CodeGenerationParams {
  prompt: string;
  language?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Code Execution
export interface CodeExecutionResult {
  exit_code: number;
  stdout?: string;
  stderr?: string;
  execution_time_ms?: number;
  memory_usage_mb?: number;
  error?: string;
}

// Conversation/Chat Types
export interface Conversation {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
  metadata?: ConversationMetadata;
  visibility: 'public' | 'private' | 'unlisted';
  settings?: ConversationSettings;
}

export interface ConversationMetadata {
  total_tokens: number;
  total_cost_usd?: number;
  avg_response_time_ms?: number;
  models_used: string[];
  topics?: string[];
  language?: string;
}

export interface ConversationSettings {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  remember_context: boolean;
  auto_save: boolean;
}

// Message State
export interface MessageState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error?: string;
  lastError?: MessageError;
  currentRequestId?: string;
}

export interface MessageError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  retry_count: number;
}

// Message Actions
export interface MessageAction {
  type: 'edit' | 'delete' | 'copy' | 'regenerate' | 'rate' | 'report';
  messageId: string;
  payload?: Record<string, unknown>;
}

export interface MessageRating {
  message_id: string;
  user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  categories?: {
    relevance: number;
    accuracy: number;
    helpfulness: number;
    clarity: number;
  };
  timestamp: Date;
}

// Streaming Types
export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  currentReasoning?: string;
  tokensReceived: number;
  startTime?: Date;
  estimatedTimeLeft?: number;
}

export interface StreamingChunk {
  type: 'content' | 'reasoning' | 'usage' | 'done' | 'error';
  content?: string;
  accumulated?: string;
  reasoning?: string;
  usage?: TokenUsage;
  model?: string;
  finish_reason?: string;
}

// Search and Filtering
export interface MessageFilter {
  role?: MessageRole[];
  type?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasAttachments?: boolean;
  model?: string[];
  minRating?: number;
}

export interface MessageSearch {
  query: string;
  filter?: MessageFilter;
  sort?: {
    field: 'timestamp' | 'rating' | 'tokens';
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface MessageSearchResult {
  messages: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}

// Context Management
export interface MessageContext {
  window_size: number; // Number of messages to include
  max_tokens: number; // Maximum tokens in context
  include_system_prompt: boolean;
  include_metadata: boolean;
  compression?: {
    enabled: boolean;
    threshold: number;
    method: 'summary' | 'truncation' | 'semantic';
  };
}

// Event Types
export interface MessageEvent {
  type: 'created' | 'updated' | 'deleted' | 'rated' | 'shared';
  message_id: string;
  conversation_id: string;
  user_id: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

