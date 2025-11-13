import { NextRequest, NextResponse } from 'next/server';
import documentStore from '@/lib/rag/document-store';
import vectorStore from '@/lib/rag/vector-store/memory-vector-store';

/**
 * Index a document's embeddings into the vector store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    // Validate request
    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'documentId is required',
        },
        { status: 400 }
      );
    }

    // Get document from store
    const document = documentStore.get(documentId);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: `Document not found: ${documentId}`,
        },
        { status: 404 }
      );
    }

    // Check if document has embeddings
    if (!document.embeddings || document.embeddings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document has no embeddings. Please generate embeddings first.',
        },
        { status: 400 }
      );
    }

    // Check if document has chunks
    if (!document.chunks || document.chunks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document has no chunks. Please process the document first.',
        },
        { status: 400 }
      );
    }

    // Verify embeddings and chunks match
    if (document.embeddings.length !== document.chunks.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Embeddings count (${document.embeddings.length}) does not match chunks count (${document.chunks.length})`,
        },
        { status: 400 }
      );
    }

    console.log(`[VectorStore] Indexing document ${document.fileName} (${document.embeddings.length} vectors)`);

    // Extract chunk texts and metadata
    const texts = document.chunks.map(chunk => chunk.text);
    const metadata = document.chunks.map(chunk => ({
      documentId: document.id,
      fileName: document.fileName,
      chunkIndex: chunk.index,
      startChar: chunk.startChar,
      endChar: chunk.endChar,
    }));

    // Index document in vector store
    const result = vectorStore.indexDocument(
      documentId,
      document.embeddings,
      texts,
      metadata
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to index document',
        },
        { status: 500 }
      );
    }

    console.log(
      `[VectorStore] Successfully indexed ${result.vectorsIndexed} vectors for ${document.fileName} (${result.dimensions}D)`
    );

    // Return success response
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        vectorsIndexed: result.vectorsIndexed,
        dimensions: result.dimensions,
        processingTimeMs: result.processingTimeMs,
      },
      vectorStore: {
        type: 'in-memory',
        collection: 'rag-documents',
        totalVectors: vectorStore.size(),
      },
    });
  } catch (error) {
    console.error('[VectorStore] Error indexing document:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during indexing',
      },
      { status: 500 }
    );
  }
}

/**
 * Get indexed documents
 */
export async function GET() {
  try {
    const stats = vectorStore.getStats();

    const indexedDocuments = stats.indexedDocuments.map(docId => {
      const doc = documentStore.get(docId);
      const vectors = vectorStore.getDocumentVectors(docId);

      return {
        id: docId,
        fileName: doc?.fileName || 'Unknown',
        vectorCount: vectors.length,
        indexed: true,
      };
    });

    return NextResponse.json({
      success: true,
      documents: indexedDocuments,
      stats: {
        totalVectors: stats.totalVectors,
        dimensions: stats.dimensions,
        documentCount: stats.documentCount,
        memoryUsageMB: stats.memoryUsageMB.toFixed(2),
      },
      vectorStore: {
        type: 'in-memory',
        collection: 'rag-documents',
        status: 'connected',
      },
    });
  } catch (error) {
    console.error('[VectorStore] Error fetching indexed documents:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Clear all indexed vectors
 */
export async function DELETE() {
  try {
    vectorStore.clear();

    return NextResponse.json({
      success: true,
      message: 'All vectors cleared from memory',
    });
  } catch (error) {
    console.error('[VectorStore] Error clearing vectors:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
