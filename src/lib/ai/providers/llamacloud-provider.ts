/**
 * LlamaCloud Provider for RAG services
 * Type-first implementation for cloud-based document parsing, indexing, and retrieval
 */

import {
  BaseAIProvider,
  BaseChatRequest,
  BaseChatResponse,
  BaseStreamEvent,
  BaseEmbeddingRequest,
  BaseEmbeddingResponse,
  ModelInfo,
  BaseChatMessage
} from './base-provider';

// ========================
// Type Definitions
// ========================

export interface LlamaCloudConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  source?: string;
  timestamp?: string;
  size?: number;
  mimeType?: string;
  customMetadata?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  startIndex?: number;
  endIndex?: number;
}

export interface Document {
  id: string;
  name: string;
  text?: string;
  chunks?: DocumentChunk[];
  metadata: DocumentMetadata;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// ========================
// API Request/Response Types
// ========================

export interface ParseRequest {
  fileUrl?: string;
  fileContent?: string | Buffer;
  fileName?: string;
  mimeType?: string;
  pipelineId?: string;
  metadata?: Record<string, any>;
}

export interface ParseResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  document?: Document;
  error?: string;
}

export interface IndexRequest {
  pipelineId: string;
  documents: Document | Document[];
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, any>;
}

export interface IndexResponse {
  pipelineId: string;
  indexedCount: number;
  documentIds: string[];
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

export interface SearchRequest {
  pipelineId: string;
  query: string;
  topK?: number;
  filters?: Record<string, any>;
  includeMetadata?: boolean;
  similarityThreshold?: number;
}

export interface SearchResult {
  document: Document;
  score: number;
  chunks: DocumentChunk[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  pipelineId: string;
}

export interface RAGRequest {
  pipelineId: string;
  query: string;
  context?: {
    maxTokens?: number;
    retrievalTopK?: number;
    includeSources?: boolean;
  };
  generation?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  context: string;
  query: string;
  metadata: {
    model: string;
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
  };
}

export interface PipelineConfig {
  id: string;
  name: string;
  description?: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  transformations: string[];
  createdAt: string;
  updatedAt: string;
}

// ========================
// Error Classes
// ========================

export class LlamaCloudError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LlamaCloudError';
  }
}

export class LlamaCloudAuthenticationError extends LlamaCloudError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'LlamaCloudAuthenticationError';
  }
}

export class LlamaCloudRateLimitError extends LlamaCloudError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'LlamaCloudRateLimitError';
  }
}

export class LlamaCloudDocumentError extends LlamaCloudError {
  constructor(message: string, public documentId?: string) {
    super(message, 'DOCUMENT_ERROR');
    this.name = 'LlamaCloudDocumentError';
  }
}

// ========================
// Main Provider Class
// ========================

export class LlamaCloudProvider extends BaseAIProvider {
  name = 'LlamaCloud';
  type = 'custom' as const;
  private config: LlamaCloudConfig;
  private readonly BASE_URL = 'https://api.cloud.llamaindex.ai/api/v1';

  constructor(config: LlamaCloudConfig) {
    super();

    if (!config.apiKey) {
      throw new LlamaCloudAuthenticationError('API key is required');
    }

    this.config = {
      ...config,
      baseUrl: config.baseUrl || this.BASE_URL,
      timeout: config.timeout || 30000,
    };
  }

  // ========================
  // Helper Methods
  // ========================

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof LlamaCloudError) {
        throw error;
      }
      throw new LlamaCloudError(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || response.statusText || 'Unknown error';

    switch (response.status) {
      case 401:
        throw new LlamaCloudAuthenticationError(message);
      case 429:
        throw new LlamaCloudRateLimitError(message);
      case 400:
      case 422:
        throw new LlamaCloudError(message, 'VALIDATION_ERROR', response.status);
      case 404:
        throw new LlamaCloudError(message, 'NOT_FOUND', response.status);
      case 500:
        throw new LlamaCloudError(message, 'INTERNAL_ERROR', response.status);
      default:
        throw new LlamaCloudError(message, 'UNKNOWN_ERROR', response.status);
    }
  }

  // ========================
  // Document Parsing Methods
  // ========================

  /**
   * Parse a document from URL
   */
  async parseDocumentFromUrl(request: ParseRequest & { fileUrl: string }): Promise<ParseResponse> {
    if (!request.fileUrl) {
      throw new LlamaCloudError('fileUrl is required');
    }

    return this.makeRequest<ParseResponse>('/parsing/upload', {
      method: 'POST',
      body: JSON.stringify({
        file_url: request.fileUrl,
        pipeline_id: request.pipelineId,
        metadata: request.metadata,
      }),
    });
  }

  /**
   * Parse a document from file content
   */
  async parseDocumentFromContent(request: ParseRequest & { fileContent: string | Buffer }): Promise<ParseResponse> {
    if (!request.fileContent) {
      throw new LlamaCloudError('fileContent is required');
    }

    // For file content, we need to use multipart/form-data
    const formData = new FormData();

    if (typeof request.fileContent === 'string') {
      formData.append('file', new Blob([request.fileContent], { type: request.mimeType || 'text/plain' }));
    } else {
      // Convert Buffer to Uint8Array for compatibility
      const uint8Array = new Uint8Array(
        request.fileContent.buffer,
        request.fileContent.byteOffset,
        request.fileContent.byteLength
      );
      formData.append('file', new Blob([uint8Array as any], { type: request.mimeType || 'application/octet-stream' }));
    }

    if (request.fileName) {
      formData.append('file_name', request.fileName);
    }

    if (request.pipelineId) {
      formData.append('pipeline_id', request.pipelineId);
    }

    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    const url = `${this.config.baseUrl}/parsing/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json();
  }

  /**
   * Get parsing job status
   */
  async getParsingStatus(jobId: string): Promise<ParseResponse> {
    if (!jobId) {
      throw new LlamaCloudError('jobId is required');
    }

    return this.makeRequest<ParseResponse>(`/parsing/jobs/${jobId}`);
  }

  // ========================
  // Pipeline Management Methods
  // ========================

  /**
   * Create a new indexing pipeline
   */
  async createPipeline(config: {
    name: string;
    description?: string;
    embeddingModel: string;
    chunkSize?: number;
    chunkOverlap?: number;
    transformations?: string[];
  }): Promise<PipelineConfig> {
    return this.makeRequest<PipelineConfig>('/pipelines', {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        description: config.description,
        embedding_config: {
          model_name: config.embeddingModel,
        },
        transform_config: {
          chunk_size: config.chunkSize || 1024,
          chunk_overlap: config.chunkOverlap || 20,
          transformations: config.transformations || ['sentence_splitter'],
        },
      }),
    });
  }

  /**
   * List all pipelines
   */
  async listPipelines(): Promise<PipelineConfig[]> {
    return this.makeRequest<PipelineConfig[]>('/pipelines');
  }

  /**
   * Get pipeline details
   */
  async getPipeline(pipelineId: string): Promise<PipelineConfig> {
    if (!pipelineId) {
      throw new LlamaCloudError('pipelineId is required');
    }

    return this.makeRequest<PipelineConfig>(`/pipelines/${pipelineId}`);
  }

  /**
   * Delete a pipeline
   */
  async deletePipeline(pipelineId: string): Promise<void> {
    if (!pipelineId) {
      throw new LlamaCloudError('pipelineId is required');
    }

    await this.makeRequest<void>(`/pipelines/${pipelineId}`, {
      method: 'DELETE',
    });
  }

  // ========================
  // Document Indexing Methods
  // ========================

  /**
   * Index documents into a pipeline
   */
  async indexDocuments(request: IndexRequest): Promise<IndexResponse> {
    if (!request.pipelineId) {
      throw new LlamaCloudError('pipelineId is required');
    }

    const documents = Array.isArray(request.documents) ? request.documents : [request.documents];

    return this.makeRequest<IndexResponse>(`/pipelines/${request.pipelineId}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        documents: documents.map(doc => ({
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
        })),
        embedding_config: request.embeddingModel ? {
          model_name: request.embeddingModel,
        } : undefined,
      }),
    });
  }

  /**
   * Get document from pipeline
   */
  async getDocument(pipelineId: string, documentId: string): Promise<Document> {
    if (!pipelineId || !documentId) {
      throw new LlamaCloudError('pipelineId and documentId are required');
    }

    return this.makeRequest<Document>(`/pipelines/${pipelineId}/documents/${documentId}`);
  }

  /**
   * List documents in pipeline
   */
  async listDocuments(pipelineId: string, options?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
  }): Promise<{ documents: Document[]; total: number }> {
    if (!pipelineId) {
      throw new LlamaCloudError('pipelineId is required');
    }

    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.filters) params.append('filters', JSON.stringify(options.filters));

    const endpoint = `/pipelines/${pipelineId}/documents${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<{ documents: Document[]; total: number }>(endpoint);
  }

  /**
   * Delete document from pipeline
   */
  async deleteDocument(pipelineId: string, documentId: string): Promise<void> {
    if (!pipelineId || !documentId) {
      throw new LlamaCloudError('pipelineId and documentId are required');
    }

    await this.makeRequest<void>(`/pipelines/${pipelineId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ========================
  // Search Methods
  // ========================

  /**
   * Search documents in a pipeline
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    if (!request.pipelineId || !request.query) {
      throw new LlamaCloudError('pipelineId and query are required');
    }

    return this.makeRequest<SearchResponse>(`/pipelines/${request.pipelineId}/search`, {
      method: 'POST',
      body: JSON.stringify({
        query: request.query,
        top_k: request.topK || 10,
        filters: request.filters,
        include_metadata: request.includeMetadata !== false,
        similarity_threshold: request.similarityThreshold || 0.7,
      }),
    });
  }

  // ========================
  // RAG Methods
  // ========================

  /**
   * Perform retrieval-augmented generation
   */
  async rag(request: RAGRequest): Promise<RAGResponse> {
    if (!request.pipelineId || !request.query) {
      throw new LlamaCloudError('pipelineId and query are required');
    }

    return this.makeRequest<RAGResponse>(`/pipelines/${request.pipelineId}/rag`, {
      method: 'POST',
      body: JSON.stringify({
        query: request.query,
        context: {
          max_tokens: request.context?.maxTokens || 4096,
          retrieval_top_k: request.context?.retrievalTopK || 5,
          include_sources: request.context?.includeSources !== false,
          ...request.context,
        },
        generation: {
          model: request.generation?.model || 'gpt-3.5-turbo',
          temperature: request.generation?.temperature || 0.1,
          max_tokens: request.generation?.maxTokens || 1024,
          system_prompt: request.generation?.systemPrompt,
          ...request.generation,
        },
      }),
    });
  }

  // ========================
  // Base Provider Implementation
  // ========================

  async initialize(config: any): Promise<void> {
    // Configuration is handled in constructor
  }

  async test(): Promise<boolean> {
    return this.healthCheck();
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const embeddingModels = await this.listModels();
      return embeddingModels.map((model: string) => ({
        id: model,
        name: model,
        displayName: model,
        description: `LlamaCloud embedding model: ${model}`,
        capabilities: {
          text: false,
          vision: false,
          tools: false,
          thinking: false,
          embeddings: true,
        },
        contextWindow: 8192,
      }));
    } catch {
      return [];
    }
  }

  async createChat(request: BaseChatRequest): Promise<BaseChatResponse> {
    if (!request.pipelineId) {
      throw new LlamaCloudError('pipelineId is required for LlamaCloud chat');
    }

    const lastMessage = request.messages[request.messages.length - 1];
    if (!lastMessage) {
      throw new LlamaCloudError('No messages provided');
    }

    const genParams: any = {
      temperature: request.temperature,
      maxTokens: request.max_tokens,
    };
    if (request.model) {
      genParams.model = request.model;
    }

    const response = await this.rag({
      pipelineId: request.pipelineId,
      query: lastMessage.content,
      generation: genParams,
    });

    return {
      content: response.answer,
      model: request.model,
      usage: {
        prompt_tokens: 0, // Not provided by LlamaCloud
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  async *streamChat(request: BaseChatRequest): AsyncIterable<BaseStreamEvent> {
    if (!request.pipelineId) {
      throw new LlamaCloudError('pipelineId is required for LlamaCloud streamChat');
    }

    const lastMessage = request.messages[request.messages.length - 1];
    if (!lastMessage) {
      throw new LlamaCloudError('No messages provided');
    }

    try {
      yield { type: 'start' };

      const genParams: any = {
        temperature: request.temperature,
        maxTokens: request.max_tokens,
      };
      if (request.model) {
        genParams.model = request.model;
      }

      const response = await this.rag({
        pipelineId: request.pipelineId,
        query: lastMessage.content,
        generation: genParams,
      });

      // Yield content
      for (const char of response.answer) {
        yield {
          type: 'content',
          content: char,
        };
      }

      yield { type: 'done' };
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createEmbeddings(request: BaseEmbeddingRequest): Promise<BaseEmbeddingResponse> {
    throw new LlamaCloudError('Direct embedding generation is not supported. Use search or index methods instead.');
  }

  protected convertMessages(messages: BaseChatMessage[]): any {
    // Not needed for RAG, but required by base class
    return messages;
  }

  protected convertResponse(response: any): BaseChatResponse {
    // Not needed for RAG, but required by base class
    return response;
  }

  // Generate embeddings (not directly supported, use search instead)
  async generateEmbedding(text: string): Promise<number[]> {
    throw new LlamaCloudError('Direct embedding generation is not supported. Use search or index methods instead.');
  }

  // List models (get available embedding models)
  async listModels(): Promise<string[]> {
    return this.makeRequest<string[]>('/models/embedding');
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<void>('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Additional convenience methods for backward compatibility
  async chat(request: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    pipelineId?: string;
    [key: string]: any;
  }): Promise<any> {
    return this.createChat(request as BaseChatRequest);
  }

  // ========================
  // Utility Methods
  // ========================

  /**
   * Wait for a parsing job to complete
   */
  async waitForParsingJob(
    jobId: string,
    options: {
      timeout?: number;
      interval?: number;
    } = {}
  ): Promise<ParseResponse> {
    const timeout = options.timeout || 60000;
    const interval = options.interval || 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getParsingStatus(jobId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new LlamaCloudError('Parsing job timed out');
  }

  /**
   * Batch index multiple documents
   */
  async batchIndexDocuments(
    pipelineId: string,
    documents: Document[],
    options: {
      batchSize?: number;
      concurrency?: number;
    } = {}
  ): Promise<IndexResponse[]> {
    const batchSize = options.batchSize || 10;
    const results: IndexResponse[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const result = await this.indexDocuments({
        pipelineId,
        documents: batch,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Create a simple RAG pipeline with default settings
   */
  async createSimpleRAGPipeline(name: string): Promise<PipelineConfig> {
    return this.createPipeline({
      name,
      description: `Simple RAG pipeline: ${name}`,
      embeddingModel: 'text-embedding-ada-002',
      chunkSize: 1024,
      chunkOverlap: 20,
      transformations: ['sentence_splitter'],
    });
  }
}

// ========================
// Factory Function
// ========================

export function createLlamaCloudProvider(config: LlamaCloudConfig): LlamaCloudProvider {
  return new LlamaCloudProvider(config);
}

// ========================
// Default Export
// ========================

export default LlamaCloudProvider;