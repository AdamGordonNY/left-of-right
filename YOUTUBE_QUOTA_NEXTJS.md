# YouTube API Quota Management with Next.js Caching

This document describes the Next.js-based caching and quota management system for YouTube API operations.

## Overview

The system uses **Next.js's built-in `unstable_cache`** and filesystem-based quota tracking to manage YouTube API quota limits across primary and backup API keys.

## Key Features

### 1. Next.js Native Caching

- Uses `unstable_cache` for automatic request deduplication
- Cache revalidation periods configurable per operation type
- No external database dependencies (Supabase not required)
- Filesystem-based quota tracking

### 2. Automatic Backup Key Fallback

- Primary API key used by default
- Automatically switches to backup key when quota exceeded
- Tracks quota status for both keys in `.cache/quota-status.json`

### 3. Smart Cache Revalidation Times

- **Channel info**: 86400 seconds (24 hours)
- **Channel videos**: 1800 seconds (30 minutes)
- **Playlists**: 7200 seconds (2 hours)
- **Playlist videos**: 3600 seconds (1 hour)
- **Video info**: 86400 seconds (24 hours)

### 4. Quota Tracking

- Logs quota usage to filesystem
- Tracks daily request counts
- Automatic reset at midnight PST
- Persistent across deploys (when using persistent storage)

## Setup

### Environment Variables

Add these to your `.env` file:

```env
YOUTUBE_API_KEY=your_primary_key_here
YOUTUBE_BACKUP_KEY=your_backup_key_here  # Optional
```

### Cache Directory

The system creates a `.cache` directory to store quota status:

```
.cache/
  └── quota-status.json  # Quota tracking for both keys
```

Make sure `.cache/` is in your `.gitignore`:

```gitignore
.cache/
```

### For Production Deployments

If deploying to Vercel or similar platforms:

1. **With persistent storage** (recommended):

   - Mount a persistent volume for `.cache` directory
   - Quota status persists across deployments

2. **Without persistent storage**:
   - Quota status resets on each deployment
   - System still works but starts fresh each time

## Usage

### In Server Components/Actions

```typescript
import { getChannelVideos, getChannelInfo } from "@/lib/youtube";
import { QuotaExhaustedError } from "@/lib/youtube-client-nextjs";

try {
  const videos = await getChannelVideos(channelId);
  // Videos are automatically cached
} catch (error) {
  if (error instanceof QuotaExhaustedError) {
    console.log("Quota exhausted. Resets at:", error.resetAt);
    // Cached data already returned if available
  }
}
```

### Check Quota Status

```typescript
// API endpoint: GET /api/youtube/quota-status
const response = await fetch("/api/youtube/quota-status");
const status = await response.json();

console.log(status);
// {
//   success: true,
//   primary: {
//     isExhausted: false,
//     exhaustedAt: null,
//     resetAt: "2024-11-10T08:00:00.000Z",
//     requestsToday: 45
//   },
//   backup: {
//     isExhausted: false,
//     exhaustedAt: null,
//     resetAt: null,
//     requestsToday: 0
//   },
//   allExhausted: false
// }
```

### Invalidate Cache (Force Refresh)

```typescript
import { revalidateTag } from "next/cache";

// Invalidate all YouTube caches
revalidateTag("youtube");

// Invalidate specific operation type
revalidateTag("channels.info");
revalidateTag("playlistItems.list");
```

## Architecture

### Core Files

- **lib/youtube-cache-nextjs.ts** - Caching utilities and quota tracking
- **lib/youtube-client-nextjs.ts** - YouTube client manager with fallback logic
- **lib/youtube.ts** - YouTube API wrapper functions
- **app/api/youtube/quota-status/route.ts** - Quota status API endpoint

### How It Works

1. **Request Initiated**: User triggers YouTube API operation
2. **Cache Check**: Next.js checks if cached response exists and is valid
3. **Cache Hit**: Return cached data (no API call)
4. **Cache Miss**: Proceed to API request
5. **Quota Check**: Verify quota status before making request
6. **Primary Key Attempt**: Make request with primary API key
7. **Success**: Cache response with revalidation period
8. **403 Quota Error**: System detects quota exhaustion
9. **Log Quota Event**: Update quota status in filesystem
10. **Backup Attempt**: If backup key available, retry
11. **Backup Success**: Cache response and return
12. **Both Exhausted**: Throw QuotaExhaustedError

## Cache Revalidation

Next.js `unstable_cache` automatically handles:

- Request deduplication (same request within revalidation period uses cache)
- Stale-while-revalidate behavior
- Background revalidation

### Adjust Revalidation Times

Edit values in `/lib/youtube.ts`:

```typescript
const response = await executeYouTubeOperation(
  (apiKey) => {
    const youtube = google.youtube({ version: 'v3', auth: apiKey });
    return youtube.channels.list({...});
  },
  "channels.info",
  params,
  { revalidate: 3600 } // Adjust this value (seconds)
);
```

## Quota Reset

YouTube API quotas reset at midnight Pacific Standard Time (PST).

The system:

- Automatically calculates next reset time
- Checks reset time before each request
- Clears exhausted status after reset time passes

## Monitoring

### View Quota Status

```bash
# Check quota status file
cat .cache/quota-status.json
```

```json
{
  "primary": {
    "isExhausted": false,
    "exhaustedAt": null,
    "resetAt": null,
    "requestsToday": 123
  },
  "backup": {
    "isExhausted": false,
    "exhaustedAt": null,
    "resetAt": null,
    "requestsToday": 0
  }
}
```

### Check Cache Performance

Use Next.js built-in cache insights:

- View cache hits/misses in dev mode console
- Monitor revalidation behavior

## Best Practices

1. **Set appropriate revalidation times** - Balance freshness vs API usage
2. **Use tags for cache invalidation** - Group related caches
3. **Monitor quota usage** - Check `.cache/quota-status.json` regularly
4. **Implement rate limiting** - Prevent quota exhaustion from abuse
5. **Keep backup key separate** - Use different Google Cloud project if possible

## Advantages Over Supabase Approach

✅ **No external dependencies** - Works entirely within Next.js  
✅ **Built-in deduplication** - Next.js handles request deduplication automatically  
✅ **Zero database costs** - No Supabase or database required  
✅ **Simpler setup** - No migration files or RLS policies  
✅ **Better DX** - Native Next.js caching patterns  
✅ **Faster** - In-memory cache with filesystem fallback

## Limitations

- Maximum 2 API keys (primary + backup)
- Quota status stored in filesystem (may reset on deployments without persistent storage)
- Cache data stored in Next.js cache (temporary, clears on rebuild)
- Quota resets at midnight PST (YouTube API limitation)
- No automatic switch back to primary key after reset

## Troubleshooting

### Both Keys Exhausted Frequently

- Increase revalidation times for frequently accessed data
- Implement request throttling
- Consider additional backup keys
- Review which operations consume most quota

### Cache Not Working

- Check Next.js cache configuration
- Verify revalidation times are set
- Review console logs for cache hits/misses
- Ensure `unstable_cache` is called correctly

### Quota Status Not Persisting

- Check `.cache` directory exists and is writable
- For production: ensure persistent storage is mounted
- Verify `.cache` is not in `.dockerignore` (if using Docker)

## Migration from Supabase Version

If migrating from the Supabase-based system:

1. Remove Supabase caching dependencies
2. Replace `import from "./youtube-client"` with `"./youtube-client-nextjs"`
3. Update cache options from `{ ttlMinutes: 1440 }` to `{ revalidate: 86400 }`
4. Remove Supabase migration files (optional)
5. No database cleanup needed

## Future Enhancements

- Redis cache backend (optional)
- Multiple backup keys (round-robin)
- Automatic switch back to primary at midnight PST
- Admin dashboard for quota monitoring
- Email notifications on quota exhaustion
- Predictive quota management
