# Quick Start: Fetching YouTube Videos

## Setup (5 minutes)

1. **Get YouTube API Key:**

   - Visit https://console.cloud.google.com/
   - Enable YouTube Data API v3
   - Create an API key

2. **Add to `.env.local`:**

   ```env
   YOUTUBE_API_KEY=your_key_here
   ```

3. **Restart your dev server**

## Usage

### Option 1: Add Sync Button to Source Cards

Edit `/components/sources/source-card.tsx`:

```typescript
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";

// Inside your component, add to CardFooter:
{
  source.type === "youtube" && (
    <SyncYouTubeButton sourceId={source.id} sourceName={source.name} />
  );
}
```

### Option 2: Call Server Action Directly

```typescript
import { syncYouTubeSource } from "@/actions/sync.actions";

const handleSync = async () => {
  const result = await syncYouTubeSource(sourceId);
  console.log(`Synced ${result.videosAdded} videos`);
};
```

### Option 3: Use API Route

```typescript
const response = await fetch("/api/sync/youtube", {
  method: "POST",
  body: JSON.stringify({ sourceId: "your_source_id" }),
});
```

## What Happens

1. The system extracts the YouTube channel ID from the source URL
2. Fetches up to 50 recent videos using YouTube Data API
3. Stores them in your database as `ContentItem` records
4. Updates existing videos if they've changed
5. Revalidates your pages to show new content

## View Videos

Once synced, videos are available via:

```typescript
import { getContentItemsBySource } from "@/lib/prisma-sources";

const videos = await getContentItemsBySource(sourceId);
```

Each video has:

- `title` - Video title
- `url` - YouTube watch URL
- `thumbnailUrl` - Thumbnail image
- `description` - Video description
- `publishedAt` - Publication date

See `YOUTUBE_SYNC_GUIDE.md` for complete documentation.
