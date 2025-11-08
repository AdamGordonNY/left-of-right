"use server";

import { revalidatePath } from "next/cache";
import { ensureUserExists } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";
import type { FavoriteWithContentItem } from "@/lib/database.types";

/**
 * Add a content item to user's favorites
 */
export async function addToFavorites(
  contentItemId: string,
  notes?: string
): Promise<{
  success: boolean;
  favorite?: FavoriteWithContentItem;
  error?: string;
}> {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return { success: false, error: "Unauthorized" };
    }

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

    revalidatePath("/favorites");

    return { success: true, favorite: favorite as any };
  } catch (error: any) {
    console.error("Error adding to favorites:", error);
    return {
      success: false,
      error: error.message || "Failed to add to favorites",
    };
  }
}

/**
 * Remove a content item from user's favorites
 */
export async function removeFromFavorites(
  contentItemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return { success: false, error: "Unauthorized" };
    }

    await (prisma as any).favorite.deleteMany({
      where: {
        userId: dbUserId,
        contentItemId,
      },
    });

    revalidatePath("/favorites");

    return { success: true };
  } catch (error: any) {
    console.error("Error removing from favorites:", error);
    return {
      success: false,
      error: error.message || "Failed to remove from favorites",
    };
  }
}

/**
 * Update notes on a favorited item
 */
export async function updateFavoriteNotes(
  favoriteId: string,
  notes: string
): Promise<{
  success: boolean;
  favorite?: FavoriteWithContentItem;
  error?: string;
}> {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the favorite belongs to the user
    const existing = await (prisma as any).favorite.findFirst({
      where: {
        id: favoriteId,
        userId: dbUserId,
      },
    });

    if (!existing) {
      return { success: false, error: "Favorite not found" };
    }

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

    revalidatePath("/favorites");

    return { success: true, favorite: favorite as any };
  } catch (error: any) {
    console.error("Error updating favorite notes:", error);
    return { success: false, error: error.message || "Failed to update notes" };
  }
}

/**
 * Check if a content item is favorited by the current user
 */
export async function isFavorited(
  contentItemId: string
): Promise<{ isFavorited: boolean; favoriteId?: string }> {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return { isFavorited: false };
    }

    const favorite = await (prisma as any).favorite.findFirst({
      where: {
        userId: dbUserId,
        contentItemId,
      },
      select: { id: true },
    });

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?.id,
    };
  } catch (error: any) {
    console.error("Error checking favorite status:", error);
    return { isFavorited: false };
  }
}

/**
 * Get all favorites for the current user
 */
export async function getUserFavorites(): Promise<{
  success: boolean;
  favorites?: FavoriteWithContentItem[];
  error?: string;
}> {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return { success: false, error: "Unauthorized" };
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

    return { success: true, favorites: favorites as any };
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch favorites",
    };
  }
}
