// Common component type definitions

// Import React types for state setters
import type { Dispatch, SetStateAction } from "react";

// Import ChatMessage type
import type { ChatMessage } from "@/lib/types";

export type StatusType = "ready" | "submitted" | "streaming" | "error";

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}

// Text generation types
export interface TextMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string;
}

// Import TextModel, CodeModel, and ImageModel from their respective files to avoid duplication
export type { TextModel, CodeModel, ImageModel } from '@/types/models';

// Image generation types
export interface GeneratedImage {
  id: string;
  url?: string;
  base64?: string;
  width: number;
  height: number;
  model: string;
  prompt: string;
  generation_time: number;
  seed: number;
  created_at: string;
}


export interface ImageGenerationParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  model?: 'chroma' | 'neta-lumina' | 'flux';
}

// Video generation types
export interface GeneratedVideo {
  id: string;
  url?: string;
  base64?: string;
  width: number;
  height: number;
  frames: number;
  fps: number;
  duration: number;
  model: string;
  prompt: string;
  generation_time: number;
  seed: number;
  created_at: string;
}

export interface VideoParams {
  frames: number;
  fps: number;
  resolution: "480p" | "720p";
  fast: boolean;
  guidanceScale: number;
  seed: number;
}

// Code generation types
export interface CodeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  timestamp: Date;
}


// Component Props Interfaces
export interface MultimodalInputProps {
  chatId?: string;
  input: string;
  setInput: (value: string) => void;
  status: StatusType;
  stop: () => void;
  sendMessage: () => void;
  selectedVisibilityType: string;
  selectedModelId: string;
  className?: string;
  onModelChange?: (modelId: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
  onClearChat?: () => void;
  attachments?: Attachment[];
  setAttachments?: Dispatch<SetStateAction<Attachment[]>>;
  messages?: Message[] | TextMessage[] | CodeMessage[] | ChatMessage[];
  setMessages?: Dispatch<SetStateAction<Message[] | TextMessage[] | CodeMessage[] | ChatMessage[]>>;
  videoParams?: VideoParams;
  setVideoParams?: Dispatch<SetStateAction<VideoParams>>;
}

export interface TextMultimodalInputProps extends Omit<MultimodalInputProps, 'messages' | 'setMessages'> {
  messages: TextMessage[];
  setMessages: Dispatch<SetStateAction<TextMessage[]>>;
  actualMessagesCount?: number;
  models: TextModel[];
}

export interface ImageMultimodalInputProps extends MultimodalInputProps {
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}

export interface VideoMultimodalInputProps extends Omit<MultimodalInputProps, 'messages' | 'setMessages' | 'chatId' | 'videoParams' | 'setVideoParams'> {
  chatId: string;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  videoParams: VideoParams;
  setVideoParams: Dispatch<SetStateAction<VideoParams>>;
}

export interface CodeMultimodalInputProps extends Omit<MultimodalInputProps, 'messages' | 'setMessages'> {
  messages: CodeMessage[];
  setMessages: Dispatch<SetStateAction<CodeMessage[]>>;
  models: CodeModel[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  showLineNumbers: boolean;
  onToggleLineNumbers: () => void;
  selectedModel: string;
  onSuggestionClick: (suggestion: string) => void;
  onClearChat: () => void;
}

// Result Card Types
export interface ResultCardProps<T> {
  item?: T;
  error?: string;
  className?: string;
}

export interface ImageResultCardProps extends ResultCardProps<GeneratedImage> {
  onDownload?: () => void;
  onRegenerate?: () => void;
}

export interface VideoResultCardProps {
  videoId?: string;
  userId?: string;
  videoUrl?: string;
  videoBase64?: string;
  duration?: number;
  frames?: number;
  fps?: number;
  fileSize?: number;
  format?: string;
  width?: number;
  height?: number;
  generationTime?: number;
  prompt: string;
}

export interface CodeResultCardProps extends ResultCardProps<CodeMessage> {
  onCopy?: () => void;
  onDownload?: () => void;
  language?: string;
  showLineNumbers?: boolean;
}

// Settings and Configuration Types
export interface ModelSelectorProps {
  models: Array<TextModel | ImageModel | CodeModel>;
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  onClose: () => void;
}

export interface SettingsProps {
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

// Animation and UI Types
export interface AnimationProps {
  duration?: number;
  delay?: number;
  ease?: string;
  className?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Error Types
export interface ErrorInfo {
  code?: string;
  message: string;
  details?: unknown;
  timestamp: string;
  context?: string;
}

// Event Handler Types
export type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
export type SubmitHandler = (e: React.FormEvent) => void;
export type ClickHandler = (e: React.MouseEvent) => void;
export type KeyHandler = (e: React.KeyboardEvent) => void;
export type FileHandler = (files: FileList) => void;

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};