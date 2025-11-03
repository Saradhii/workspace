import { NextRequest, NextResponse } from 'next/server';
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

    const result = await chutesService.generateVideo(params);

    // Log for analytics (if needed)
    if (process.env.NODE_ENV === 'production' && params.user_id) {
      console.log(`Video generation request for user ${params.user_id}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Video generation error:', error);

    // Extract error message safely
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Handle cases where error might be an object
      errorMessage = JSON.stringify(error);
      // If it's too long or just looks like [object Object], provide a generic message
      if (errorMessage === '{}' || errorMessage === '[object Object]') {
        errorMessage = 'An unknown error occurred during video generation';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        error_type: 'server_error',
        video_id: `error-${Date.now()}`,
        format: 'mp4',
        width: 480,
        height: 480,
        frames: 21,
        fps: 16,
        duration: 1.31,
        generation_time_ms: 0,
        parameters: {},
        model_used: 'wan-2-2-i2v-14b-fast',
        seed_used: -1,
        created_at: new Date().toISOString(),
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