import { NextRequest } from 'next/server';
import { openRouterService } from '@/lib/ai/openrouter';
import { CodeGenerationRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params: CodeGenerationRequest = {
      prompt: body.prompt,
      language: body.language,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      user_id: body.user_id,
    };

    const stream = openRouterService.streamCode(params);
    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        try {
          for await (const chunk of stream) {
            if (isClosed) break;
            try {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (enqueueError) {
              console.error('Failed to enqueue chunk:', enqueueError);
              isClosed = true;
              break;
            }
          }
          // Send [DONE] to signal end
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (e) {
              console.error('Failed to send [DONE]:', e);
            }
          }
        } catch (error) {
          console.error('Code streaming error:', error);
          if (!isClosed) {
            try {
              const errorChunk = {
                type: 'error',
                error: error instanceof Error ? error.message : 'Code streaming failed',
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (e) {
              console.error('Failed to send error:', e);
            }
          }
        } finally {
          if (!isClosed) {
            try {
              controller.close();
            } catch (e) {
              console.error('Failed to close controller:', e);
            }
          }
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
    console.error('Code stream initialization error:', error);
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to initialize code stream',
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