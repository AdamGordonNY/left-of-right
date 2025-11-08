import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getPlaylistsBySource,
  createPlaylist,
} from '@/lib/prisma-sources';
import {
  requireAuthUserId,
  requireSourceModification,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/authorization';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'sourceId is required' },
        { status: 400 }
      );
    }

    const playlists = await getPlaylistsBySource(sourceId);
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthUserId();

    const body = await request.json();
    const { sourceId, title, playlistUrl, description, thumbnailUrl, videoCount, publishedAt } = body;

    if (!sourceId || !title || !playlistUrl) {
      return NextResponse.json(
        { error: 'sourceId, title, and playlistUrl are required' },
        { status: 400 }
      );
    }

    await requireSourceModification(userId, sourceId);

    const playlist = await createPlaylist({
      sourceId,
      title,
      playlistUrl,
      description,
      thumbnailUrl,
      videoCount,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
