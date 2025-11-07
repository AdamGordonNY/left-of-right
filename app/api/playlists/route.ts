import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getPlaylistsBySource,
  createPlaylist,
} from '@/lib/prisma-sources';

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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, title, playlistUrl, description, thumbnailUrl, videoCount, publishedAt } = body;

    if (!sourceId || !title || !playlistUrl) {
      return NextResponse.json(
        { error: 'sourceId, title, and playlistUrl are required' },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
