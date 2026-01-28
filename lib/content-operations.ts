import { ContentItem } from "@prisma/client";
import {
  createContentItem as prismaCreateContentItem,
  updateContentItem as prismaUpdateContentItem,
  deleteContentItem as prismaDeleteContentItem,
} from "./prisma-sources";
import {
  requireSourceModification,
  requireContentItemModification,
} from "./authorization";

// Create a content item after verifying the user can modify the source
export async function createContentItemWithAuth(
  userId: string,
  data: {
    sourceId: string;
    type: string;
    title: string;
    url: string;
    thumbnailUrl?: string;
    description?: string;
    publishedAt?: Date;
  },
): Promise<ContentItem> {
  await requireSourceModification(userId, data.sourceId);
  return prismaCreateContentItem(data);
}

// Update a content item after verifying access to the item and optionally its new source
export async function updateContentItemWithAuth(
  userId: string,
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
  await requireContentItemModification(userId, id);

  if (data.sourceId) {
    await requireSourceModification(userId, data.sourceId);
  }

  return prismaUpdateContentItem(id, data);
}

// Delete a content item after verifying the user can modify it
export async function deleteContentItemWithAuth(
  userId: string,
  id: string,
): Promise<ContentItem> {
  await requireContentItemModification(userId, id);
  return prismaDeleteContentItem(id);
}
