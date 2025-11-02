import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/lib/ai/openrouter';
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
    };

    const result = await openRouterService.generateText(params);

    // Log for analytics (if needed)
    if (process.env.NODE_ENV === 'production' && params.user_id) {
      // Could add analytics logging here
      console.log(`Text generation request for user ${params.user_id} with model ${params.model}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Text generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        error_type: 'server_error',
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