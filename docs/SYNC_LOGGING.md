# Sync Logging System

## Overview

A comprehensive logging system that tracks all YouTube sync operations with detailed information about who triggered them, how many videos were added, failures, and timestamps.

## Database Schema

### SyncLog Model

```prisma
model SyncLog {
  id              String   @id @default(cuid())
  userId          String
  sourceId        String?
  sourceName      String?
  syncType        String // "single_source", "bulk_sync"
  status          String // "success", "partial", "failed"
  videosAdded     Int      @default(0)
  videosFailed    Int      @default(0)
  totalProcessed  Int      @default(0)
  errorMessage    String?  @db.Text
  failedVideos    Json? // Array of { title, url, error }
  metadata        Json? // Additional context
  startedAt       DateTime
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])
}
```

## Features

### 1. Single Source Sync Logging

- Logs every individual source sync operation
- Captures:
  - User who triggered the sync
  - Source name and ID
  - Number of videos successfully added
  - Number of videos that failed
  - Individual failed video details (title, URL, error message)
  - Start and completion timestamps
  - Duration
  - Metadata (videos in API response, early stop indicator)

### 2. Bulk Sync Logging

- Logs bulk sync operations across multiple sources
- Captures:
  - User who triggered the bulk sync
  - Total number of sources processed
  - List of all source names
  - Total videos added across all sources
  - Failed sources with error details
  - Quota exceeded status
  - Overall status (success/partial/failed)

### 3. Error Tracking

- Individual video failures are captured with:
  - Video title
  - Video URL
  - Specific error message
- Source-level failures in bulk syncs
- Database errors during sync operations
- API quota exceeded errors

### 4. Admin Dashboard

#### Sync Logs Tab

Located at `/admin` → Sync Logs tab

**Features:**

- Chronological list of all sync operations (last 100)
- Color-coded status indicators:
  - Green: Success
  - Yellow: Partial (some failures)
  - Red: Failed
- Key metrics displayed:
  - User who triggered sync
  - Sync type (single source vs bulk)
  - Videos added/failed counts
  - Duration
  - Timestamp
- Expandable details showing:
  - Error messages
  - Failed videos/sources list
  - Additional metadata
- Real-time refresh capability

## Implementation Details

### Updated Files

1. **`prisma/schema.prisma`**

   - Added SyncLog model with relations
   - Added syncLogs relation to User model

2. **`actions/sync.actions.ts`**

   - Updated `syncYouTubeSource()` to create and update sync logs
   - Updated `syncAllYouTubeSources()` for bulk sync logging
   - Wrapped individual video processing in try-catch for failure tracking
   - Added start/completion timestamps
   - Logs both successes and failures

3. **`components/admin/sync-logs-list.tsx`**

   - Client component for displaying sync history
   - Expandable cards with detailed information
   - Status indicators and badges
   - User avatars and names
   - Formatted timestamps and durations

4. **`app/api/admin/sync-logs/route.ts`**

   - Admin-only API endpoint
   - Fetches last 100 sync logs with user info
   - Ordered by most recent first

5. **`app/admin/page.tsx`**

   - Added "Sync Logs" tab
   - Integrated SyncLogsList component

6. **`supabase/migrations/20251130000000_add_sync_logs.sql`**
   - Database migration to create SyncLog table
   - Indexes for performance
   - Foreign key constraints

## Usage

### Viewing Sync Logs

1. Navigate to `/admin`
2. Click on "Sync Logs" tab
3. View all sync operations
4. Click on any log to expand and see details

### What Gets Logged

Every sync operation automatically logs:

- ✅ Who triggered it (user email, name, avatar)
- ✅ When it started and finished
- ✅ How long it took
- ✅ Type of sync (single source or bulk)
- ✅ Which source(s) were synced
- ✅ How many videos were successfully added
- ✅ How many videos failed (with details)
- ✅ Any error messages
- ✅ Additional metadata (API response size, early stopping, etc.)

### Status Types

1. **Success**: All videos processed without errors
2. **Partial**: Some videos succeeded, some failed
3. **Failed**: Complete failure (quota exceeded, API errors, etc.)

## Benefits

1. **Accountability**: Track which users are syncing sources
2. **Debugging**: Identify specific videos or channels causing issues
3. **Performance Monitoring**: See sync durations and identify bottlenecks
4. **Quota Management**: Track API usage patterns
5. **User Support**: Help users understand why syncs might fail
6. **Analytics**: Understand sync patterns and usage

## Future Enhancements

Potential additions:

- User-specific sync history view
- Email notifications for failed syncs
- Retry failed syncs from admin panel
- Export sync logs to CSV
- Sync statistics dashboard
- Automated cleanup of old logs
