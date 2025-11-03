import { NextRequest, NextResponse } from 'next/server';
import { ollamaCloud } from '@/lib/ai/ollama-cloud';
import { Message } from '@/lib/ai/ollama-cloud/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, stream = false, think = false, tools } = body;

    if (!model || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields: model, messages' },
        { status: 400 }
      );
    }

    // Convert messages format
    const ollamaMessages: Message[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      images: msg.images,
      tool_calls: msg.tool_calls,
    }));

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of ollamaCloud.chat.streamChat({
              model,
              messages: ollamaMessages,
              think,
              tools,
            })) {
              const chunk = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(chunk));

              if (event.type === 'complete' || event.type === 'error') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }
            }
          } catch (error) {
            const errorEvent = {
              type: 'error',
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
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
      const response = await ollamaCloud.chat.createChat({
        model,
        messages: ollamaMessages,
        think,
        tools,
      });

      return NextResponse.json({
        content: response.message.content,
        thinking: response.message.thinking,
        tool_calls: response.message.tool_calls,
        model: response.model,
        usage: {
          prompt_tokens: response.prompt_eval_count,
          completion_tokens: response.eval_count,
          total_tokens: response.prompt_eval_count + response.eval_count,
        },
        finish_reason: response.done ? 'stop' : 'length',
      });
    }
  } catch (error) {
    console.error('Ollama chat error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        type: 'server_error',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}