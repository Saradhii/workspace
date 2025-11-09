/**
 * API Route for LlamaCloud RAG Chat
 * POST - Chat with documents using RAG
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
    const {
      pipelineId,
      query,
      context,
      generation,
      stream = false
    } = body;

    if (!pipelineId || !query) {
      return NextResponse.json(
        { error: 'Pipeline ID and query are required' },
        { status: 400 }
      );
    }

    const provider = createLlamaCloudProvider({
      apiKey: LLAMACLOUD_API_KEY,
    });

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of provider.streamChat({
              messages: [{ role: 'user', content: query }],
              model: generation?.model,
              temperature: generation?.temperature,
              maxTokens: generation?.maxTokens,
              pipelineId,
            })) {
              const data = JSON.stringify(chunk);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const ragResponse = await provider.rag({
        pipelineId,
        query,
        context: {
          maxTokens: context?.maxTokens || 4096,
          retrievalTopK: context?.retrievalTopK || 5,
          includeSources: context?.includeSources !== false,
          ...context,
        },
        generation: {
          model: generation?.model || 'gpt-3.5-turbo',
          temperature: generation?.temperature || 0.1,
          maxTokens: generation?.maxTokens || 1024,
          systemPrompt: generation?.systemPrompt,
          ...generation,
        },
      });

      return NextResponse.json({
        success: true,
        answer: ragResponse.answer,
        sources: ragResponse.sources,
        context: ragResponse.context,
        metadata: ragResponse.metadata,
      });
    }
  } catch (error) {
    console.error('Failed to perform RAG chat with LlamaCloud:', error);

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
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}