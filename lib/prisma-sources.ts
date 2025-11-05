import { prisma } from "./prisma";
import { Source, ContentItem } from "@prisma/client";

export type SourceWithContentItems = Source & {
  contentItems: ContentItem[];
};

export type ContentItemWithSource = ContentItem & {
  source: Source;
};

export async function getSources(): Promise<Source[]> {
  return prisma.source.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getSourceById(id: string): Promise<Source | null> {
  return prisma.source.findUnique({
    where: { id },
  });
}

export async function getSourceWithContentItems(
  id: string
): Promise<SourceWithContentItems | null> {
  return prisma.source.findUnique({
    where: { id },
    include: {
      contentItems: {
        orderBy: { publishedAt: "desc" },
      },
    },
  });
}

export async function createSource(data: {
  name: string;
  type: string;
  url: string;
  description?: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdByUserId?: string;
  isGlobal?: boolean;
}): Promise<Source> {
  // If createdByUserId is provided, verify the user exists
  if (data.createdByUserId) {
    const userExists = await prisma.user.findUnique({
      where: { id: data.createdByUserId },
      select: { id: true },
    });

    if (!userExists) {
      throw new Error(`User with id ${data.createdByUserId} does not exist`);
    }
  }

  return prisma.source.create({
    data: {
      id: generateId(),
      ...data,
    },
  });
}

export async function updateSource(
  id: string,
  data: {
    name?: string;
    type?: string;
    url?: string;
    description?: string;
    avatarUrl?: string;
    isActive?: boolean;
    isGlobal?: boolean;
  }
): Promise<Source> {
  return prisma.source.update({
    where: { id },
    data,
  });
}

export async function deleteSource(id: string): Promise<Source> {
  return prisma.source.delete({
    where: { id },
  });
}

export async function getContentItems(): Promise<ContentItemWithSource[]> {
  return prisma.contentItem.findMany({
    include: {
      source: true,
    },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getContentItemsBySource(
  sourceId: string
): Promise<ContentItem[]> {
  return prisma.contentItem.findMany({
    where: { sourceId },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getContentItemsByType(
  type: string
): Promise<ContentItemWithSource[]> {
  return prisma.contentItem.findMany({
    where: { type },
    include: {
      source: true,
    },
    orderBy: { publishedAt: "desc" },
  });
}

export async function createContentItem(data: {
  sourceId: string;
  type: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  publishedAt?: Date;
}): Promise<ContentItem> {
  return prisma.contentItem.create({
    data: {
      id: generateId(),
      ...data,
    },
  });
}

export async function updateContentItem(
  id: string,
  data: {
    sourceId?: string;
    type?: string;
    title?: string;
    url?: string;
    thumbnailUrl?: string;
    description?: string;
    publishedAt?: Date;
  }
): Promise<ContentItem> {
  return prisma.contentItem.update({
    where: { id },
    data,
  });
}

export async function deleteContentItem(id: string): Promise<ContentItem> {
  return prisma.contentItem.delete({
    where: { id },
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
