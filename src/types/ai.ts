// AI service specific types

// OpenRouter Types
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  appName: string;
  appUrl: string;
}

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  seed?: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChoice {
  index: number;
  message?: {
    role: string;
    content: string;
  };
  delta?: {
    role?: string;
    content?: string;
    reasoning?: string;
  };
  finish_reason: string | null;
}

export interface OpenRouterResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: OpenRouterChoice[];
  usage?: OpenRouterUsage;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  top_provider?: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

// Chutes AI Types
export interface ChutesConfig {
  apiKey: string;
  imageApiUrl: string;
  videoApiUrl: string;
  llmApiUrl: string;
}

export interface ChutesImageRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  model?: 'chroma' | 'neta-lumina';
  return_base64?: boolean;
}

export interface ChutesImageResponse {
  image_id?: string;
  image_base64?: string;
  image_url?: string;
  format: string;
  width: number;
  height: number;
  seed?: number;
  request_id?: string;
}

export interface ChutesVideoRequest {
  image: string; // base64
  prompt: string;
  negative_prompt?: string;
  frames?: number;
  fps?: number;
  guidance_scale?: number;
  guidance_scale_2?: number;
  resolution?: '480p' | '720p';
  fast?: boolean;
  seed?: number;
  return_url?: boolean;
  return_base64?: boolean;
}

export interface ChutesVideoResponse {
  video_id?: string;
  video_url?: string;
  video_base64?: string;
  format: string;
  width: number;
  height: number;
  frames: number;
  fps: number;
  duration?: number;
  file_size?: number;
  seed?: number;
  request_id?: string;
}

export interface ChutesUploadRequest {
  image_base64: string;
  filename?: string;
  format?: string;
}

export interface ChutesUploadResponse {
  image_id: string;
  image_url: string;
  temporary?: boolean;
  expires_at?: string;
}

// Stream Event Types
export interface StreamEvent {
  type: string;
  content?: string;
  accumulated?: string;
  reasoning?: string;
  model?: string;
  usage?: OpenRouterUsage;
  timestamp?: string;
  progress?: number;
  stage?: string;
  message?: string;
  frames_completed?: number;
  error?: string;
  details?: Record<string, unknown>;
}

// Error Types
export interface AIError {
  code?: string;
  message: string;
  type: 'api_error' | 'network_error' | 'rate_limit' | 'invalid_request' | 'insufficient_quota';
  details?: Record<string, unknown>;
  request_id?: string;
}

// Rate Limit Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retry_after?: number;
}

// Provider Types
export type AIProvider = 'openrouter' | 'chutes';

export interface AIProviderConfig {
  provider: AIProvider;
  config: OpenRouterConfig | ChutesConfig;
  enabled: boolean;
}

// Generation Task Types
export interface GenerationTask {
  id: string;
  type: 'text' | 'image' | 'video' | 'code';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  params: Record<string, unknown>;
  result?: unknown;
  error?: AIError;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

// Quality Metrics
export interface QualityMetrics {
  clarity: number; // 0-1
  coherence: number; // 0-1
  relevance: number; // 0-1
  creativity: number; // 0-1
  overall: number; // 0-1
}

// Feedback Types
export interface GenerationFeedback {
  task_id: string;
  user_id: string;
  rating: number; // 1-5
  metrics?: QualityMetrics;
  comments?: string;
  timestamp: Date;
}

// API Health Check
export interface HealthCheck {
  provider: AIProvider;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  last_check: Date;
  error?: string;
}

// Utility Types for AI
export type PromptTemplate = string | ((params: Record<string, unknown>) => string);

export interface PromptBuilder {
  template: PromptTemplate;
  params: Record<string, unknown>;
  build(): string;
}

export type ModelCapability =
  | 'text-generation'
  | 'image-generation'
  | 'video-generation'
  | 'code-generation'
  | 'reasoning'
  | 'function-calling'
  | 'streaming'
  | 'batch-processing';

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  capabilities: ModelCapability[];
  max_tokens?: number;
  max_input_length?: number;
  supports_streaming: boolean;
  pricing?: {
    input_per_token: number;
    output_per_token: number;
    currency: string;
  };
  limits?: {
    requests_per_minute?: number;
    tokens_per_minute?: number;
    concurrent_requests?: number;
  };
}

// Request/Response Wrappers
export interface APIRequest<T = Record<string, unknown>> {
  id?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  params?: T;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AIError;
  metadata?: {
    request_id?: string;
    response_time_ms?: number;
    rate_limit?: RateLimitInfo;
  };
}

// Configuration Types
export interface GlobalAIConfig {
  default_providers: Record<string, AIProvider>;
  fallback_enabled: boolean;
  retry_attempts: number;
  retry_delay_ms: number;
  timeout_ms: number;
  cache_enabled: boolean;
  cache_ttl_seconds: number;
  rate_limiting_enabled: boolean;
}