import { NextRequest, NextResponse } from 'next/server';
import vectorStore from '@/lib/rag/vector-store/memory-vector-store';
import embeddingService from '@/lib/rag/embedders/embedding-service';

/**
 * Semantic search endpoint
 * Embeds the query and searches for similar chunks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      topK = 5,
      minScore = 0.0,
      model = 'all-MiniLM-L6-v2',
    } = body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Validate topK
    if (topK < 1 || topK > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'topK must be between 1 and 100',
        },
        { status: 400 }
      );
    }

    // Validate minScore
    if (minScore < 0 || minScore > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'minScore must be between 0 and 1',
        },
        { status: 400 }
      );
    }

    // Check if vector store has any vectors
    const stats = vectorStore.getStats();
    if (stats.totalVectors === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No documents indexed. Please index documents first.',
        },
        { status: 400 }
      );
    }

    console.log(`[Search] Searching for: "${query}" (topK: ${topK}, minScore: ${minScore})`);

    const startTime = Date.now();

    // Generate embedding for the query
    const embeddingResult = await embeddingService.generateEmbeddings({
      texts: [query],
      model,
      provider: 'huggingface',
    });

    const queryEmbedding = embeddingResult.embeddings[0];
    const embeddingTimeMs = Date.now() - startTime;

    console.log(`[Search] Query embedded in ${embeddingTimeMs}ms (${embeddingResult.dimensions}D)`);

    // Search vector store
    const searchStartTime = Date.now();
    const results = vectorStore.search(queryEmbedding, topK, minScore);
    const searchTimeMs = Date.now() - searchStartTime;

    console.log(`[Search] Found ${results.length} results in ${searchTimeMs}ms`);

    const totalTimeMs = Date.now() - startTime;

    // Return results
    return NextResponse.json({
      success: true,
      query,
      results: results.map(result => ({
        id: result.id,
        documentId: result.documentId,
        chunkIndex: result.chunkIndex,
        text: result.text,
        score: result.score,
        metadata: result.metadata,
      })),
      metadata: {
        totalResults: results.length,
        topK,
        minScore,
        model: embeddingResult.model,
        dimensions: embeddingResult.dimensions,
        totalVectors: stats.totalVectors,
      },
      performance: {
        embeddingTimeMs,
        searchTimeMs,
        totalTimeMs,
      },
    });
  } catch (error) {
    console.error('[Search] Error performing search:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during search',
      },
      { status: 500 }
    );
  }
}

/**
 * Get search statistics
 */
export async function GET() {
  try {
    const stats = vectorStore.getStats();

    return NextResponse.json({
      success: true,
      stats: {
        totalVectors: stats.totalVectors,
        dimensions: stats.dimensions,
        documentCount: stats.documentCount,
        ready: stats.totalVectors > 0,
      },
    });
  } catch (error) {
    console.error('[Search] Error fetching search stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
