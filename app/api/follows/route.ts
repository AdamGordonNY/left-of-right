import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { followSource, unfollowSource, getUserFollows } from '@/lib/follows';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const follows = await getUserFollows(userId);

    return NextResponse.json({ follows });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { source_id } = body;

    if (!source_id) {
      return NextResponse.json(
        { error: 'Missing required field: source_id' },
        { status: 400 }
      );
    }

    const follow = await followSource(userId, source_id);

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error: any) {
    console.error('Error following source:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Already following this source' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to follow source' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('source_id');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Missing required parameter: source_id' },
        { status: 400 }
      );
    }

    await unfollowSource(userId, sourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing source:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow source' },
      { status: 500 }
    );
  }
}
