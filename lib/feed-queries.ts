import { prisma } from "./prisma";
import { Source, ContentItem } from "@prisma/client";

export type SourceWithRecentContent = Source & {
  recentContent: ContentItem[];
  totalContentCount: number;
};

// Return followed sources along with recent content and total counts
export async function getFollowedSourcesWithRecentContent(
  userId: string,
  limit: number = 3,
): Promise<SourceWithRecentContent[]> {
  const follows = await prisma.userFollow.findMany({
    where: { userId },
    include: {
      source: {
        include: {
          contentItems: {
            orderBy: { publishedAt: "desc" },
            take: limit,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return await Promise.all(
    follows.map(async (follow) => {
      const totalCount = await prisma.contentItem.count({
        where: { sourceId: follow.source.id },
      });

      return {
        ...follow.source,
        recentContent: follow.source.contentItems,
        totalContentCount: totalCount,
      };
    }),
  );
}

// Return global sources with recent content and total counts
export async function getGlobalSourcesWithRecentContent(
  limit: number = 3,
): Promise<SourceWithRecentContent[]> {
  const sources = await prisma.source.findMany({
    where: {
      isActive: true,
      isGlobal: true,
    },
    include: {
      contentItems: {
        orderBy: { publishedAt: "desc" },
        take: limit,
      },
    },
    orderBy: { name: "asc" },
  });

  return await Promise.all(
    sources.map(async (source) => {
      const totalCount = await prisma.contentItem.count({
        where: { sourceId: source.id },
      });

      return {
        ...source,
        recentContent: source.contentItems,
        totalContentCount: totalCount,
      };
    }),
  );
}

// Fetch a content item by ID with its source included
export async function getContentItemById(id: string) {
  return prisma.contentItem.findUnique({
    where: { id },
    include: {
      source: true,
    },
  });
}

// Fetch neighboring content items by published date within the same source
export async function getAdjacentContentItems(
  sourceId: string,
  currentItemId: string,
  publishedAt: Date | null,
) {
  if (!publishedAt) {
    return { previous: null, next: null };
  }

  const [previous, next] = await Promise.all([
    prisma.contentItem.findFirst({
      where: {
        sourceId,
        publishedAt: { gt: publishedAt },
      },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.contentItem.findFirst({
      where: {
        sourceId,
        publishedAt: { lt: publishedAt },
      },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return { previous, next };
}
