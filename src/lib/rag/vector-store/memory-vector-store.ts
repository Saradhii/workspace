/**
 * In-Memory Vector Store for RAG Studio
 *
 * Privacy-first vector storage with cosine similarity search
 * All vectors stored in memory only - no external database required
 */

// ========================
// Type Definitions
// ========================

export interface VectorEntry {
  id: string;
  documentId: string;
  chunkIndex: number;
  vector: number[];
  text: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface VectorStoreStats {
  totalVectors: number;
  dimensions: number | null;
  memoryUsageMB: number;
  documentCount: number;
  indexedDocuments: string[];
}

export interface IndexDocumentResult {
  success: boolean;
  documentId: string;
  vectorsIndexed: number;
  dimensions: number;
  processingTimeMs: number;
  error?: string;
}

// ========================
// In-Memory Vector Store
// ========================

class MemoryVectorStore {
  private vectors: Map<string, VectorEntry> = new Map();
  private documentVectors: Map<string, string[]> = new Map(); // documentId -> vectorIds

  /**
   * Index a document's embeddings
   */
  indexDocument(
    documentId: string,
    embeddings: number[][],
    texts: string[],
    metadata?: Record<string, any>[]
  ): IndexDocumentResult {
    const startTime = Date.now();

    try {
      if (embeddings.length === 0) {
        return {
          success: false,
          documentId,
          vectorsIndexed: 0,
          dimensions: 0,
          processingTimeMs: Date.now() - startTime,
          error: 'No embeddings provided',
        };
      }

      if (embeddings.length !== texts.length) {
        return {
          success: false,
          documentId,
          vectorsIndexed: 0,
          dimensions: 0,
          processingTimeMs: Date.now() - startTime,
          error: 'Embeddings and texts length mismatch',
        };
      }

      const dimensions = embeddings[0]?.length || 0;

      // Remove existing vectors for this document if any
      this.removeDocument(documentId);

      const vectorIds: string[] = [];

      // Index each embedding
      for (let i = 0; i < embeddings.length; i++) {
        const vectorId = `${documentId}_chunk_${i}`;
        const entry: VectorEntry = {
          id: vectorId,
          documentId,
          chunkIndex: i,
          vector: embeddings[i],
          text: texts[i],
          metadata: metadata?.[i],
        };

        this.vectors.set(vectorId, entry);
        vectorIds.push(vectorId);
      }

      // Track which vectors belong to this document
      this.documentVectors.set(documentId, vectorIds);

      const processingTimeMs = Date.now() - startTime;

      console.log(
        `[VectorStore] Indexed document ${documentId}: ${vectorIds.length} vectors (${dimensions}D) in ${processingTimeMs}ms`
      );

      return {
        success: true,
        documentId,
        vectorsIndexed: vectorIds.length,
        dimensions,
        processingTimeMs,
      };
    } catch (error) {
      console.error('[VectorStore] Error indexing document:', error);

      return {
        success: false,
        documentId,
        vectorsIndexed: 0,
        dimensions: 0,
        processingTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  search(queryVector: number[], topK: number = 5, minScore: number = 0.0): SearchResult[] {
    if (this.vectors.size === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    // Calculate similarity for each vector
    for (const [id, entry] of this.vectors.entries()) {
      const score = this.cosineSimilarity(queryVector, entry.vector);

      if (score >= minScore) {
        results.push({
          id: entry.id,
          documentId: entry.documentId,
          chunkIndex: entry.chunkIndex,
          text: entry.text,
          score,
          metadata: entry.metadata,
        });
      }
    }

    // Sort by score (highest first) and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Remove a document's vectors from the store
   */
  removeDocument(documentId: string): boolean {
    const vectorIds = this.documentVectors.get(documentId);

    if (!vectorIds) {
      return false;
    }

    // Remove all vectors for this document
    for (const vectorId of vectorIds) {
      this.vectors.delete(vectorId);
    }

    this.documentVectors.delete(documentId);

    console.log(`[VectorStore] Removed ${vectorIds.length} vectors for document ${documentId}`);

    return true;
  }

  /**
   * Clear all vectors
   */
  clear(): void {
    const count = this.vectors.size;
    this.vectors.clear();
    this.documentVectors.clear();
    console.log(`[VectorStore] Cleared ${count} vectors from memory`);
  }

  /**
   * Get vectors for a specific document
   */
  getDocumentVectors(documentId: string): VectorEntry[] {
    const vectorIds = this.documentVectors.get(documentId);

    if (!vectorIds) {
      return [];
    }

    const vectors: VectorEntry[] = [];

    for (const vectorId of vectorIds) {
      const entry = this.vectors.get(vectorId);
      if (entry) {
        vectors.push(entry);
      }
    }

    return vectors;
  }

  /**
   * Check if a document is indexed
   */
  hasDocument(documentId: string): boolean {
    return this.documentVectors.has(documentId);
  }

  /**
   * Get store statistics
   */
  getStats(): VectorStoreStats {
    const totalVectors = this.vectors.size;
    const documentCount = this.documentVectors.size;

    // Get dimensions from first vector (if any)
    let dimensions: number | null = null;
    const firstVector = this.vectors.values().next().value;
    if (firstVector) {
      dimensions = firstVector.vector.length;
    }

    // Estimate memory usage
    // Each vector entry: vector array + text + metadata
    let memoryBytes = 0;
    for (const entry of this.vectors.values()) {
      // Vector: 8 bytes per float
      memoryBytes += entry.vector.length * 8;
      // Text: roughly 2 bytes per character
      memoryBytes += entry.text.length * 2;
      // Metadata: rough estimate
      if (entry.metadata) {
        memoryBytes += JSON.stringify(entry.metadata).length * 2;
      }
      // Object overhead
      memoryBytes += 200;
    }

    const memoryUsageMB = memoryBytes / (1024 * 1024);

    return {
      totalVectors,
      dimensions,
      memoryUsageMB,
      documentCount,
      indexedDocuments: Array.from(this.documentVectors.keys()),
    };
  }

  /**
   * Get total vector count
   */
  size(): number {
    return this.vectors.size;
  }
}

// ========================
// Singleton Instance
// ========================

const vectorStore = new MemoryVectorStore();

// Auto-cleanup on process exit (for server-side)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    vectorStore.clear();
  });
}

export default vectorStore;
export { MemoryVectorStore };
