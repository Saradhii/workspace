import { NextRequest, NextResponse } from 'next/server';
import documentStore from '@/lib/rag/document-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get document from store
    const document = documentStore.get(id);

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: `Document not found: ${id}`,
        },
        { status: 404 }
      );
    }

    const hasChunks = !!document.chunks && document.chunks.length > 0;
    const hasEmbeddings = !!document.embeddings && document.embeddings.length > 0;

    // Calculate embedding stats
    let embeddingStats = null;
    if (hasEmbeddings && document.embeddings) {
      const dimensions = document.embeddings[0]?.length || 0;
      embeddingStats = {
        dimensions,
        embeddingCount: document.embeddings.length,
        model: document.embeddingModel || 'unknown',
      };
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        hasChunks,
        chunkCount: document.chunkCount || 0,
        hasEmbeddings,
        embeddingModel: document.embeddingModel,
        ...embeddingStats,
      },
      status: {
        chunked: hasChunks,
        embedded: hasEmbeddings,
        ready: hasChunks && hasEmbeddings,
      },
    });
  } catch (error) {
    console.error('[Embeddings] Error fetching embedding status:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
