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
    const request: EmbeddingRequest = {
      model,
      input: inputs,
    };

    if (options) {
      request.options = options;
    }

    const response = await this.createEmbedding(request);

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
      const a = vecA[i];
      const b = vecB[i];
      if (a !== undefined && b !== undefined) {
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
      }
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
    const queryVector = queryEmbedding.embeddings[0];
    if (!queryVector) {
      return [];
    }

    const similarities = corpusEmbeddings.map((embedding, index) => {
      const text = corpus[index];
      if (text === undefined) return null;

      return {
        text,
        score: this.cosineSimilarity(queryVector, embedding),
        index,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

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

      const textI = texts[i];
      if (textI === undefined) continue;
      const cluster: string[] = [textI];
      visited.add(i);

      // Find similar texts
      for (let j = i + 1; j < texts.length; j++) {
        if (visited.has(j)) continue;

        const embeddingI = embeddings[i];
        const embeddingJ = embeddings[j];

        if (!embeddingI || !embeddingJ) continue;

        const text = texts[j];
        if (text !== undefined) {
          const similarity = this.cosineSimilarity(embeddingI, embeddingJ);
          if (similarity >= threshold) {
            cluster.push(text);
            visited.add(j);
          }
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

    // Filter out invalid embeddings and ensure all have the same length
    const validEmbeddings = embeddings.filter(e => e && e.length > 0);
    if (validEmbeddings.length === 0) return [];

    const n = validEmbeddings.length;
    const d = validEmbeddings[0]!.length;

    // Center the data
    const means = new Array(d).fill(0);
    for (const embedding of validEmbeddings) {
      for (let i = 0; i < d; i++) {
        const val = embedding[i];
        if (val !== undefined) {
          means[i] += val;
        }
      }
    }
    for (let i = 0; i < d; i++) {
      means[i] /= n;
    }

    const centered = validEmbeddings.map(embedding =>
      embedding.map((val, i) => {
        if (val === undefined || means[i] === undefined) return 0;
        return val - means[i];
      })
    );

    // Compute covariance matrix
    const cov: number[][] = Array(d).fill(null).map(() => Array(d).fill(0));
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        for (let k = 0; k < n; k++) {
          const centeredEmbedding = centered[k];
          if (centeredEmbedding && cov[i]) {
            const valI = centeredEmbedding[i];
            const valJ = centeredEmbedding[j];
            if (valI !== undefined && valJ !== undefined) {
              cov[i][j] += valI * valJ;
            }
          }
        }
        if (cov[i] && n > 1) {
          cov[i][j] /= (n - 1);
        }
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