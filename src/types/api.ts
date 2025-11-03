// API Types for Content Generation
// ===================================

// Common Types
export interface UserSession {
  user_id: string;
  is_new: boolean;
  created_at?: string;
}

// ===================================
// RAG (Retrieval-Augmented Generation) Types
// ===================================

export interface RAGUploadResponse {
  success: boolean;
  document_id: string;
  file_name: string;
  message?: string;
  error?: string;
  request_id?: string;
}

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

export interface RAGQueryResponse {
  success: boolean;
  answer: string;
  sources: RAGSourceDocument[];
  query: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
  request_id?: string;
}

export interface DocumentInfo {
  document_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
  chunk_count?: number;
  metadata?: Record<string, any>;
}

export interface CollectionStats {
  name: string;
  document_count: number;
  total_chunks: number;
  total_characters: number;
  last_updated: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  error_type?: string;
  request_id?: string;
}

// ===================================
// Text Generation Types
// ===================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TextGenerationRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  user_id?: string;
}

export interface TextUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TextGenerationResponse {
  success: boolean;
  content?: string;
  model_used?: string;
  usage?: TextUsage;
  finish_reason?: string;
  error?: string;
  error_type?: string;
  request_id?: string;
}

export interface TextStreamEvent {
  type: 'content' | 'reasoning' | 'usage' | 'done' | 'error';
  content?: string;
  accumulated?: string;
  reasoning?: string;
  usage?: TextUsage;
  model?: string;
  error?: string;
}

// Import model interfaces from the common models file
import type { TextModel, CodeModel } from '@/types/models';

// Re-export for backward compatibility
export type { TextModel, CodeModel } from '@/types/models';

export interface TextModelsResponse {
  success: boolean;
  models: TextModel[];
  count: number;
}

// ===================================
// Image Generation Types
// ===================================

export interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  model?: 'chroma' | 'neta-lumina';
  user_id?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  image_id: string;
  image_url?: string;
  image_base64?: string;
  format: string;
  width: number;
  height: number;
  generation_time_ms: number;
  parameters: Record<string, any>;
  model_used: string;
  seed_used: number;
  error?: string;
  request_id?: string;
}

export interface DualImageGenerationResponse {
  success: boolean;
  chroma?: ImageGenerationResponse;
  neta_lumina?: ImageGenerationResponse;
  total_generation_time_ms: number;
  request_id: string;
  errors?: Record<string, string>;
}

export interface ImageGenerationStreamEvent {
  type: 'progress' | 'complete' | 'error';
  timestamp: string;
  progress?: number;
  stage?: string;
  message?: string;
  image_id?: string;
  image_url?: string;
  image_base64?: string;
  generation_time_ms?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface ImageModel {
  name: string;
  display_name: string;
  description: string;
  max_width: number;
  max_height: number;
  supported_formats: string[];
  features: string[];
}

export interface ImageListResponse {
  success: boolean;
  images: Record<string, any>[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserImageStats {
  user_id: string;
  total_generated: number;
  total_this_month: number;
  favorite_model: string;
  average_generation_time_ms: number;
  most_used_size: Record<string, number>;
  generation_history: Record<string, any>[];
}

// ===================================
// Video Generation Types
// ===================================

export interface VideoGenerationRequest {
  image?: string; // base64 encoded
  prompt: string;
  negative_prompt?: string;
  frames?: number;
  fps?: number;
  guidance_scale?: number;
  guidance_scale_2?: number;
  resolution?: '480p' | '720p';
  fast?: boolean;
  seed?: number;
  user_id?: string;
}

export interface VideoGenerationResponse {
  success: boolean;
  video_id: string;
  video_url?: string;
  video_base64?: string;
  format: string;
  width: number;
  height: number;
  frames: number;
  fps: number;
  duration: number;
  file_size?: number;
  generation_time_ms: number;
  parameters: Record<string, any>;
  model_used: string;
  seed_used: number;
  error?: string;
  request_id?: string;
  created_at: string;
}

export interface VideoGenerationStreamEvent {
  type: 'progress' | 'complete' | 'error';
  timestamp: string;
  progress?: number;
  stage?: string;
  message?: string;
  frames_completed?: number;
  video_id?: string;
  video_url?: string;
  video_base64?: string;
  generation_time_ms?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface VideoModel {
  name: string;
  display_name: string;
  description: string;
  max_frames: number;
  max_resolution: string;
  supported_formats: string[];
  features: string[];
  avg_generation_time?: string;
}

export interface VideoModelsResponse {
  success: boolean;
  models: VideoModel[];
  count: number;
}

export interface VideoListResponse {
  success: boolean;
  videos: Record<string, any>[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserVideoStats {
  user_id: string;
  total_generated: number;
  total_this_month: number;
  favorite_resolution: string;
  average_generation_time_ms: number;
  average_duration_seconds: number;
  most_used_frame_count: number;
  generation_history: Record<string, any>[];
}

export interface VideoUploadRequest {
  image_base64: string;
  filename?: string;
  format?: string;
}

export interface VideoUploadResponse {
  success: boolean;
  image_id: string;
  image_url: string;
  temporary: boolean;
  expires_at?: string;
}

// ===================================
// Code Generation Types
// ===================================

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  user_id?: string;
}

export interface CodeGenerationResponse {
  success: boolean;
  code?: string;
  language?: string;
  model?: string;
  tokens_used?: number;
  generation_time?: number;
  request_id?: string;
  error?: string;
}

export interface CodeStreamEvent {
  type: 'start' | 'content' | 'done' | 'error';
  content?: string;
  request_id?: string;
  error?: string;
}

export interface CodeModelsResponse {
  success: boolean;
  models: CodeModel[];
  count: number;
}

// ===================================
// Health Check Types
// ===================================

export interface HealthResponse {
  status: string;
  message: string;
  version?: string;
  components?: {
    database: 'healthy' | 'unhealthy';
    ai_services: Record<string, 'healthy' | 'unhealthy' | 'disabled'>;
    storage: 'healthy' | 'unhealthy';
  };
}

// ===================================
// Error Types
// ===================================

export interface ApiError {
  detail: string | {
    message: string;
    type?: string;
    code?: string;
  };
  status_code?: number;
  request_id?: string;
}

// Streaming SSE Data Types
export interface SSEData {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
}