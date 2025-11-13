import { prisma } from "./prisma";
import { UserFollow, Source, Category, SourceCategory } from "@prisma/client";

export async function getUserFollows(userId: string): Promise<UserFollow[]> {
  return prisma.userFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFollowedSources(userId: string): Promise<Source[]> {
  const follows = await prisma.userFollow.findMany({
    where: { userId },
    include: { source: true },
  });

  return follows.map((follow) => follow.source);
}

export async function isFollowingSource(
  userId: string,
  sourceId: string
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

export async function followSource(
  userId: string,
  sourceId: string
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

export async function unfollowSource(
  userId: string,
  sourceId: string
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

export async function getSourcesWithFollowStatus(
  userId: string
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

export async function getFollowerCount(sourceId: string): Promise<number> {
  return prisma.userFollow.count({
    where: { sourceId },
  });
}
