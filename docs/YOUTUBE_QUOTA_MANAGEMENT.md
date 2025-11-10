# YouTube API Quota Management System

This document describes the comprehensive quota management system implemented for YouTube API operations.

## Overview

The system automatically manages YouTube API quota limits across primary and backup API keys, with intelligent caching and user-friendly error handling.

## Features

### 1. Automatic Backup Key Fallback
- Primary API key is used for all requests by default
- When primary key quota is exceeded, automatically switches to backup key
- Only switches when a 403 quota exceeded error is detected
- Does NOT automatically switch back (backup stays active once triggered)

### 2. Smart Caching System
- All YouTube API responses are cached in Supabase
- Cache TTL varies by operation type:
  - Channel info: 24 hours (1440 minutes)
  - Channel videos: 30 minutes
  - Playlists: 2 hours (120 minutes)
  - Playlist videos: 1 hour (60 minutes)
  - Video info: 24 hours (1440 minutes)
- When both keys are exhausted, cached data is returned automatically
- Cache is transparent to consumers - no code changes needed

### 3. Quota Tracking & Analytics
- All API requests are logged to Supabase
- Tracks:
  - Which key was used (primary/backup)
  - Operation type
  - Success/failure status
  - Quota exhaustion events
  - Request timestamps
- Quota status table tracks:
  - Whether each key is exhausted
  - When exhaustion occurred
  - When quota resets (midnight PST)
  - Daily request counts

### 4. User-Friendly Error Handling
- QuotaExceededDialog component shows clear message
- Displays quota reset time in user-friendly format
- Explains that cached data is being shown
- Toast notifications for successful syncs
- Graceful degradation when quota exceeded

## Setup

### Environment Variables

Add these to your `.env` file:

```env
YOUTUBE_API_KEY=your_primary_key_here
YOUTUBE_BACKUP_KEY=your_backup_key_here
```

### Database Migration

The system requires these Supabase tables:
- `youtube_quota_logs` - Logs all API requests
- `youtube_cache` - Stores cached responses
- `youtube_quota_status` - Tracks current quota status

Migration file: `supabase/migrations/20251109000000_add_youtube_quota_tracking.sql`

Run the migration using Supabase CLI or dashboard.

## Usage

### In Server Components/Actions

```typescript
import { getChannelVideos, getChannelInfo } from "@/lib/youtube";
import { QuotaExhaustedError } from "@/lib/youtube-client";

try {
  const videos = await getChannelVideos(channelId);
  // Handle videos
} catch (error) {
  if (error instanceof QuotaExhaustedError) {
    // Quota exceeded - cached data was returned if available
    console.log("Quota resets at:", error.resetAt);
  }
}
```

### In Client Components

```typescript
"use client";

import { useQuotaError } from "@/hooks/use-quota-error";
import { QuotaExceededDialog } from "@/components/notifications/quota-exceeded-dialog";

export function MyComponent() {
  const { quotaError, isDialogOpen, setIsDialogOpen, handleQuotaError } = useQuotaError();

  const handleSync = async () => {
    try {
      const result = await syncYouTubeSource(sourceId);

      if (result.error === "quota_exceeded") {
        handleQuotaError({
          name: "QuotaExhaustedError",
          message: result.message,
          resetAt: new Date(result.resetAt),
        });
      }
    } catch (error) {
      if (!handleQuotaError(error)) {
        // Handle other errors
      }
    }
  };

  return (
    <>
      <button onClick={handleSync}>Sync</button>

      {quotaError && (
        <QuotaExceededDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          resetAt={quotaError.resetAt}
        />
      )}
    </>
  );
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
//   primary: { isExhausted: false, resetAt: "2024-11-10T08:00:00.000Z" },
//   backup: { isExhausted: false, resetAt: "2024-11-10T08:00:00.000Z" },
//   allExhausted: false
// }
```

## Architecture

### Core Files

- **lib/youtube-client.ts** - Core client manager with fallback logic
- **lib/youtube-cache.ts** - Caching and quota tracking functions
- **lib/youtube.ts** - YouTube API wrapper functions (updated to use new client)
- **hooks/use-quota-error.ts** - React hook for quota error handling
- **components/notifications/quota-exceeded-dialog.tsx** - User notification dialog

### How It Works

1. **Request Initiated**: User triggers YouTube API operation
2. **Primary Key Attempt**: Request made with primary API key
3. **Success**: Response cached and returned
4. **403 Quota Error**: System detects quota exhaustion
5. **Log Event**: Quota exhaustion logged to database
6. **Backup Attempt**: If backup key available, retry with backup
7. **Backup Success**: Response cached and returned
8. **Both Exhausted**: Check cache for data
9. **Cache Hit**: Return cached data to user
10. **Cache Miss**: Throw QuotaExhaustedError with reset time
11. **User Notification**: Show QuotaExceededDialog

## Quota Reset

YouTube API quotas reset at midnight Pacific Standard Time (PST).

The system:
- Calculates next reset time automatically
- Displays reset time to users in local timezone
- Does NOT automatically reset to primary key (manual intervention required)

## Cache Management

### Automatic Cleanup

Call the cleanup function periodically (e.g., via cron job):

```typescript
import { cleanupExpiredCache } from "@/lib/youtube-cache";

// Remove expired cache entries
await cleanupExpiredCache();
```

### Manual Cache Invalidation

```sql
-- Clear cache for specific operation
DELETE FROM youtube_cache
WHERE operation_type = 'channels.videos'
AND cache_key LIKE '%channelId%';

-- Clear all expired cache
SELECT cleanup_expired_cache();
```

## Monitoring

### View Quota Logs

```sql
SELECT
  api_key_type,
  operation_type,
  COUNT(*) as total_requests,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN quota_exceeded THEN 1 ELSE 0 END) as quota_errors
FROM youtube_quota_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY api_key_type, operation_type;
```

### Check Current Status

```sql
SELECT * FROM youtube_quota_status;
```

### View Cache Stats

```sql
SELECT
  operation_type,
  COUNT(*) as cached_items,
  AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) / 60 as avg_ttl_minutes
FROM youtube_cache
WHERE expires_at > NOW()
GROUP BY operation_type;
```

## Best Practices

1. **Set appropriate cache TTLs** - Balance freshness vs API usage
2. **Monitor quota usage** - Track which operations use most quota
3. **Implement rate limiting** - Prevent quota exhaustion from abuse
4. **Regular cache cleanup** - Remove expired entries to save space
5. **Test error handling** - Ensure UI gracefully handles quota errors
6. **Keep backup key separate** - Use different Google Cloud project if possible

## Troubleshooting

### Both Keys Exhausted Frequently
- Increase cache TTL for frequently accessed data
- Implement request throttling
- Consider additional backup keys
- Review which operations consume most quota

### Cache Not Working
- Check Supabase connection
- Verify migration ran successfully
- Check RLS policies allow reads/writes
- Review logs for cache errors

### Errors Not Showing Dialog
- Ensure useQuotaError hook is called
- Verify QuotaExceededDialog is rendered
- Check error is QuotaExhaustedError instance
- Review browser console for errors

## Limitations

- Maximum 2 API keys (primary + backup)
- Cache stored in Supabase (storage costs apply)
- Quota resets at midnight PST (YouTube API limitation)
- No automatic switch back to primary key
- Authenticated operations (subscriptions.list) don't use caching

## Future Enhancements

- Multiple backup keys (round-robin)
- Automatic switch back to primary at midnight PST
- Admin dashboard for quota monitoring
- Email notifications on quota exhaustion
- Predictive quota management (warn before exhaustion)
- Request prioritization (critical vs non-critical)
