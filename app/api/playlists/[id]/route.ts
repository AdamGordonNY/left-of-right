import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getPlaylistById,
  getPlaylistWithItems,
  updatePlaylist,
  deletePlaylist,
} from '@/lib/prisma-sources';
import {
  requireAuthUserId,
  requirePlaylistModification,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '@/lib/authorization';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const includeItems = searchParams.get('includeItems') === 'true';

    const playlist = includeItems
      ? await getPlaylistWithItems(id)
      : await getPlaylistById(id);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await requireAuthUserId();
    const { id } = await context.params;

    await requirePlaylistModification(userId, id);

    const body = await request.json();

    const playlist = await updatePlaylist(id, {
      ...body,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error updating playlist:', error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await requireAuthUserId();
    const { id } = await context.params;

    await requirePlaylistModification(userId, id);

    await deletePlaylist(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
