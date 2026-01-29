import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getPlaylistById,
  getPlaylistWithItems,
  updatePlaylist,
  deletePlaylist,
} from "@/lib/prisma-sources";
import {
  requireAuthUserId,
  requirePlaylistModification,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from "@/lib/authorization";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/playlists/[id]
 * @description Retrieves a playlist by ID, optionally with its items
 * @access Public
 * @param {NextRequest} request - Query param includeItems=true to include playlist items
 * @param {RouteContext} context - Route context containing playlist id
 * @returns {Promise<NextResponse>} JSON response with playlist data
 * @throws {404} If playlist is not found
 * @throws {500} If database query fails
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const includeItems = searchParams.get("includeItems") === "true";

    const playlist = includeItems
      ? await getPlaylistWithItems(id)
      : await getPlaylistById(id);

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/playlists/[id]
 * @description Updates a playlist's metadata
 * @access Authenticated users with playlist modification rights
 * @param {NextRequest} request - Request body with fields to update
 * @param {RouteContext} context - Route context containing playlist id
 * @returns {Promise<NextResponse>} JSON response with updated playlist
 * @throws {401} If user is not authenticated
 * @throws {403} If user cannot modify the playlist
 * @throws {500} If update fails
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
    console.error("Error updating playlist:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/playlists/[id]
 * @description Deletes a playlist
 * @access Authenticated users with playlist modification rights
 * @param {NextRequest} request - The incoming request
 * @param {RouteContext} context - Route context containing playlist id
 * @returns {Promise<NextResponse>} JSON response with success status
 * @throws {401} If user is not authenticated
 * @throws {403} If user cannot modify the playlist
 * @throws {500} If deletion fails
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await requireAuthUserId();
    const { id } = await context.params;

    await requirePlaylistModification(userId, id);

    await deletePlaylist(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 },
    );
  }
}
