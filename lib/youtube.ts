import { google, youtube_v3 } from "googleapis";
import { executeYouTubeOperation } from "./youtube-client-nextjs";

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

export interface YouTubeSubscription {
  channelId: string;
  channelTitle: string;
  channelDescription: string;
  thumbnailUrl: string;
  subscribedAt: string;
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
    const params = { handle };
    const response = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.search.list({
          part: ["snippet"],
          q: handle,
          type: ["channel"],
          maxResults: 1,
        });
      },
      "search.channelByHandle",
      params,
      { revalidate: 86400 } // 24 hours
    );

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
    const params = { username };
    const response = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.channels.list({
          part: ["id"],
          forUsername: username,
        });
      },
      "channels.byUsername",
      params,
      { revalidate: 86400 } // 24 hours
    );

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
    const params = { channelId };
    const response = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.channels.list({
          part: ["snippet", "statistics"],
          id: [channelId],
        });
      },
      "channels.info",
      params,
      { revalidate: 86400 } // 24 hours
    );

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
    const channelParams = { channelId };
    const channelResponse = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.channels.list({
          part: ["contentDetails"],
          id: [channelId],
        });
      },
      "channels.contentDetails",
      channelParams,
      { revalidate: 86400 } // 24 hours
    );

    const uploadsPlaylistId =
      channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists
        ?.uploads;

    if (!uploadsPlaylistId) {
      console.error("No uploads playlist found for channel");
      return [];
    }

    const playlistParams = { playlistId: uploadsPlaylistId, maxResults };
    const playlistResponse = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.playlistItems.list({
          part: ["snippet", "contentDetails"],
          playlistId: uploadsPlaylistId,
          maxResults,
        });
      },
      "playlistItems.list",
      playlistParams,
      { revalidate: 1800 } // 30 minutes
    );

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
    const params = { channelId, maxResults };
    const response = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.playlists.list({
          part: ["snippet", "contentDetails"],
          channelId,
          maxResults,
        });
      },
      "playlists.list",
      params,
      { revalidate: 7200 } // 2 hours
    );

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
    const params = { playlistId, maxResults };
    const response = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.playlistItems.list({
          part: ["snippet", "contentDetails"],
          playlistId,
          maxResults,
        });
      },
      "playlistItems.videos",
      params,
      { revalidate: 3600 } // 1 hour
    );

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
    const params = { videoId };
    const response = await executeYouTubeOperation(
      (apiKey) => {
        const youtube = google.youtube({ version: "v3", auth: apiKey });
        return youtube.videos.list({
          part: ["snippet"],
          id: [videoId],
        });
      },
      "videos.info",
      params,
      { revalidate: 86400 } // 24 hours
    );

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

/**
 * Get user's YouTube subscriptions using their OAuth access token
 * Note: This function doesn't use caching as it requires user authentication
 */
export async function getUserSubscriptions(
  accessToken: string
): Promise<YouTubeSubscription[]> {
  try {
    const youtube = google.youtube({
      version: "v3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const subscriptions: YouTubeSubscription[] = [];
    let pageToken: string | undefined;

    do {
      const response = await youtube.subscriptions.list({
        part: ["snippet"],
        mine: true,
        maxResults: 50,
        pageToken,
      });

      for (const item of response.data.items || []) {
        if (!item.snippet) continue;

        subscriptions.push({
          channelId: item.snippet.resourceId?.channelId || "",
          channelTitle: item.snippet.title || "Unknown Channel",
          channelDescription: item.snippet.description || "",
          thumbnailUrl:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
          subscribedAt: item.snippet.publishedAt || new Date().toISOString(),
        });
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return subscriptions;
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return [];
  }
}
