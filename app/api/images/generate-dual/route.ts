import { NextRequest, NextResponse } from 'next/server';
import { chutesService } from '@/lib/ai/chutes';
import { ImageGenerationRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params: ImageGenerationRequest = {
      prompt: body.prompt,
      negative_prompt: body.negative_prompt,
      width: body.width,
      height: body.height,
      steps: body.steps,
      cfg: body.cfg,
      seed: body.seed,
      user_id: body.user_id,
      // Model will be set internally (chroma and neta-lumina)
    };

    const result = await chutesService.generateDualImage(params);

    // Log for analytics (if needed)
    if (process.env.NODE_ENV === 'production' && params.user_id) {
      console.log(`Dual image generation request for user ${params.user_id}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dual image generation error:', error);

    return NextResponse.json(
      {
        success: false,
        chroma: undefined,
        neta_lumina: undefined,
        total_generation_time_ms: 0,
        request_id: `error-${Date.now()}`,
        errors: {
          general: error instanceof Error ? error.message : 'Internal server error',
        },
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