import { NextRequest, NextResponse } from 'next/server';
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

    const result = await openRouterService.generateCode(params);

    // Log for analytics (if needed)
    if (process.env.NODE_ENV === 'production' && params.user_id) {
      console.log(`Code generation request for user ${params.user_id} with model ${params.model}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Code generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
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