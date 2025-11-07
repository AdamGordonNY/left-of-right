import { google, youtube_v3 } from "googleapis";

// Initialize YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  customUrl?: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
  publishedAt: string;
}

/**
 * Extract channel ID from various YouTube URL formats
 * Supports:
 * - https://youtube.com/@channelhandle
 * - https://youtube.com/channel/CHANNEL_ID
 * - https://youtube.com/c/channelname
 * - https://youtube.com/user/username
 */
export async function getChannelIdFromUrl(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Direct channel ID URL
    if (pathname.includes("/channel/")) {
      const channelId = pathname.split("/channel/")[1].split("/")[0];
      return channelId;
    }

    // Handle @username format
    if (pathname.includes("/@")) {
      const handle = pathname.split("/@")[1].split("/")[0];
      return getChannelIdFromHandle(handle);
    }

    // Legacy /c/ or /user/ formats
    if (pathname.includes("/c/") || pathname.includes("/user/")) {
      const username = pathname.split("/").filter(Boolean)[1];
      return getChannelIdFromUsername(username);
    }

    return null;
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
    return null;
  }
}

/**
 * Get channel ID from @handle
 */
async function getChannelIdFromHandle(handle: string): Promise<string | null> {
  try {
    const response = await youtube.search.list({
      part: ["snippet"],
      q: handle,
      type: ["channel"],
      maxResults: 1,
    });

    const channel = response.data.items?.[0];
    return channel?.snippet?.channelId || null;
  } catch (error) {
    console.error("Error fetching channel by handle:", error);
    return null;
  }
}

/**
 * Get channel ID from username
 */
async function getChannelIdFromUsername(
  username: string
): Promise<string | null> {
  try {
    const response = await youtube.channels.list({
      part: ["id"],
      forUsername: username,
    });

    return response.data.items?.[0]?.id || null;
  } catch (error) {
    console.error("Error fetching channel by username:", error);
    return null;
  }
}

/**
 * Get channel information by channel ID
 */
export async function getChannelInfo(
  channelId: string
): Promise<YouTubeChannel | null> {
  try {
    const response = await youtube.channels.list({
      part: ["snippet", "statistics"],
      id: [channelId],
    });

    const channel = response.data.items?.[0];
    if (!channel || !channel.snippet) return null;

    return {
      id: channel.id!,
      title: channel.snippet.title!,
      description: channel.snippet.description || "",
      thumbnailUrl:
        channel.snippet.thumbnails?.high?.url ||
        channel.snippet.thumbnails?.default?.url ||
        "",
      customUrl: channel.snippet.customUrl || undefined,
    };
  } catch (error) {
    console.error("Error fetching channel info:", error);
    return null;
  }
}

/**
 * Fetch recent videos from a channel
 */
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    // First, get the uploads playlist ID
    const channelResponse = await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });

    const uploadsPlaylistId =
      channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists
        ?.uploads;

    if (!uploadsPlaylistId) {
      console.error("No uploads playlist found for channel");
      return [];
    }

    // Fetch videos from uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults,
    });

    const videos: YouTubeVideo[] = [];

    for (const item of playlistResponse.data.items || []) {
      if (!item.snippet || !item.contentDetails?.videoId) continue;

      videos.push({
        id: item.contentDetails.videoId,
        title: item.snippet.title || "Untitled",
        description: item.snippet.description || "",
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        publishedAt: item.snippet.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      });
    }

    return videos;
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    return [];
  }
}

/**
 * Get all playlists from a channel
 */
export async function getChannelPlaylists(
  channelId: string,
  maxResults: number = 50
): Promise<YouTubePlaylist[]> {
  try {
    const response = await youtube.playlists.list({
      part: ["snippet", "contentDetails"],
      channelId,
      maxResults,
    });

    const playlists: YouTubePlaylist[] = [];

    for (const item of response.data.items || []) {
      if (!item.snippet || !item.id) continue;

      playlists.push({
        id: item.id,
        title: item.snippet.title || "Untitled",
        description: item.snippet.description || "",
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        videoCount: item.contentDetails?.itemCount || 0,
        publishedAt: item.snippet.publishedAt || new Date().toISOString(),
      });
    }

    return playlists;
  } catch (error) {
    console.error("Error fetching channel playlists:", error);
    return [];
  }
}

/**
 * Get videos from a specific playlist
 */
export async function getPlaylistVideos(
  playlistId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    const response = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults,
    });

    const videos: YouTubeVideo[] = [];

    for (const item of response.data.items || []) {
      if (!item.snippet || !item.contentDetails?.videoId) continue;

      videos.push({
        id: item.contentDetails.videoId,
        title: item.snippet.title || "Untitled",
        description: item.snippet.description || "",
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        publishedAt: item.snippet.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      });
    }

    return videos;
  } catch (error) {
    console.error("Error fetching playlist videos:", error);
    return [];
  }
}

/**
 * Get detailed video information
 */
export async function getVideoInfo(
  videoId: string
): Promise<YouTubeVideo | null> {
  try {
    const response = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video || !video.snippet) return null;

    return {
      id: video.id!,
      title: video.snippet.title || "Untitled",
      description: video.snippet.description || "",
      thumbnailUrl:
        video.snippet.thumbnails?.high?.url ||
        video.snippet.thumbnails?.default?.url ||
        "",
      publishedAt: video.snippet.publishedAt || new Date().toISOString(),
      url: `https://www.youtube.com/watch?v=${video.id}`,
    };
  } catch (error) {
    console.error("Error fetching video info:", error);
    return null;
  }
}
