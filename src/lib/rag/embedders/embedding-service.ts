/**
 * Embedding Service for RAG Studio
 *
 * Generates vector embeddings using HuggingFace models
 * Supports batch processing for efficiency
 */

// ========================
// Type Definitions
// ========================

export interface EmbeddingModel {
  id: string;
  name: string;
  dimensions: number;
  maxTokens: number;
  provider: 'huggingface';
}

export interface EmbeddingRequest {
  texts: string[];
  model: string;
  provider?: 'huggingface';
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  tokensUsed?: number;
}

export interface EmbeddingProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

export interface BatchEmbeddingResult {
  success: boolean;
  embeddings: number[][];
  model: string;
  dimensions: number;
  totalChunks: number;
  totalBatches: number;
  processingTimeMs: number;
  error?: string;
}

// ========================
// Available Models
// ========================

export const EMBEDDING_MODELS: Record<string, EmbeddingModel> = {
  'all-MiniLM-L6-v2': {
    id: 'sentence-transformers/all-MiniLM-L6-v2',
    name: 'all-MiniLM-L6-v2',
    dimensions: 384,
    maxTokens: 256,
    provider: 'huggingface',
  },
  'all-mpnet-base-v2': {
    id: 'sentence-transformers/all-mpnet-base-v2',
    name: 'all-mpnet-base-v2',
    dimensions: 768,
    maxTokens: 384,
    provider: 'huggingface',
  },
};

// ========================
// Embedding Service
// ========================

class EmbeddingService {
  private readonly HUGGINGFACE_API_KEY: string;
  private readonly HUGGINGFACE_BASE_URL: string;
  private readonly BATCH_SIZE = 10; // Process 10 chunks at a time
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor() {
    this.HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
    this.HUGGINGFACE_BASE_URL = process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co';

    if (!this.HUGGINGFACE_API_KEY) {
      console.warn('[EmbeddingService] Warning: HUGGINGFACE_API_KEY not set');
    }
  }

  /**
   * Generate embeddings for a batch of texts
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const { texts, model, provider = 'huggingface' } = request;

    if (provider !== 'huggingface') {
      throw new Error(`Unsupported provider: ${provider}. Only 'huggingface' is supported.`);
    }

    if (!this.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not configured');
    }

    const modelInfo = this.getModelInfo(model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }

    // Truncate texts if needed
    const truncatedTexts = texts.map(text => this.truncateText(text, modelInfo.maxTokens));

    // Call HuggingFace API
    const embeddings = await this.callHuggingFaceAPI(modelInfo.id, truncatedTexts);

    return {
      embeddings,
      model: modelInfo.id,
      dimensions: modelInfo.dimensions,
      tokensUsed: truncatedTexts.reduce((sum, text) => sum + this.estimateTokens(text), 0),
    };
  }

  /**
   * Generate embeddings for multiple chunks with progress tracking
   */
  async generateBatchEmbeddings(
    texts: string[],
    model: string,
    onProgress?: (progress: EmbeddingProgress) => void
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();

    try {
      const modelInfo = this.getModelInfo(model);
      if (!modelInfo) {
        throw new Error(`Unknown model: ${model}`);
      }

      // Split into batches
      const batches = this.createBatches(texts, this.BATCH_SIZE);
      const totalBatches = batches.length;
      const allEmbeddings: number[][] = [];

      console.log(`[EmbeddingService] Processing ${texts.length} texts in ${totalBatches} batches`);

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;

        // Update progress
        if (onProgress) {
          onProgress({
            current: i * this.BATCH_SIZE,
            total: texts.length,
            percentage: Math.round((i / totalBatches) * 100),
            status: 'processing',
            message: `Processing batch ${batchNumber}/${totalBatches}...`,
          });
        }

        try {
          // Generate embeddings for batch with retry
          const batchEmbeddings = await this.generateEmbeddingsWithRetry(modelInfo.id, batch);
          allEmbeddings.push(...batchEmbeddings);

          console.log(`[EmbeddingService] Batch ${batchNumber}/${totalBatches} completed (${batchEmbeddings.length} embeddings)`);
        } catch (error) {
          console.error(`[EmbeddingService] Batch ${batchNumber} failed:`, error);
          throw new Error(`Failed to process batch ${batchNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await this.delay(200);
        }
      }

      const processingTimeMs = Date.now() - startTime;

      // Final progress update
      if (onProgress) {
        onProgress({
          current: texts.length,
          total: texts.length,
          percentage: 100,
          status: 'completed',
          message: `Completed ${texts.length} embeddings in ${(processingTimeMs / 1000).toFixed(2)}s`,
        });
      }

      console.log(`[EmbeddingService] Completed all batches: ${allEmbeddings.length} embeddings generated`);

      return {
        success: true,
        embeddings: allEmbeddings,
        model: modelInfo.id,
        dimensions: modelInfo.dimensions,
        totalChunks: texts.length,
        totalBatches,
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (onProgress) {
        onProgress({
          current: 0,
          total: texts.length,
          percentage: 0,
          status: 'error',
          message: errorMessage,
        });
      }

      return {
        success: false,
        embeddings: [],
        model,
        dimensions: 0,
        totalChunks: texts.length,
        totalBatches: 0,
        processingTimeMs,
        error: errorMessage,
      };
    }
  }

  /**
   * Call HuggingFace API with retries
   */
  private async generateEmbeddingsWithRetry(modelId: string, texts: string[]): Promise<number[][]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.callHuggingFaceAPI(modelId, texts);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[EmbeddingService] Attempt ${attempt}/${this.RETRY_ATTEMPTS} failed:`, lastError.message);

        if (attempt < this.RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError || new Error('Failed to generate embeddings');
  }

  /**
   * Call HuggingFace Inference API
   */
  private async callHuggingFaceAPI(modelId: string, texts: string[]): Promise<number[][]> {
    const url = `${this.HUGGINGFACE_BASE_URL}/models/${modelId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: texts,
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error (${response.status}): ${errorText}`);
    }

    const embeddings = await response.json();

    // Handle both single and batch responses
    if (Array.isArray(embeddings[0]) && typeof embeddings[0][0] === 'number') {
      // Batch response: [[emb1], [emb2], ...]
      return embeddings as number[][];
    } else if (Array.isArray(embeddings) && typeof embeddings[0] === 'number') {
      // Single response: [emb]
      return [embeddings as number[]];
    } else {
      throw new Error('Unexpected response format from HuggingFace API');
    }
  }

  /**
   * Get model information
   */
  getModelInfo(modelName: string): EmbeddingModel | null {
    return EMBEDDING_MODELS[modelName] || null;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): EmbeddingModel[] {
    return Object.values(EMBEDDING_MODELS);
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Truncate text to max tokens (rough estimate)
   */
  private truncateText(text: string, maxTokens: number): string {
    // Rough estimate: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) {
      return text;
    }
    return text.substring(0, maxChars);
  }

  /**
   * Estimate token count (rough)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ========================
// Singleton Instance
// ========================

const embeddingService = new EmbeddingService();

export default embeddingService;
export { EmbeddingService };
