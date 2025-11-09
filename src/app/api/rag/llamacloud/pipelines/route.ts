/**
 * API Route for LlamaCloud Pipeline Management
 * POST - Create pipeline
 * GET - List all pipelines
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
    const { name, description, embeddingModel, chunkSize, chunkOverlap, transformations } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Pipeline name is required' },
        { status: 400 }
      );
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    const pipeline = await provider.createPipeline({
      name,
      description,
      embeddingModel: embeddingModel || 'text-embedding-ada-002',
      chunkSize: chunkSize || 1024,
      chunkOverlap: chunkOverlap || 20,
      transformations: transformations || ['sentence_splitter'],
    });

    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error('Failed to create LlamaCloud pipeline:', error);

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
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!LLAMACLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'LlamaCloud API key not configured' },
        { status: 500 }
      );
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    const pipelines = await provider.listPipelines();

    return NextResponse.json({ success: true, pipelines });
  } catch (error) {
    console.error('Failed to list LlamaCloud pipelines:', error);

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
      { error: 'Failed to list pipelines' },
      { status: 500 }
    );
  }
}