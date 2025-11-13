import { NextRequest, NextResponse } from 'next/server';
import documentStore from '@/lib/rag/document-store';

/**
 * Get a specific document by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        extractedText: document.extractedText,
        extractionMethod: document.extractionMethod,
        extractionModel: document.extractionModel,
        processingTimeMs: document.processingTimeMs,
        timestamp: document.timestamp,
        textLength: document.extractedText.length,
        chunkCount: document.chunkCount,
        hasEmbeddings: !!document.embeddings,
        embeddingModel: document.embeddingModel,
      },
    });
  } catch (error) {
    console.error('[Documents] Error fetching document:', error);

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
 * Delete a specific document by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = documentStore.remove(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: `Document not found: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document ${id} deleted from memory`,
    });
  } catch (error) {
    console.error('[Documents] Error deleting document:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
