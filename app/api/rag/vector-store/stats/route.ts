import { NextResponse } from 'next/server';
import vectorStore from '@/lib/rag/vector-store/memory-vector-store';
import documentStore from '@/lib/rag/document-store';

/**
 * Get vector store statistics
 */
export async function GET() {
  try {
    const stats = vectorStore.getStats();
    const allDocuments = documentStore.getAll();

    // Calculate how many documents are indexed vs total
    const indexedCount = stats.indexedDocuments.length;
    const totalDocuments = allDocuments.filter(doc => doc.embeddings && doc.embeddings.length > 0).length;

    // Calculate storage statistics
    const maxMemoryMB = 50; // 50MB limit (same as document store)
    const usedMemoryMB = stats.memoryUsageMB;
    const remainingMemoryMB = Math.max(0, maxMemoryMB - usedMemoryMB);
    const usagePercentage = Math.min(100, (usedMemoryMB / maxMemoryMB) * 100);

    return NextResponse.json({
      success: true,
      stats: {
        totalVectors: stats.totalVectors,
        dimensions: stats.dimensions,
        documentCount: stats.documentCount,
        indexedDocuments: indexedCount,
        totalDocumentsWithEmbeddings: totalDocuments,
        memoryUsageMB: usedMemoryMB.toFixed(2),
        remainingMemoryMB: remainingMemoryMB.toFixed(2),
        usagePercentage: usagePercentage.toFixed(1),
      },
      vectorStore: {
        type: 'in-memory',
        collection: 'rag-documents',
        status: 'connected',
        endpoint: 'memory',
      },
      quota: {
        total: maxMemoryMB,
        used: usedMemoryMB,
        remaining: remainingMemoryMB,
        percentage: usagePercentage,
      },
    });
  } catch (error) {
    console.error('[VectorStore] Error fetching stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
