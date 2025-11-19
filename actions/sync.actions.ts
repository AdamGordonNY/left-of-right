"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  getChannelIdFromUrl,
  getChannelVideos,
  getChannelInfo,
} from "@/lib/youtube";
import { QuotaExhaustedError } from "@/lib/youtube-client";
import { revalidatePath } from "next/cache";

export async function syncYouTubeSource(sourceId: string) {
  let videosAdded = 0;
  let videosUpdated = 0;

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    // Get source
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error("Source not found");
    }

    if (source.type !== "youtube") {
      throw new Error("Source is not a YouTube channel");
    }

    // Extract channel ID
    const channelId = await getChannelIdFromUrl(source.url);

    if (!channelId) {
      throw new Error("Failed to extract channel ID from URL");
    }

    // Fetch videos (ordered from most recent to oldest)
    const videos = await getChannelVideos(channelId, 50);

    // Store videos - stop when we encounter an existing video
    // This assumes videos are ordered chronologically (newest first)
    for (const video of videos) {
      const existingVideo = await prisma.contentItem.findFirst({
        where: {
          sourceId: source.id,
          url: video.url,
        },
      });

      if (existingVideo) {
        // Video already exists - this means we've synced up to this point
        // Stop processing to save API quota and processing time
        console.log(
          `Found existing video "${video.title}" - stopping sync for ${source.name}`
        );
        break;
      } else {
        // New video - add it to the database
        await prisma.contentItem.create({
          data: {
            sourceId: source.id,
            type: "video",
            title: video.title,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            description: video.description,
            publishedAt: new Date(video.publishedAt),
          },
        });
        videosAdded++;
      }
    }

    // Revalidate relevant paths
    revalidatePath("/my-sources");
    revalidatePath(`/${source.name.toLowerCase().replace(/\s+/g, "-")}`);

    return {
      success: true,
      videosAdded,
      videosUpdated,
    };
  } catch (error) {
    console.error("Error syncing YouTube source:", error);

    if (error instanceof QuotaExhaustedError) {
      return {
        success: false,
        error: "quota_exceeded",
        message: error.message,
        resetAt: error.resetAt.toISOString(),
        videosAdded,
        videosUpdated,
      };
    }

    throw error;
  }
}

export async function syncAllYouTubeSources() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    // Get user's database ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      throw new Error("User not found");
    }

    // Get all YouTube sources the user follows
    const sources = await prisma.source.findMany({
      where: {
        type: "youtube",
        isActive: true,
        followers: {
          some: {
            userId: dbUser.id,
          },
        },
      },
    });

    let totalVideosAdded = 0;
    let totalVideosUpdated = 0;
    let sourcesProcessed = 0;
    const errors: string[] = [];

    let quotaExceeded = false;
    let resetAt: string | null = null;

    for (const source of sources) {
      try {
        const result = await syncYouTubeSource(source.id);

        if (result.success === false && result.error === "quota_exceeded") {
          quotaExceeded = true;
          resetAt = result.resetAt || null;
          break;
        }

        totalVideosAdded += result.videosAdded || 0;
        totalVideosUpdated += result.videosUpdated || 0;
        sourcesProcessed++;
      } catch (error) {
        console.error(`Error syncing ${source.name}:`, error);
        errors.push(source.name);
      }
    }

    return {
      success: !quotaExceeded,
      sourcesProcessed,
      totalVideosAdded,
      totalVideosUpdated,
      errors,
      quotaExceeded,
      resetAt,
    };
  } catch (error) {
    console.error("Error syncing all YouTube sources:", error);
    throw error;
  }
}

export async function updateYouTubeChannelInfo(sourceId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get source
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error("Source not found");
    }

    if (source.type !== "youtube") {
      throw new Error("Source is not a YouTube channel");
    }

    // Extract channel ID
    const channelId = await getChannelIdFromUrl(source.url);

    if (!channelId) {
      throw new Error("Failed to extract channel ID from URL");
    }

    // Fetch channel info
    const channelInfo = await getChannelInfo(channelId);

    if (!channelInfo) {
      throw new Error("Failed to fetch channel information");
    }

    // Update source with latest info
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        name: channelInfo.title,
        description: channelInfo.description,
        avatarUrl: channelInfo.thumbnailUrl,
      },
    });

    revalidatePath("/my-sources");

    return {
      success: true,
      channelInfo,
    };
  } catch (error) {
    console.error("Error updating channel info:", error);
    throw error;
  }
}
