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
      model: body.model,
      user_id: body.user_id,
    };

    const result = await chutesService.generateImage(params);

    // Log for analytics (if needed)
    if (process.env.NODE_ENV === 'production' && params.user_id) {
      console.log(`Image generation request for user ${params.user_id} with model ${params.model}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image generation error:', error);

    // Extract error message safely
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Handle cases where error might be an object
      errorMessage = JSON.stringify(error);
      // If it's too long or just looks like [object Object], provide a generic message
      if (errorMessage === '{}' || errorMessage === '[object Object]') {
        errorMessage = 'An unknown error occurred during image generation';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        error_type: 'server_error',
        image_id: `error-${Date.now()}`,
        format: 'jpeg',
        width: 1024,
        height: 1024,
        generation_time_ms: 0,
        parameters: {},
        model_used: 'chroma',
        seed_used: 0,
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