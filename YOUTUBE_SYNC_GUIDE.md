# YouTube Video Fetching Setup

This guide explains how to fetch videos from your YouTube sources.

## Prerequisites

1. **Get a YouTube Data API v3 Key**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **YouTube Data API v3**
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the API key

2. **Add API Key to Environment Variables**

   Add to your `.env.local` file:

   ```env
   YOUTUBE_API_KEY=your_api_key_here
   ```

## How to Use

### Method 1: Using Server Actions (Recommended)

You can use the server actions in your components:

```typescript
import {
  syncYouTubeSource,
  syncAllYouTubeSources,
} from "@/actions/sync.actions";

// Sync a specific source
const result = await syncYouTubeSource(sourceId);
console.log(
  `Added ${result.videosAdded} videos, updated ${result.videosUpdated}`
);

// Sync all sources the user follows
const allResults = await syncAllYouTubeSources();
console.log(`Processed ${allResults.sourcesProcessed} sources`);
```

### Method 2: Using the Sync Button Component

Add the sync button to any component:

```typescript
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";

// Sync a specific source
<SyncYouTubeButton sourceId={source.id} sourceName={source.name} />

// Sync all sources
<SyncYouTubeButton />
```

### Method 3: Using the API Route Directly

Make a POST request to `/api/sync/youtube`:

```typescript
// Sync all followed sources
const response = await fetch("/api/sync/youtube", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    maxVideos: 50,
    includePlaylists: false,
  }),
});

// Sync specific source
const response = await fetch("/api/sync/youtube", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sourceId: "source_id_here",
    maxVideos: 50,
    includePlaylists: true,
  }),
});

const result = await response.json();
console.log(result);
```

## API Reference

### YouTube Library Functions (`/lib/youtube.ts`)

- `getChannelIdFromUrl(url)` - Extract channel ID from YouTube URL
- `getChannelInfo(channelId)` - Get channel metadata
- `getChannelVideos(channelId, maxResults)` - Fetch recent videos
- `getChannelPlaylists(channelId, maxResults)` - Fetch channel playlists
- `getPlaylistVideos(playlistId, maxResults)` - Get videos from a playlist
- `getVideoInfo(videoId)` - Get single video details

### Server Actions (`/actions/sync.actions.ts`)

- `syncYouTubeSource(sourceId)` - Sync videos from one source
- `syncAllYouTubeSources()` - Sync all YouTube sources user follows
- `updateYouTubeChannelInfo(sourceId)` - Update channel metadata

### API Endpoints

#### POST `/api/sync/youtube`

Syncs videos from YouTube sources.

**Body:**

```json
{
  "sourceId": "optional_source_id",
  "includePlaylists": false,
  "maxVideos": 50
}
```

**Response:**

```json
{
  "success": true,
  "sources": 3,
  "videosAdded": 125,
  "videosUpdated": 12,
  "playlistsAdded": 0,
  "errors": []
}
```

#### GET `/api/sync/youtube?sourceId=xxx`

Get sync status for a source.

**Response:**

```json
{
  "sourceId": "xxx",
  "sourceName": "Channel Name",
  "videoCount": 150,
  "playlistCount": 5,
  "lastVideoPublished": "2025-11-07T10:00:00Z",
  "lastSynced": "2025-11-07T12:00:00Z"
}
```

## Database Schema

Videos are stored in the `ContentItem` table with:

- `sourceId` - Links to the YouTube channel
- `type` - Set to "video"
- `title` - Video title
- `url` - Full YouTube video URL
- `thumbnailUrl` - Video thumbnail
- `description` - Video description
- `publishedAt` - When the video was published

Playlists are stored in the `Playlist` table.

## Example Integration

Add to your source card component:

```typescript
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";

export function SourceCard({ source }: { source: Source }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{source.name}</CardTitle>
      </CardHeader>
      <CardFooter>
        {source.type === "youtube" && (
          <SyncYouTubeButton sourceId={source.id} sourceName={source.name} />
        )}
      </CardFooter>
    </Card>
  );
}
```

## Rate Limits

YouTube Data API has quota limits:

- **10,000 units per day** (default)
- Each video fetch costs ~3-5 units
- Monitor usage in Google Cloud Console

To optimize:

- Sync less frequently
- Reduce `maxVideos` parameter
- Cache results when possible

## Troubleshooting

**"YouTube API key not configured"**

- Make sure `YOUTUBE_API_KEY` is in your `.env.local`
- Restart your dev server after adding the key

**"Failed to extract channel ID"**

- Ensure the URL format is correct
- Supported formats:
  - `https://youtube.com/@channelhandle`
  - `https://youtube.com/channel/CHANNEL_ID`
  - `https://youtube.com/c/channelname`
  - `https://youtube.com/user/username`

**"Quota exceeded"**

- You've hit the daily API limit
- Wait until the next day or request a quota increase in Google Cloud Console

## Next Steps

- Set up a cron job to auto-sync videos daily
- Add webhook support for real-time updates
- Implement incremental syncing (only fetch new videos since last sync)
- Add video filtering and categorization
