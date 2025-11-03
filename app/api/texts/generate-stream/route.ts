import { NextRequest } from 'next/server';
import { openRouterService } from '@/lib/ai/openrouter';
import { chutesService } from '@/lib/ai/chutes';
import { TextGenerationRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params: TextGenerationRequest = {
      messages: body.messages,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      user_id: body.user_id,
      stream: true,
    };

    // Check provider and route to appropriate service
    const isChutesModel = params.model?.startsWith('chutes:');
    let stream;

    if (isChutesModel) {
      // Remove 'chutes:' prefix for API call
      const chutesModelId = params.model.replace('chutes:', '');
      stream = chutesService.streamText({
        ...params,
        model: chutesModelId,
      });
    } else {
      // Use OpenRouter
      stream = openRouterService.streamText(params);
    }

    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          // Send [DONE] to signal end
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
          const errorChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Streaming failed',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
      },
    });
  } catch (error) {
    console.error('Stream initialization error:', error);
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to initialize stream',
      })}\n\ndata: [DONE]\n`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    },
  });
}