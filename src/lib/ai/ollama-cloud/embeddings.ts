import {
  EmbeddingRequest,
  EmbeddingResponse,
} from './types';
import { ollamaClient } from './client';

export class EmbeddingsService {
  /**
   * Generate embeddings for a single text
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await ollamaClient.post<EmbeddingResponse>('/api/embed', {
      model: request.model,
      input: request.input,
      options: request.options,
    });

    return response;
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async createBatchEmbeddings(
    model: string,
    inputs: string[],
    options?: EmbeddingRequest['options']
  ): Promise<number[][]> {
    const response = await this.createEmbedding({
      model,
      input: inputs,
      options,
    });

    return response.embeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must be of same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find most similar texts using embeddings
   */
  async findSimilarTexts(
    query: string,
    corpus: string[],
    model: string = 'qwen3-embedding',
    topK: number = 5
  ): Promise<Array<{ text: string; score: number; index: number }>> {
    // Generate embedding for query
    const queryEmbedding = await this.createEmbedding({
      model,
      input: query,
    });

    // Generate embeddings for corpus
    const corpusEmbeddings = await this.createBatchEmbeddings(model, corpus);

    // Calculate similarities
    const similarities = corpusEmbeddings.map((embedding, index) => ({
      text: corpus[index],
      score: this.cosineSimilarity(queryEmbedding.embeddings[0], embedding),
      index,
    }));

    // Sort by similarity score and return top K
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Cluster texts based on embedding similarity
   */
  async clusterTexts(
    texts: string[],
    model: string = 'qwen3-embedding',
    threshold: number = 0.7
  ): Promise<string[][]> {
    if (texts.length === 0) return [];

    // Generate embeddings for all texts
    const embeddings = await this.createBatchEmbeddings(model, texts);
    const clusters: string[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < texts.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [texts[i]];
      visited.add(i);

      // Find similar texts
      for (let j = i + 1; j < texts.length; j++) {
        if (visited.has(j)) continue;

        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        if (similarity >= threshold) {
          cluster.push(texts[j]);
          visited.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Reduce dimensionality of embeddings using PCA (simplified)
   */
  reduceDimensions(
    embeddings: number[][],
    dimensions: number = 2
  ): number[][] {
    if (embeddings.length === 0) return [];

    const n = embeddings.length;
    const d = embeddings[0].length;

    // Center the data
    const means = new Array(d).fill(0);
    for (const embedding of embeddings) {
      for (let i = 0; i < d; i++) {
        means[i] += embedding[i];
      }
    }
    for (let i = 0; i < d; i++) {
      means[i] /= n;
    }

    const centered = embeddings.map(embedding =>
      embedding.map((val, i) => val - means[i])
    );

    // Compute covariance matrix
    const cov: number[][] = Array(d).fill(null).map(() => Array(d).fill(0));
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        for (let k = 0; k < n; k++) {
          cov[i][j] += centered[k][i] * centered[k][j];
        }
        cov[i][j] /= (n - 1);
      }
    }

    // For simplicity, return the first 'dimensions' columns of centered data
    // In a real implementation, you would compute eigenvectors of cov
    return centered.map(vec => vec.slice(0, dimensions));
  }

  /**
   * Get embedding model information
   */
  getModelInfo(model: string) {
    const models: Record<string, { dimensions: number; description: string }> = {
      'embeddinggemma': {
        dimensions: 384,
        description: 'Fast and efficient embedding model',
      },
      'qwen3-embedding': {
        dimensions: 1024,
        description: 'High-quality embedding model with better accuracy',
      },
      'all-minilm': {
        dimensions: 384,
        description: 'Lightweight multilingual embedding model',
      },
    };

    return models[model] || { dimensions: 0, description: 'Unknown model' };
  }

  /**
   * Check if model is available
   */
  async isModelAvailable(model: string): Promise<boolean> {
    try {
      const response = await ollamaClient.get('/api/tags');
      const models = response as { models: { model: string; type: string }[] };
      return models.models.some(m => m.model === model && m.type === 'text');
    } catch {
      return false;
    }
  }

  /**
   * List available embedding models
   */
  async listEmbeddingModels(): Promise<Array<{ name: string; dimensions: number; description: string }>> {
    try {
      const response = await ollamaClient.get('/api/tags');
      const models = response as { models: { model: string; type: string }[] };

      const embeddingModels = ['embeddinggemma', 'qwen3-embedding', 'all-minilm'];

      return models.models
        .filter(m => embeddingModels.some(em => m.model.includes(em)))
        .map(m => {
          const info = this.getModelInfo(m.model);
          return {
            name: m.model,
            dimensions: info.dimensions,
            description: info.description,
          };
        });
    } catch (error) {
      console.error('Failed to list embedding models:', error);
      return [];
    }
  }
}

// Export singleton instance
export const embeddingsService = new EmbeddingsService();