/**
 * API Route for LlamaCloud Document Upload and Parsing
 * POST - Upload and parse documents
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pipelineId = formData.get('pipelineId') as string;
    const metadata = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'Pipeline ID is required' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const fileContent = Buffer.from(buffer);

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    // Parse the document
    const parseResult = await provider.parseDocumentFromContent({
      fileContent,
      fileName: file.name,
      mimeType: file.type,
      pipelineId,
      metadata: {
        ...parsedMetadata,
        originalFileName: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
      },
    });

    // If parsing is async, wait for completion
    if (parseResult.status === 'processing') {
      // For now, return the job ID. In production, you might want to poll
      return NextResponse.json({
        success: true,
        jobId: parseResult.id,
        status: 'processing',
        message: 'Document is being processed. Use the job ID to check status.',
      });
    }

    // If parsing completed immediately, try to index it
    if (parseResult.status === 'completed' && parseResult.document) {
      try {
        const indexResult = await provider.indexDocuments({
          pipelineId,
          documents: parseResult.document,
        });

        return NextResponse.json({
          success: true,
          document: parseResult.document,
          indexResult,
          message: 'Document uploaded, parsed, and indexed successfully.',
        });
      } catch (indexError) {
        console.error('Failed to index document:', indexError);
        // Still return parse result even if indexing failed
        return NextResponse.json({
          success: true,
          document: parseResult.document,
          warning: 'Document parsed but indexing failed. Please try indexing manually.',
          error: indexError instanceof Error ? indexError.message : 'Unknown indexing error',
        });
      }
    }

    // If parsing failed
    if (parseResult.status === 'failed') {
      return NextResponse.json(
        {
          error: 'Document parsing failed',
          details: parseResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      parseResult,
    });
  } catch (error) {
    console.error('Failed to upload document to LlamaCloud:', error);

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
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}