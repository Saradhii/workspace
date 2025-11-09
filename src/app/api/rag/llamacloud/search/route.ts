/**
 * API Route for LlamaCloud Document Search
 * POST - Search documents in a pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLlamaCloudProvider, LlamaCloudError } from '@/lib/ai/providers/llamacloud-provider';

// Get environment variables
const LLAMACLOUD_API_KEY = process.env.LLAMACLOUD_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!LLAMACLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'LlamaCloud API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { pipelineId, query, topK, filters, includeMetadata, similarityThreshold } = body;

    if (!pipelineId || !query) {
      return NextResponse.json(
        { error: 'Pipeline ID and query are required' },
        { status: 400 }
      );
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    const searchResults = await provider.search({
      pipelineId,
      query,
      topK: topK || 10,
      filters,
      includeMetadata: includeMetadata !== false,
      similarityThreshold: similarityThreshold || 0.7,
    });

    return NextResponse.json({
      success: true,
      results: searchResults.results,
      total: searchResults.total,
      query: searchResults.query,
      pipelineId: searchResults.pipelineId,
    });
  } catch (error) {
    console.error('Failed to search LlamaCloud documents:', error);

    if (error instanceof LlamaCloudError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search documents' },
      { status: 500 }
    );
  }
}