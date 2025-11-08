import { NextRequest, NextResponse } from "next/server";
import { ensureUserExists } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

// GET /api/favorites - Get all favorites for the current user
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
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a content item to favorites
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
        { status: 400 }
      );
    }

    // Check if content item exists
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content item not found" },
        { status: 404 }
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
      { status: 500 }
    );
  }
}

// PATCH /api/favorites/:id - Update notes on a favorite
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
        { status: 400 }
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
        { status: 404 }
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
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a content item from favorites
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
        { status: 400 }
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
      { status: 500 }
    );
  }
}
