/**
 * API Route for LlamaCloud Document Management
 * GET - Get document details
 * DELETE - Delete document
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLlamaCloudProvider, LlamaCloudError } from '@/lib/ai/providers/llamacloud-provider';

// Get environment variables
const LLAMACLOUD_API_KEY = process.env.LLAMACLOUD_API_KEY;

interface RouteParams {
  params: Promise<{
    documentId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { documentId } = await params;
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    if (!LLAMACLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'LlamaCloud API key not configured' },
        { status: 500 }
      );
    }

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    const document = await provider.getDocument(pipelineId, documentId);

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Failed to get LlamaCloud document:', error);

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
      { error: 'Failed to get document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { documentId } = await params;
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');

    if (!LLAMACLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'LlamaCloud API key not configured' },
        { status: 500 }
      );
    }

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    await provider.deleteDocument(pipelineId, documentId);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete LlamaCloud document:', error);

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
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}