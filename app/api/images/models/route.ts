import { NextResponse } from 'next/server';
import { chutesService } from '@/lib/ai/chutes';

export async function GET() {
  try {
    const models = await chutesService.getImageModels();
    return NextResponse.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (error) {
    console.error('Error fetching image models:', error);

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