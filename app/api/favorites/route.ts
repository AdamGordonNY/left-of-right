import { NextRequest, NextResponse } from "next/server";
import { ensureUserExists } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/favorites
 * @description Retrieves all favorited content items for the authenticated user
 * @access Authenticated users
 * @returns {Promise<NextResponse>} JSON response with favorites array including content items and sources
 * @throws {401} If user is not authenticated
 * @throws {500} If database query fails
 */
export async function GET(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await (prisma as any).favorite.findMany({
      where: {
        userId: dbUserId,
      },
      include: {
        contentItem: {
          include: {
            source: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ favorites });
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/favorites
 * @description Adds a content item to user's favorites (upserts if already exists)
 * @access Authenticated users
 * @param {NextRequest} request - Request body containing contentItemId and optional notes
 * @returns {Promise<NextResponse>} JSON response with created/updated favorite or error
 * @throws {401} If user is not authenticated
 * @throws {400} If contentItemId is missing
 * @throws {404} If content item is not found
 * @throws {500} If operation fails
 */
export async function POST(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentItemId, notes } = body;

    if (!contentItemId) {
      return NextResponse.json(
        { error: "contentItemId is required" },
        { status: 400 },
      );
    }

    // Check if content item exists
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 },
      );
    }

    // Create or update favorite
    const favorite = await (prisma as any).favorite.upsert({
      where: {
        userId_contentItemId: {
          userId: dbUserId,
          contentItemId,
        },
      },
      update: {
        notes: notes || null,
      },
      create: {
        userId: dbUserId,
        contentItemId,
        notes: notes || null,
      },
      include: {
        contentItem: {
          include: {
            source: true,
          },
        },
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding to favorites:", error);
    return NextResponse.json(
      { error: "Failed to add to favorites" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/favorites
 * @description Updates notes on an existing favorite
 * @access Authenticated users (owner only)
 * @param {NextRequest} request - Request body containing favoriteId and notes
 * @returns {Promise<NextResponse>} JSON response with updated favorite or error
 * @throws {401} If user is not authenticated
 * @throws {400} If favoriteId is missing
 * @throws {404} If favorite is not found or doesn't belong to user
 * @throws {500} If update fails
 */
export async function PATCH(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { favoriteId, notes } = body;

    if (!favoriteId) {
      return NextResponse.json(
        { error: "favoriteId is required" },
        { status: 400 },
      );
    }

    // Verify the favorite belongs to the user
    const existing = await (prisma as any).favorite.findFirst({
      where: {
        id: favoriteId,
        userId: dbUserId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 },
      );
    }

    // Update notes
    const favorite = await (prisma as any).favorite.update({
      where: { id: favoriteId },
      data: { notes: notes || null },
      include: {
        contentItem: {
          include: {
            source: true,
          },
        },
      },
    });

    return NextResponse.json({ favorite });
  } catch (error: any) {
    console.error("Error updating favorite:", error);
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/favorites
 * @description Removes a content item from user's favorites
 * @access Authenticated users
 * @param {NextRequest} request - Query param contentItemId required
 * @returns {Promise<NextResponse>} JSON response with success status or error
 * @throws {401} If user is not authenticated
 * @throws {400} If contentItemId query param is missing
 * @throws {500} If deletion fails
 */
export async function DELETE(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentItemId = searchParams.get("contentItemId");

    if (!contentItemId) {
      return NextResponse.json(
        { error: "contentItemId is required" },
        { status: 400 },
      );
    }

    // Delete the favorite
    await (prisma as any).favorite.deleteMany({
      where: {
        userId: dbUserId,
        contentItemId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing from favorites:", error);
    return NextResponse.json(
      { error: "Failed to remove from favorites" },
      { status: 500 },
    );
  }
}
