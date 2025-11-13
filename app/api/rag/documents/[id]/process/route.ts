import { NextRequest, NextResponse } from 'next/server';
import documentStore from '@/lib/rag/document-store';
import {
  chunkText,
  validateChunkingConfig,
  getDefaultChunkingConfig,
  ChunkingConfig,
} from '@/lib/rag/chunkers/text-chunker';

export async function POST(
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

    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Get chunking configuration (use defaults if not provided)
    const config: ChunkingConfig = {
      chunkSize: body.chunkSize || 500,
      chunkOverlap: body.chunkOverlap || 50,
      strategy: body.strategy || 'sentence',
      preserveFormatting: body.preserveFormatting ?? false,
      minChunkSize: body.minChunkSize || 50,
    };

    // Validate configuration
    const validation = validateChunkingConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid chunking configuration',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Perform chunking
    const result = await chunkText(document.extractedText, document.id, config);

    // Update document in store with chunks
    documentStore.updateChunks(document.id, result.chunks);

    console.log(
      `[Processing] Chunked document ${document.fileName}: ${result.totalChunks} chunks (${config.strategy} strategy)`
    );

    // Return result
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        chunkCount: result.totalChunks,
        averageChunkSize: result.averageChunkSize,
        strategy: result.strategy,
        processingTimeMs: result.processingTimeMs,
        statistics: result.statistics,
        config: {
          chunkSize: config.chunkSize,
          chunkOverlap: config.chunkOverlap,
          strategy: config.strategy,
        },
        chunks: result.chunks.slice(0, 5).map(chunk => ({
          id: chunk.id,
          index: chunk.index,
          text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
          length: chunk.text.length,
        })),
      },
    });
  } catch (error) {
    console.error('[Processing] Error chunking document:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during chunking',
      },
      { status: 500 }
    );
  }
}

/**
 * Get chunking status for a document
 */
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

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        hasChunks,
        chunkCount: document.chunkCount || 0,
        chunks: hasChunks
          ? document.chunks!.slice(0, 5).map(chunk => ({
              id: chunk.id,
              index: chunk.index,
              text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
              length: chunk.text.length,
            }))
          : [],
      },
    });
  } catch (error) {
    console.error('[Processing] Error fetching chunking status:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
