"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getPlaylistVideos } from "@/lib/youtube";
import { QuotaExhaustedError } from "@/lib/youtube-client";
import { revalidatePath } from "next/cache";

export async function savePublicPlaylist(
  playlistUrl: string,
  sourceId: string
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Extract playlist ID from URL
    const playlistId = extractPlaylistId(playlistUrl);

    if (!playlistId) {
      throw new Error("Invalid YouTube playlist URL");
    }

    // Check if source exists and belongs to user or is global
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: {
        followers: {
          where: {
            userId:
              (
                await prisma.user.findUnique({ where: { clerkId: userId } })
              )?.id || "",
          },
        },
      },
    });

    if (!source) {
      throw new Error("Source not found");
    }

    // Check if playlist already exists for this source
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        sourceId: source.id,
        playlistUrl,
      },
    });

    if (existingPlaylist) {
      return {
        success: true,
        message: "Playlist already exists",
        playlistId: existingPlaylist.id,
        videosAdded: 0,
      };
    }

    // Fetch playlist videos from YouTube
    const videos = await getPlaylistVideos(playlistId, 50, userId);

    if (videos.length === 0) {
      throw new Error("No videos found in playlist or invalid playlist ID");
    }

    // Get playlist info from first video (we'll use the first video's data)
    const firstVideo = videos[0];

    // Create the playlist
    const playlist = await prisma.playlist.create({
      data: {
        sourceId: source.id,
        title: `Playlist ${playlistId}`, // Will be updated with actual title if available
        description: "",
        thumbnailUrl: firstVideo.thumbnailUrl || "",
        playlistUrl,
        videoCount: videos.length,
        publishedAt: new Date(firstVideo.publishedAt),
      },
    });

    // Save videos and link them to playlist
    let videosAdded = 0;
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      // Check if video already exists
      let contentItem = await prisma.contentItem.findFirst({
        where: {
          sourceId: source.id,
          url: video.url,
        },
      });

      // If video doesn't exist, create it
      if (!contentItem) {
        contentItem = await prisma.contentItem.create({
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

      // Link video to playlist
      await prisma.playlistItem.create({
        data: {
          playlistId: playlist.id,
          contentItemId: contentItem.id,
          position: i,
        },
      });
    }

    // Revalidate relevant paths
    revalidatePath("/my-sources");
    revalidatePath(`/${source.name.toLowerCase().replace(/\s+/g, "-")}`);

    return {
      success: true,
      message: `Saved playlist with ${videos.length} videos`,
      playlistId: playlist.id,
      videosAdded,
      totalVideos: videos.length,
    };
  } catch (error) {
    console.error("Error saving public playlist:", error);

    if (error instanceof QuotaExhaustedError) {
      return {
        success: false,
        error: "quota_exceeded",
        message: error.message,
        resetAt: error.resetAt.toISOString(),
      };
    }

    throw error;
  }
}

function extractPlaylistId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle different YouTube playlist URL formats
    // https://www.youtube.com/playlist?list=PLxxxxxx
    // https://youtube.com/playlist?list=PLxxxxxx
    if (urlObj.pathname.includes("/playlist")) {
      return urlObj.searchParams.get("list");
    }

    // https://www.youtube.com/watch?v=xxxxx&list=PLxxxxxx
    if (urlObj.searchParams.has("list")) {
      return urlObj.searchParams.get("list");
    }

    return null;
  } catch (error) {
    console.error("Error extracting playlist ID:", error);
    return null;
  }
}

export async function deletePlaylist(playlistId: string) {
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

    // Get playlist with source
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        source: true,
      },
    });

    if (!playlist) {
      throw new Error("Playlist not found");
    }

    // Check if user owns the source or is admin
    const isOwner = playlist.source.createdByUserId === dbUser.id;
    const isAdmin = dbUser.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized to delete this playlist");
    }

    // Delete playlist (cascade will handle playlistItems)
    await prisma.playlist.delete({
      where: { id: playlistId },
    });

    revalidatePath("/my-sources");
    revalidatePath(
      `/${playlist.source.name.toLowerCase().replace(/\s+/g, "-")}`
    );

    return {
      success: true,
      message: "Playlist deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw error;
  }
}
