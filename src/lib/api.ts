// API client for content generation APIs
// Now using Next.js API routes (relative paths)

import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  DualImageGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoListResponse,
  VideoGenerationStreamEvent,
  TextGenerationRequest,
  TextGenerationResponse,
  CodeGenerationRequest,
  CodeGenerationResponse,
  TextModelsResponse,
  CodeModelsResponse,
  RAGUploadResponse,
  DocumentInfo,
  CollectionStats,
  RAGQueryResponse,
  RAGSourceDocument
} from '@/types/api';

const RAG_API_BASE_URL = ''; // Using relative paths for Next.js API routes

// Export types from the main types file for backward compatibility
export type { CodeModel } from '@/types/components';

// Re-export types that are imported but used elsewhere
export type {
  RAGUploadResponse,
  RAGSourceDocument,
  AIStatus,
  UserSession,
  VideoGenerationRequest,
  VideoModelsResponse
} from '@/types/api';

// Upload document to RAG backend
export async function uploadDocument(
  file: File,
  chunkingStrategy: 'pages' | 'semantic' | 'recursive' = 'pages'
): Promise<RAGUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chunking_strategy', chunkingStrategy);

  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

// Query RAG system
export async function queryRAG(
  queryText: string,
  documentIds: string[] = []
): Promise<RAGQueryResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: queryText,
        document_ids: documentIds, // Pass the document IDs to filter by
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the response with all fields from backend
    return {
      query: queryText,
      answer: data.response || data.answer || "",
      sources: data.sources || [],
      success: true,
    };
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw error;
  }
}

// Get all documents
export async function getDocuments(): Promise<DocumentInfo[]> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/documents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

// Get document info
export async function getDocumentInfo(documentId: string): Promise<DocumentInfo> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching document info:', error);
    throw error;
  }
}

// Delete document
export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Get collection stats
export async function getCollectionStats(): Promise<CollectionStats> {
  try {
    // Since stats endpoint doesn't exist, return default values
    return {
      name: 'documents',
      document_count: 0,
      total_chunks: 0,
      total_characters: 0,
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching collection stats:', error);
    throw error;
  }
}

// Query RAG system with streaming
export async function queryRAGStream(
  queryText: string,
  documentIds: string[] = [],
  onChunk: (chunk: {
    type?: 'content' | 'sources' | 'done' | 'error';
    content?: string;
    sources?: RAGSourceDocument[];
    done?: boolean;
    error?: string;
    accumulated?: string;
    generated_with_ai?: boolean;
  }) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/v1/chat/ask-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: queryText,
        document_ids: documentIds,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix

          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const chunk = JSON.parse(data);
            onChunk(chunk);
          } catch (e) {
            // Skip invalid JSON
            console.warn('Failed to parse chunk:', data);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Error querying RAG stream:', error);
    onError(error as Error);
  }
}

// Check API health
export async function checkHealth(): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}

// Generate image
export async function generateImage(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Check multiple possible error fields
      let errorMessage = errorData.error || errorData.detail || `Image generation failed: ${response.statusText}`;

      // If errorData is a response from our backend, it will have an error field
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        errorMessage = errorMessage.message || JSON.stringify(errorMessage);
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Get or create user session
export async function getUserSession(): Promise<{ user_id: string; is_new: boolean }> {
  try {
    // Try to get existing user ID from localStorage first
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      return { user_id: storedUserId, is_new: false };
    }

    // Create new session
    const response = await fetch(`${RAG_API_BASE_URL}/api/users/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const sessionData = await response.json();
    localStorage.setItem('user_id', sessionData.user_id);

    return sessionData;
  } catch (error) {
    console.error('Error getting user session:', error);
    // Fallback to a random UUID if API fails
    const fallbackId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', fallbackId);
    return { user_id: fallbackId, is_new: true };
  }
}

// Generate dual images (chroma + neta-lumina)
export async function generateDualImage(params: ImageGenerationRequest): Promise<DualImageGenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/images/generate-dual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Check multiple possible error fields
      let errorMessage = errorData.error || errorData.detail || `Dual image generation failed: ${response.statusText}`;

      // If errorData is a response from our backend, it will have an error field
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        errorMessage = errorMessage.message || JSON.stringify(errorMessage);
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating dual images:', error);
    throw error;
  }
}

// Generate video from image
export async function generateVideo(params: VideoGenerationRequest): Promise<VideoGenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/videos/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle nested error structure: {"detail": {"message": "..."}}
      let errorMessage = `Video generation failed: ${response.statusText}`;

      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.detail.message) {
          errorMessage = errorData.detail.message;
        }
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

// Generate video with streaming progress
export async function generateVideoStream(
  params: VideoGenerationRequest,
  onProgress?: (event: VideoGenerationStreamEvent) => void
): Promise<VideoGenerationResponse | null> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/videos/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Video streaming failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let finalResult = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (onProgress) {
                onProgress(event);
              }

              if (event.type === 'complete') {
                finalResult = event;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Video generation failed');
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    return finalResult;
  } catch (error) {
    console.error('Error generating video stream:', error);
    throw error;
  }
}

// Get user's videos
export async function getUserVideos(
  userId: string,
  page = 1,
  pageSize = 10,
  order: 'asc' | 'desc' = 'desc'
): Promise<VideoListResponse> {
  try {
    const response = await fetch(
      `${RAG_API_BASE_URL}/api/videos/user/${userId}/videos?page=${page}&page_size=${pageSize}&order=${order}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get videos: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user videos:', error);
    throw error;
  }
}

// Get video file URL
export function getVideoUrl(userId: string, videoId: string): string {
  return `${RAG_API_BASE_URL}/api/videos/file/${userId}/${videoId}`;
}

// Get available video models
export async function getVideoModels(): Promise<import('@/types/api').VideoModelsResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/videos/models`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get video models: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting video models:', error);
    throw error;
  }
}

// Generate text using OpenRouter
export async function generateText(params: TextGenerationRequest): Promise<TextGenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/texts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle nested error structure
      let errorMessage = `Text generation failed: ${response.statusText}`;
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : errorData.detail.message || errorData.detail;
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

// Generate text with streaming response
export async function* generateTextStream(params: TextGenerationRequest): AsyncGenerator<import('@/types/api').TextStreamEvent, void, unknown> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/texts/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ ...params, stream: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Streaming request failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            // End of stream
            return;
          }

          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.warn('Failed to parse SSE data:', data, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in text streaming:', error);
    throw error;
  }
}

// Get available text models
export async function getTextModels(): Promise<TextModelsResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/texts/models`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get text models: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting text models:', error);
    throw error;
  }
}

// Generate code
export async function generateCode(params: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/codes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Code generation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

// Generate code with streaming response
export async function* generateCodeStream(params: CodeGenerationRequest): AsyncGenerator<import('@/types/api').CodeStreamEvent, void, unknown> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/codes/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ ...params, stream: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Streaming request failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            // End of stream
            return;
          }

          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.warn('Failed to parse SSE data:', data, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in code streaming:', error);
    throw error;
  }
}

// Get available code models
export async function getCodeModels(): Promise<CodeModelsResponse> {
  try {
    const response = await fetch(`${RAG_API_BASE_URL}/api/codes/models`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get code models: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting code models:', error);
    throw error;
  }
}