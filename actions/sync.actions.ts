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
  const startedAt = new Date();
  const failedVideos: Array<{ title: string; url: string; error: string }> = [];
  const logEntries: string[] = []; // Collect detailed log entries
  let logId: string | null = null;

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user's database ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      throw new Error("User not found");
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

    // Create initial sync log
    const syncLog = await prisma.syncLog.create({
      data: {
        userId: dbUser.id,
        sourceId: source.id,
        sourceName: source.name,
        syncType: "single_source",
        status: "success",
        startedAt,
      },
    });
    logId = syncLog.id;

    // Extract channel ID
    const channelId = await getChannelIdFromUrl(source.url);

    if (!channelId) {
      throw new Error("Failed to extract channel ID from URL");
    }

    // Fetch videos (ordered from most recent to oldest)
    const videos = await getChannelVideos(channelId, 50);

    // Store videos - stop when we encounter an existing video
    // This assumes videos are ordered chronologically (newest first)
    logEntries.push(
      `[${new Date().toISOString()}] Starting video sync for ${source.name}`,
    );
    logEntries.push(
      `[${new Date().toISOString()}] Total videos from API: ${videos.length}`,
    );
    console.log(
      `[SYNC] Starting video sync for ${source.name} - ${videos.length} videos from API`,
    );

    for (const video of videos) {
      const timestamp = new Date().toISOString();
      const videoLogPrefix = `[${timestamp}] Video: "${video.title.substring(0, 60)}${video.title.length > 60 ? "..." : ""}" (${video.url})`;

      try {
        console.log(
          `[SYNC] Attempting to sync video: "${video.title}" - ${video.url}`,
        );
        logEntries.push(`${videoLogPrefix} - ATTEMPT`);

        const existingVideo = await prisma.contentItem.findFirst({
          where: {
            sourceId: source.id,
            url: video.url,
          },
        });

        if (existingVideo) {
          // Video already exists - this means we've synced up to this point
          // Stop processing to save API quota and processing time
          const stopMsg = `Found existing video "${video.title}" - stopping sync for ${source.name}`;
          console.log(`[SYNC] ${stopMsg}`);
          logEntries.push(`${videoLogPrefix} - ALREADY EXISTS (stopping sync)`);
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
          console.log(`[SYNC] ✓ Added new video: "${video.title}"`);
          logEntries.push(`${videoLogPrefix} - ADDED`);
        }
      } catch (videoError) {
        const errorMsg =
          videoError instanceof Error ? videoError.message : "Unknown error";
        console.error(
          `[SYNC] ✗ Failed to sync video: "${video.title}" - Error: ${errorMsg}`,
        );
        logEntries.push(`${videoLogPrefix} - FAILED: ${errorMsg}`);
        // Log individual video failures
        failedVideos.push({
          title: video.title,
          url: video.url,
          error: errorMsg,
        });
      }
    }

    logEntries.push(
      `[${new Date().toISOString()}] Sync completed: ${videosAdded} added, ${failedVideos.length} failed`,
    );

    const completedAt = new Date();

    // Update sync log with results
    await prisma.syncLog.update({
      where: { id: logId },
      data: {
        status: failedVideos.length > 0 ? "partial" : "success",
        videosAdded,
        videosFailed: failedVideos.length,
        totalProcessed: videosAdded + failedVideos.length,
        failedVideos: failedVideos.length > 0 ? failedVideos : undefined,
        logText: logEntries.join("\n"),
        completedAt,
        metadata: {
          videosInResponse: videos.length,
          stoppedEarly: videosAdded + failedVideos.length < videos.length,
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath("/my-sources");
    revalidatePath(`/${source.name.toLowerCase().replace(/\s+/g, "-")}`);

    return {
      success: true,
      videosAdded,
      videosUpdated,
      failedVideos: failedVideos.length > 0 ? failedVideos : undefined,
    };
  } catch (error) {
    console.error("Error syncing YouTube source:", error);

    // Update sync log with error
    logEntries.push(
      `[${new Date().toISOString()}] Sync FAILED: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    if (logId) {
      await prisma.syncLog.update({
        where: { id: logId },
        data: {
          status: "failed",
          videosAdded,
          videosFailed: failedVideos.length,
          totalProcessed: videosAdded + failedVideos.length,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          failedVideos: failedVideos.length > 0 ? failedVideos : undefined,
          logText: logEntries.join("\n"),
          completedAt: new Date(),
        },
      });
    }

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
  const startedAt = new Date();
  const failedSources: Array<{ sourceName: string; error: string }> = [];
  let logId: string | null = null;

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

    // Create bulk sync log
    const syncLog = await prisma.syncLog.create({
      data: {
        userId: dbUser.id,
        syncType: "bulk_sync",
        status: "success",
        startedAt,
        metadata: {
          totalSources: sources.length,
          sourceNames: sources.map((s) => s.name),
        },
      },
    });
    logId = syncLog.id;

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
        failedSources.push({
          sourceName: source.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const completedAt = new Date();

    // Update bulk sync log with results
    await prisma.syncLog.update({
      where: { id: logId },
      data: {
        status: quotaExceeded
          ? "failed"
          : failedSources.length > 0
            ? "partial"
            : "success",
        videosAdded: totalVideosAdded,
        videosFailed: 0,
        totalProcessed: sourcesProcessed,
        errorMessage: quotaExceeded
          ? "Quota exceeded during bulk sync"
          : undefined,
        failedVideos: failedSources.length > 0 ? failedSources : undefined,
        completedAt,
        metadata: {
          totalSources: sources.length,
          sourcesProcessed,
          sourceNames: sources.map((s) => s.name),
          quotaExceeded,
          resetAt,
        },
      },
    });

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

    // Update sync log with error
    if (logId) {
      await prisma.syncLog.update({
        where: { id: logId },
        data: {
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          failedVideos: failedSources.length > 0 ? failedSources : undefined,
          completedAt: new Date(),
        },
      });
    }

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
