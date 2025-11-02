import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/types/api';
import { cookies } from 'next/headers';

// Simple in-memory session storage (for production, use a proper database)
const sessions = new Map<string, { created_at: Date; last_accessed: Date }>();

function generateUserId(): string {
  // Generate a simple user ID with timestamp and random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `user-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const existingUserId = body.existing_user_id;

    let userId: string;
    let isNew = false;

    if (existingUserId) {
      // Check if the existing user ID is valid
      if (sessions.has(existingUserId)) {
        userId = existingUserId;
        // Update last accessed time
        sessions.set(userId, {
          ...sessions.get(userId)!,
          last_accessed: new Date(),
        });
      } else {
        // Create new session if existing ID is not found
        userId = generateUserId();
        isNew = true;
        sessions.set(userId, {
          created_at: new Date(),
          last_accessed: new Date(),
        });
      }
    } else {
      // Create new user session
      userId = generateUserId();
      isNew = true;
      sessions.set(userId, {
        created_at: new Date(),
        last_accessed: new Date(),
      });
    }

    // Set the user ID in a cookie
    const cookieStore = await cookies();
    cookieStore.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    const session: UserSession = {
      user_id: userId,
      is_new: isNew,
      ...(sessions.get(userId)?.created_at && { created_at: sessions.get(userId)!.created_at.toISOString() }),
    };

    // Clean up old sessions (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    for (const [id, session] of sessions.entries()) {
      if (session.last_accessed < thirtyDaysAgo) {
        sessions.delete(id);
      }
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session creation error:', error);

    // Fallback: create a session without storing
    const fallbackUserId = generateUserId();
    const session: UserSession = {
      user_id: fallbackUserId,
      is_new: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(session, {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 404 }
      );
    }

    // Check if session exists
    if (sessions.has(userId)) {
      const session = sessions.get(userId)!;
      sessions.set(userId, {
        ...session,
        last_accessed: new Date(),
      });

      return NextResponse.json({
        user_id: userId,
        is_new: false,
        ...(session.created_at && { created_at: session.created_at.toISOString() }),
      });
    } else {
      // Session not found in memory, but cookie exists
      return NextResponse.json({
        user_id: userId,
        is_new: false,
        created_at: null,
      });
    }
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (userId && sessions.has(userId)) {
      sessions.delete(userId);
    }

    // Clear the cookie
    cookieStore.set('user_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}