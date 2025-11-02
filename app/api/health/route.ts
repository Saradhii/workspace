import { NextResponse } from 'next/server';
import { HealthResponse } from '@/types/api';

export async function GET() {
  try {
    // Check environment variables
    const openRouterKey = !!process.env.OPENROUTER_API_KEY;
    const chutesKey = !!process.env.CHUTES_API_KEY;

    const health: HealthResponse = {
      status: 'healthy',
      message: 'Server is running',
      version: '1.0.0',
      components: {
        database: 'healthy', // Not using database in this migration
        ai_services: {
          openrouter: openRouterKey ? 'healthy' : 'disabled',
          chutes: chutesKey ? 'healthy' : 'disabled',
        },
        storage: 'healthy',
      },
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        version: '1.0.0',
        components: {
          database: 'unhealthy',
          ai_services: {
            openrouter: 'error',
            chutes: 'error',
          },
          storage: 'error',
        },
      },
      { status: 500 }
    );
  }
}