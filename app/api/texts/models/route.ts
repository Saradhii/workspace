import { NextResponse } from 'next/server';
import { openRouterService } from '@/lib/ai/openrouter';

export async function GET() {
  try {
    const result = await openRouterService.getTextModels();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching text models:', error);

    return NextResponse.json(
      {
        success: false,
        models: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}