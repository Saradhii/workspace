// Runtime type guards for API responses and data validation

import type {
  RAGQueryResponse,
  RAGSourceDocument,
  VideoGenerationResponse,
  TextGenerationResponse,
  CodeGenerationResponse,
  ImageGenerationResponse,
  ApiResponse
} from '@/types/api';

// Type guard for RAGSourceDocument
export function isRAGSourceDocument(obj: unknown): obj is RAGSourceDocument {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as RAGSourceDocument).content === 'string' &&
    typeof (obj as RAGSourceDocument).metadata === 'object' &&
    (obj as RAGSourceDocument).metadata !== null &&
    typeof (obj as RAGSourceDocument).metadata.document_id === 'string'
  );
}

// Type guard for RAGQueryResponse
export function isRAGQueryResponse(obj: unknown): obj is RAGQueryResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as RAGQueryResponse).success === 'boolean' &&
    typeof (obj as RAGQueryResponse).answer === 'string' &&
    Array.isArray((obj as RAGQueryResponse).sources) &&
    ((obj as RAGQueryResponse).sources as unknown[]).every(isRAGSourceDocument)
  );
}

// Type guard for VideoGenerationResponse
export function isVideoGenerationResponse(obj: unknown): obj is VideoGenerationResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as VideoGenerationResponse).success === 'boolean' &&
    ((obj as VideoGenerationResponse).success
      ? typeof (obj as VideoGenerationResponse).video_id === 'string'
      : true)
  );
}

// Type guard for TextGenerationResponse
export function isTextGenerationResponse(obj: unknown): obj is TextGenerationResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as TextGenerationResponse).success === 'boolean' &&
    ((obj as TextGenerationResponse).success
      ? typeof (obj as TextGenerationResponse).content === 'string'
      : true)
  );
}

// Type guard for CodeGenerationResponse
export function isCodeGenerationResponse(obj: unknown): obj is CodeGenerationResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as CodeGenerationResponse).success === 'boolean' &&
    ((obj as CodeGenerationResponse).success
      ? typeof (obj as CodeGenerationResponse).code === 'string'
      : true)
  );
}

// Type guard for ImageGenerationResponse
export function isImageGenerationResponse(obj: unknown): obj is ImageGenerationResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ImageGenerationResponse).success === 'boolean' &&
    ((obj as ImageGenerationResponse).success
      ? typeof (obj as ImageGenerationResponse).image_id === 'string'
      : true)
  );
}

// Generic API response type guard
export function isApiResponse<T>(obj: unknown, validator?: (data: unknown) => data is T): obj is ApiResponse<T> {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    typeof (obj as ApiResponse).success !== 'boolean'
  ) {
    return false;
  }

  // If a validator is provided and data exists, validate the data
  if (validator && (obj as ApiResponse).data !== undefined) {
    return validator((obj as ApiResponse).data);
  }

  return true;
}

// Safe JSON parser with type guard
export function safeJSONParse<T>(json: string, typeGuard: (obj: unknown) => obj is T): T | null {
  try {
    const parsed = JSON.parse(json);
    return typeGuard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Validate and extract error from API response
export function extractApiError(obj: unknown): string | null {
  if (typeof obj === 'object' && obj !== null) {
    const apiObj = obj as Record<string, unknown>;

    // Check for nested error structure
    if (typeof apiObj.detail === 'string') {
      return apiObj.detail;
    }

    if (typeof apiObj.detail === 'object' && apiObj.detail !== null) {
      const detail = apiObj.detail as Record<string, unknown>;
      if (typeof detail.message === 'string') {
        return detail.message;
      }
    }

    // Check for direct error message
    if (typeof apiObj.error === 'string') {
      return apiObj.error;
    }
  }

  return null;
}

// Validate environment variables at runtime
export function validateEnvVariables(): {
  RAG_API_URL?: string;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof window === 'undefined') {
    // Server-side validation
    if (!process.env.RAG_API_URL) {
      errors.push('RAG_API_URL environment variable is not set');
    }
  }

  const result: {
    RAG_API_URL?: string;
    isValid: boolean;
    errors: string[];
  } = {
    isValid: errors.length === 0,
    errors
  };

  if (process.env.RAG_API_URL) {
    result.RAG_API_URL = process.env.RAG_API_URL;
  }

  return result;
}