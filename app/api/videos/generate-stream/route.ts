import { NextRequest } from 'next/server';
import { chutesService } from '@/lib/ai/chutes';
import { VideoGenerationRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params: VideoGenerationRequest = {
      image: body.image,
      prompt: body.prompt,
      negative_prompt: body.negative_prompt,
      frames: body.frames,
      fps: body.fps,
      guidance_scale: body.guidance_scale,
      guidance_scale_2: body.guidance_scale_2,
      resolution: body.resolution,
      fast: body.fast,
      seed: body.seed,
      user_id: body.user_id,
    };

    const stream = chutesService.streamVideoGeneration(params);
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
          console.error('Video streaming error:', error);
          const errorChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Video streaming failed',
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
    console.error('Video stream initialization error:', error);
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to initialize video stream',
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