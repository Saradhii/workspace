import { NextRequest, NextResponse } from 'next/server';
import documentStore from '@/lib/rag/document-store';
import embeddingService from '@/lib/rag/embedders/embedding-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, model = 'all-MiniLM-L6-v2', provider = 'huggingface' } = body;

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

    // Validate model
    const modelInfo = embeddingService.getModelInfo(model);
    if (!modelInfo) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown embedding model: ${model}. Available models: ${embeddingService.getAvailableModels().map(m => m.name).join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log(`[Embeddings] Generating embeddings for document ${document.fileName} (${document.chunks.length} chunks)`);

    // Extract chunk texts
    const chunkTexts = document.chunks.map(chunk => chunk.text);

    // Generate embeddings with progress tracking
    const startTime = Date.now();
    const result = await embeddingService.generateBatchEmbeddings(
      chunkTexts,
      model,
      (progress) => {
        console.log(`[Embeddings] Progress: ${progress.percentage}% - ${progress.message}`);
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to generate embeddings',
        },
        { status: 500 }
      );
    }

    // Update chunks with embeddings
    const updatedChunks = document.chunks.map((chunk, index) => ({
      ...chunk,
      embedding: result.embeddings[index] || undefined,
    }));

    // Update document in store
    documentStore.updateChunks(documentId, updatedChunks);
    documentStore.updateEmbeddings(documentId, result.embeddings, modelInfo.id);

    const processingTimeMs = Date.now() - startTime;

    console.log(
      `[Embeddings] Successfully generated ${result.embeddings.length} embeddings for ${document.fileName} (${modelInfo.name}, ${modelInfo.dimensions}D) in ${(processingTimeMs / 1000).toFixed(2)}s`
    );

    // Return success response
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        embeddingModel: modelInfo.id,
        embeddingCount: result.embeddings.length,
        dimensions: result.dimensions,
        processingTimeMs: result.processingTimeMs,
        totalBatches: result.totalBatches,
      },
      statistics: {
        totalChunks: result.totalChunks,
        totalBatches: result.totalBatches,
        dimensions: result.dimensions,
        averageProcessingTimePerChunk: Math.round(result.processingTimeMs / result.totalChunks),
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    console.error('[Embeddings] Error generating embeddings:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during embedding generation',
      },
      { status: 500 }
    );
  }
}

/**
 * Get available embedding models
 */
export async function GET() {
  try {
    const models = embeddingService.getAvailableModels();

    return NextResponse.json({
      success: true,
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        dimensions: model.dimensions,
        maxTokens: model.maxTokens,
        provider: model.provider,
      })),
    });
  } catch (error) {
    console.error('[Embeddings] Error fetching models:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
