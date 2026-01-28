import { prisma } from "./prisma";
import { UserFollow, Source, Category, SourceCategory } from "@prisma/client";

// List follow rows for a user ordered by newest first
export async function getUserFollows(userId: string): Promise<UserFollow[]> {
  return prisma.userFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch the full source records a user follows via Prisma
export async function getFollowedSources(userId: string): Promise<Source[]> {
  const follows = await prisma.userFollow.findMany({
    where: { userId },
    include: { source: true },
  });

  return follows.map((follow) => follow.source);
}

// Check whether the user already follows the given source
export async function isFollowingSource(
  userId: string,
  sourceId: string,
): Promise<boolean> {
  const follow = await prisma.userFollow.findUnique({
    where: {
      userId_sourceId: {
        userId,
        sourceId,
      },
    },
  });

  return !!follow;
}

// Create a follow relationship if it does not already exist
export async function followSource(
  userId: string,
  sourceId: string,
): Promise<UserFollow> {
  // Check if already following
  const existing = await prisma.userFollow.findUnique({
    where: {
      userId_sourceId: {
        userId,
        sourceId,
      },
    },
  });

  if (existing) {
    return existing; // Return existing follow instead of throwing error
  }

  return prisma.userFollow.create({
    data: {
      userId,
      sourceId,
    },
  });
}

// Remove a follow relationship
export async function unfollowSource(
  userId: string,
  sourceId: string,
): Promise<void> {
  await prisma.userFollow.delete({
    where: {
      userId_sourceId: {
        userId,
        sourceId,
      },
    },
  });
}

export interface SourceWithFollowStatus extends Source {
  isFollowed: boolean;
  followerCount?: number;
  categories?: Category[];
}

// Fetch active sources annotated with follow status and categories for a user
export async function getSourcesWithFollowStatus(
  userId: string,
): Promise<SourceWithFollowStatus[]> {
  const [sources, follows] = await Promise.all([
    prisma.source.findMany({
      where: { isActive: true },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.userFollow.findMany({
      where: { userId },
      select: { sourceId: true },
    }),
  ]);

  const followedSourceIds = new Set(follows.map((f) => f.sourceId));

  return sources.map((source) => ({
    ...source,
    isFollowed: followedSourceIds.has(source.id),
    categories: source.categories.map((sc) => sc.category),
  }));
}

// Count how many users follow a source
export async function getFollowerCount(sourceId: string): Promise<number> {
  return prisma.userFollow.count({
    where: { sourceId },
  });
}
