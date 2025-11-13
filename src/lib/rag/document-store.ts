/**
 * In-Memory Document Store for RAG
 *
 * Privacy-first: All documents are stored in memory only.
 * No database, no disk storage, no external persistence.
 */

// ========================
// Type Definitions
// ========================

export type ExtractionMethod = 'direct' | 'ocr-deepseek' | 'ocr-ollama' | 'pdf-text' | 'hybrid';

export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
  pageCount?: number;
  timestamp: string;
}

export interface ExtractionInfo {
  method: ExtractionMethod;
  model?: string;
  processingTimeMs: number;
  confidence?: number;
  pagesProcessed?: number;
}

export interface RAGDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  extractionMethod: ExtractionMethod;
  extractionModel: string;
  processingTimeMs: number;
  timestamp: string;
  metadata: DocumentMetadata;
  extractionInfo: ExtractionInfo;
  // Chunking info (will be added later)
  chunks?: DocumentChunk[];
  chunkCount?: number;
  // Embedding info (will be added later)
  embeddings?: number[][];
  embeddingModel?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  index: number;
  startChar: number;
  endChar: number;
  embedding?: number[];
}

export interface DocumentStoreStats {
  totalDocuments: number;
  totalSize: number;
  totalTextLength: number;
  memoryUsageMB: number;
  documents: Array<{
    id: string;
    fileName: string;
    size: number;
    method: ExtractionMethod;
  }>;
}

// ========================
// In-Memory Store
// ========================

class DocumentStore {
  private documents: Map<string, RAGDocument> = new Map();
  private readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB per document

  /**
   * Add a document to the store
   */
  add(document: RAGDocument): void {
    // Check document size
    if (document.fileSize > this.MAX_DOCUMENT_SIZE) {
      throw new Error(`Document size (${(document.fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
    }

    // Check total size
    const currentSize = this.getTotalSize();
    if (currentSize + document.fileSize > this.MAX_TOTAL_SIZE) {
      throw new Error(`Adding this document would exceed total memory limit (50MB). Current: ${(currentSize / 1024 / 1024).toFixed(2)}MB`);
    }

    this.documents.set(document.id, document);
    console.log(`[DocumentStore] Added document: ${document.fileName} (${document.id})`);
  }

  /**
   * Get a document by ID
   */
  get(id: string): RAGDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Get all documents
   */
  getAll(): RAGDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Remove a document by ID
   */
  remove(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      console.log(`[DocumentStore] Removed document: ${id}`);
    }
    return deleted;
  }

  /**
   * Clear all documents
   */
  clear(): void {
    const count = this.documents.size;
    this.documents.clear();
    console.log(`[DocumentStore] Cleared ${count} documents from memory`);
  }

  /**
   * Get total size of all documents
   */
  getTotalSize(): number {
    return Array.from(this.documents.values())
      .reduce((sum, doc) => sum + doc.fileSize, 0);
  }

  /**
   * Get store statistics
   */
  getStats(): DocumentStoreStats {
    const docs = Array.from(this.documents.values());
    const totalSize = this.getTotalSize();
    const totalTextLength = docs.reduce((sum, doc) => sum + doc.extractedText.length, 0);

    // Rough estimate of memory usage (text + metadata overhead)
    const memoryUsageMB = (totalSize + totalTextLength * 2) / 1024 / 1024;

    return {
      totalDocuments: this.documents.size,
      totalSize,
      totalTextLength,
      memoryUsageMB,
      documents: docs.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        size: doc.fileSize,
        method: doc.extractionMethod,
      })),
    };
  }

  /**
   * Check if store has capacity for new document
   */
  hasCapacity(size: number): boolean {
    if (size > this.MAX_DOCUMENT_SIZE) {
      return false;
    }
    return (this.getTotalSize() + size) <= this.MAX_TOTAL_SIZE;
  }

  /**
   * Get remaining capacity in bytes
   */
  getRemainingCapacity(): number {
    return Math.max(0, this.MAX_TOTAL_SIZE - this.getTotalSize());
  }

  /**
   * Update document with chunks
   */
  updateChunks(documentId: string, chunks: DocumentChunk[]): boolean {
    const doc = this.documents.get(documentId);
    if (!doc) {
      return false;
    }

    doc.chunks = chunks;
    doc.chunkCount = chunks.length;
    this.documents.set(documentId, doc);
    return true;
  }

  /**
   * Update document with embeddings
   */
  updateEmbeddings(documentId: string, embeddings: number[][], model: string): boolean {
    const doc = this.documents.get(documentId);
    if (!doc) {
      return false;
    }

    doc.embeddings = embeddings;
    doc.embeddingModel = model;
    this.documents.set(documentId, doc);
    return true;
  }

  /**
   * Search documents by text
   */
  search(query: string): RAGDocument[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc =>
      doc.fileName.toLowerCase().includes(lowerQuery) ||
      doc.extractedText.toLowerCase().includes(lowerQuery)
    );
  }
}

// ========================
// Singleton Instance
// ========================

const documentStore = new DocumentStore();

// Auto-cleanup on process exit (for server-side)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    documentStore.clear();
  });
}

export default documentStore;

// Export for testing
export { DocumentStore };
