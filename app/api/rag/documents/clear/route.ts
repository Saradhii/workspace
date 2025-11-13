import { NextRequest, NextResponse } from 'next/server';
import documentStore from '@/lib/rag/document-store';

/**
 * Clear all documents from memory
 */
export async function POST(request: NextRequest) {
  try {
    const stats = documentStore.getStats();
    const count = stats.totalDocuments;

    documentStore.clear();

    return NextResponse.json({
      success: true,
      message: `Cleared ${count} documents from memory`,
      clearedCount: count,
    });
  } catch (error) {
    console.error('[Documents] Error clearing documents:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
