import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  getChannelIdFromUrl,
  getChannelVideos,
  getChannelPlaylists,
  getPlaylistVideos,
} from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/sync/youtube
 * Syncs videos from YouTube sources
 *
 * Body:
 * - sourceId?: string - Sync specific source (optional)
 * - includePlaylists?: boolean - Also sync playlists (default: false)
 * - maxVideos?: number - Max videos to fetch per channel (default: 50)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: "YouTube API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      sourceId,
      includePlaylists = false,
      maxVideos = 50,
    } = body as {
      sourceId?: string;
      includePlaylists?: boolean;
      maxVideos?: number;
    };

    // Get user's database ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // User ID for API key lookup
    const userDbId = dbUser.id;

    // Get YouTube sources to sync
    const where: any = {
      type: "youtube",
      isActive: true,
    };

    if (sourceId) {
      where.id = sourceId;
    } else {
      // If no specific source, get sources the user follows
      where.followers = {
        some: {
          userId: userDbId,
        },
      };
    }

    const sources = await prisma.source.findMany({
      where,
    });

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No YouTube sources found" },
        { status: 404 }
      );
    }

    const syncResults = {
      sources: sources.length,
      videosAdded: 0,
      videosUpdated: 0,
      playlistsAdded: 0,
      errors: [] as string[],
    };

    // Sync each source
    for (const source of sources) {
      try {
        console.log(`Syncing YouTube source: ${source.name}`);

        // Extract channel ID from URL
        const channelId = await getChannelIdFromUrl(source.url);

        if (!channelId) {
          syncResults.errors.push(
            `Failed to extract channel ID from ${source.name}`
          );
          continue;
        }

        // Fetch videos from channel (pass user ID for user-specific API keys)
        const videos = await getChannelVideos(channelId, maxVideos, userDbId);

        // Store videos in database
        for (const video of videos) {
          try {
            // Check if video already exists
            const existingVideo = await prisma.contentItem.findFirst({
              where: {
                sourceId: source.id,
                url: video.url,
              },
            });

            if (existingVideo) {
              // Update existing video
              await prisma.contentItem.update({
                where: { id: existingVideo.id },
                data: {
                  title: video.title,
                  description: video.description,
                  thumbnailUrl: video.thumbnailUrl,
                  publishedAt: new Date(video.publishedAt),
                },
              });
              syncResults.videosUpdated++;
            } else {
              // Create new video
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
              syncResults.videosAdded++;
            }
          } catch (error) {
            console.error(`Error storing video ${video.id}:`, error);
            syncResults.errors.push(
              `Failed to store video: ${video.title.substring(0, 50)}`
            );
          }
        }

        // Optionally sync playlists
        if (includePlaylists) {
          try {
            const playlists = await getChannelPlaylists(
              channelId,
              50,
              userDbId
            );

            for (const playlist of playlists) {
              const existingPlaylist = await prisma.playlist.findFirst({
                where: {
                  sourceId: source.id,
                  playlistUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
                },
              });

              if (!existingPlaylist) {
                await prisma.playlist.create({
                  data: {
                    sourceId: source.id,
                    title: playlist.title,
                    description: playlist.description,
                    thumbnailUrl: playlist.thumbnailUrl,
                    playlistUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
                    videoCount: playlist.videoCount,
                    publishedAt: new Date(playlist.publishedAt),
                  },
                });
                syncResults.playlistsAdded++;
              }
            }
          } catch (error) {
            console.error(`Error syncing playlists for ${source.name}:`, error);
            syncResults.errors.push(
              `Failed to sync playlists for ${source.name}`
            );
          }
        }
      } catch (error) {
        console.error(`Error syncing source ${source.name}:`, error);
        syncResults.errors.push(`Failed to sync ${source.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...syncResults,
    });
  } catch (error) {
    console.error("Error in YouTube sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/youtube?sourceId=xxx
 * Get sync status for a YouTube source
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Get source with content items count
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: {
        _count: {
          select: {
            contentItems: true,
          },
        },
        contentItems: {
          orderBy: { publishedAt: "desc" },
          take: 1,
          select: {
            publishedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json({
      sourceId: source.id,
      sourceName: source.name,
      videoCount: source._count.contentItems,
      lastVideoPublished: source.contentItems[0]?.publishedAt || null,
      lastSynced: source.contentItems[0]?.createdAt || null,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
