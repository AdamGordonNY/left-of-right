import { prisma } from "./prisma";
import { Source, ContentItem, Playlist, PlaylistItem } from "@prisma/client";

export type SourceWithContentItems = Source & {
  contentItems: ContentItem[];
};

export type ContentItemWithSource = ContentItem & {
  source: Source;
};

export type PlaylistWithSource = Playlist & {
  source: Source;
};

export type PlaylistWithItems = Playlist & {
  playlistItems: (PlaylistItem & {
    contentItem: ContentItem;
  })[];
};

// Fetch active sources the user can access (own or global)
export async function getSources(userId?: string): Promise<Source[]> {
  const where = userId
    ? {
        isActive: true,
        OR: [{ createdByUserId: userId }, { isGlobal: true }],
      }
    : { isActive: true, isGlobal: true };

  return prisma.source.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

// Look up a source by ID
export async function getSourceById(id: string): Promise<Source | null> {
  return prisma.source.findUnique({
    where: { id },
  });
}

// Fetch a source with all associated content items
export async function getSourceWithContentItems(
  id: string,
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

// Create a source, validating the creator exists when provided
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

// Update mutable fields on a source
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
  },
): Promise<Source> {
  return prisma.source.update({
    where: { id },
    data,
  });
}

// Delete a source by ID
export async function deleteSource(id: string): Promise<Source> {
  return prisma.source.delete({
    where: { id },
  });
}

// Fetch content items with their source, filtered to accessible sources
export async function getContentItems(
  userId?: string,
): Promise<ContentItemWithSource[]> {
  const where = userId
    ? {
        source: {
          OR: [{ createdByUserId: userId }, { isGlobal: true }],
        },
      }
    : {
        source: {
          isGlobal: true,
        },
      };

  return prisma.contentItem.findMany({
    where,
    include: {
      source: true,
    },
    orderBy: { publishedAt: "desc" },
  });
}

// Fetch content items for a specific source
export async function getContentItemsBySource(
  sourceId: string,
): Promise<ContentItem[]> {
  return prisma.contentItem.findMany({
    where: { sourceId },
    orderBy: { publishedAt: "desc" },
  });
}

// Fetch content items of a given type filtered to accessible sources
export async function getContentItemsByType(
  type: string,
  userId?: string,
): Promise<ContentItemWithSource[]> {
  const where = userId
    ? {
        type,
        source: {
          OR: [{ createdByUserId: userId }, { isGlobal: true }],
        },
      }
    : {
        type,
        source: {
          isGlobal: true,
        },
      };

  return prisma.contentItem.findMany({
    where,
    include: {
      source: true,
    },
    orderBy: { publishedAt: "desc" },
  });
}

// Create a new content item under a source
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

// Update fields on a content item
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
  },
): Promise<ContentItem> {
  return prisma.contentItem.update({
    where: { id },
    data,
  });
}

// Delete a content item by ID
export async function deleteContentItem(id: string): Promise<ContentItem> {
  return prisma.contentItem.delete({
    where: { id },
  });
}

// Fetch playlists for a source ordered by publish date
export async function getPlaylistsBySource(
  sourceId: string,
): Promise<Playlist[]> {
  return prisma.playlist.findMany({
    where: { sourceId },
    orderBy: { publishedAt: "desc" },
  });
}

// Look up a playlist by ID
export async function getPlaylistById(id: string): Promise<Playlist | null> {
  return prisma.playlist.findUnique({
    where: { id },
  });
}

// Fetch a playlist with ordered playlist items and their content items
export async function getPlaylistWithItems(
  id: string,
): Promise<PlaylistWithItems | null> {
  return prisma.playlist.findUnique({
    where: { id },
    include: {
      playlistItems: {
        include: {
          contentItem: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

// Count playlists belonging to a source
export async function getPlaylistCount(sourceId: string): Promise<number> {
  return prisma.playlist.count({
    where: { sourceId },
  });
}

// Create a playlist under a source
export async function createPlaylist(data: {
  sourceId: string;
  title: string;
  playlistUrl: string;
  description?: string;
  thumbnailUrl?: string;
  videoCount?: number;
  publishedAt?: Date;
}): Promise<Playlist> {
  return prisma.playlist.create({
    data: {
      id: generateId(),
      ...data,
    },
  });
}

// Update playlist metadata
export async function updatePlaylist(
  id: string,
  data: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    playlistUrl?: string;
    videoCount?: number;
    publishedAt?: Date;
  },
): Promise<Playlist> {
  return prisma.playlist.update({
    where: { id },
    data,
  });
}

// Delete a playlist by ID
export async function deletePlaylist(id: string): Promise<Playlist> {
  return prisma.playlist.delete({
    where: { id },
  });
}

// Create a playlist item mapping a content item into a playlist position
export async function createPlaylistItem(data: {
  playlistId: string;
  contentItemId: string;
  position: number;
}): Promise<PlaylistItem> {
  return prisma.playlistItem.create({
    data: {
      id: generateId(),
      ...data,
    },
  });
}

// Delete a playlist item by ID
export async function deletePlaylistItem(id: string): Promise<PlaylistItem> {
  return prisma.playlistItem.delete({
    where: { id },
  });
}

// Lightweight ID generator for new records
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
