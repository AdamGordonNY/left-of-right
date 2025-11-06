import { NextRequest, NextResponse } from 'next/server';
import { isFollowingSource } from '@/lib/prisma-follows';
import { ensureUserExists } from '@/lib/user-sync';

export async function GET(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();

    if (!dbUserId) {
      return NextResponse.json({ isFollowing: false }, { status: 200 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    const isFollowing = await isFollowingSource(dbUserId, sourceId);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
