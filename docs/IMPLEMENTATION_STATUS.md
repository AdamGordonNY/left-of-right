# Implementation Status: User-Managed YouTube API Keys

## ✅ Completed Tasks

### 1. Database Schema ✓

- Added `youtubeApiKey`, `youtubeApiKeyBackup`, `apiKeyCreatedAt`, `apiKeyLastUsed`, `apiKeyQuotaStatus` to User model
- Prisma client regenerated with new fields

### 2. Encryption System ✓

- Created `lib/encryption.ts` with AES-256-GCM encryption
- Includes `encrypt()`, `decrypt()`, `validateYouTubeApiKey()`, `maskApiKey()` functions
- Uses `ENCRYPTION_SECRET` environment variable

### 3. Profile Page ✓

- Created `/profile` route with tabs layout
- API Keys, Profile, and Preferences tabs
- Protected route (requires authentication)

### 4. API Keys Management UI ✓

- `components/profile/api-keys-section.tsx` - Full-featured API key management
- Quota usage display
- Add/update/delete keys
- Validation with visual feedback
- Password-style inputs with show/hide toggle

### 5. API Key Instructions ✓

- `components/profile/api-key-instructions.tsx`
- Step-by-step guide for Google Cloud Console
- External links to relevant Google Cloud pages
- Security and quota information

### 6. API Endpoints ✓

- `GET /api/user/api-keys` - Retrieve masked keys and quota status
- `POST /api/user/api-keys` - Save/update API keys
- `DELETE /api/user/api-keys` - Delete specific key
- `POST /api/user/validate-youtube-key` - Validate keys before saving

### 7. YouTube Client Refactoring ✓

- Updated `YouTubeClientManager` to accept user-specific keys
- Added `createUserYouTubeClient()` helper function
- Updated `executeYouTubeOperation()` to accept `userId` parameter
- Implemented user-specific quota tracking in database

### 8. Quota Tracking ✓

- Added `getUserQuotaStatus()`, `logUserQuotaUsage()`, `resetUserQuotaStatus()` to `youtube-cache-nextjs.ts`
- Per-user quota stored in database JSON field
- Automatic backup key fallback

### 9. Navigation ✓

- Added Settings link to header navigation
- Uses Settings icon from lucide-react
- Only visible when signed in

### 10. Feature Flag System ✓

- `ENABLE_USER_API_KEYS` environment variable
- Feature can be toggled on/off without code changes
- Falls back to system keys when disabled or user has no keys

### 11. Documentation ✓

- Created comprehensive `docs/USER_API_KEYS.md`
- Created `.env.example` with all required variables
- Includes architecture, API docs, security considerations, and troubleshooting

## 🚧 Remaining Tasks

### Task 1: Update YouTube API Wrapper Functions

**File**: `lib/youtube.ts`

All YouTube functions need to accept an optional `userId` parameter:

```typescript
// Before
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 50
) {
  return executeYouTubeOperation(
    (apiKey) => {
      /* ... */
    },
    "channels.list",
    { channelId, maxResults }
  );
}

// After
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 50,
  userId?: string // Add this parameter
) {
  return executeYouTubeOperation(
    (apiKey) => {
      /* ... */
    },
    "channels.list",
    { channelId, maxResults },
    { userId } // Pass userId to options
  );
}
```

Functions to update:

- `getChannelVideos()`
- `getChannelInfo()`
- `getChannelPlaylists()`
- `getPlaylistVideos()`

### Task 2: Update Sync YouTube API Route

**File**: `app/api/sync/youtube/route.ts`

Modify to retrieve and use authenticated user's API key:

```typescript
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get database user ID from Clerk ID
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Pass user.id to YouTube operations
  const channelInfo = await getChannelInfo(channelId, user.id);
  const videos = await getChannelVideos(channelId, 50, user.id);
  // etc...
}
```

### Task 3: Update SyncYouTubeButton Component

**File**: `components/sources/sync-youtube-button.tsx` (or similar)

Add handling for missing API key scenarios:

```typescript
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export function SyncYouTubeButton({ sourceId }: { sourceId: string }) {
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const router = useRouter();

  // Check if user has API key configured
  useEffect(() => {
    async function checkApiKey() {
      if (!user) return;

      try {
        const response = await fetch("/api/user/api-keys");
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasPrimaryKey);
        }
      } catch (error) {
        console.error("Error checking API key:", error);
      }
    }

    checkApiKey();
  }, [user]);

  async function handleSync() {
    try {
      const response = await fetch("/api/sync/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Check for quota exceeded error
        if (error.code === "QUOTA_EXCEEDED") {
          setError(
            "Your YouTube API quota has been exceeded. Please try again after midnight PST."
          );
          return;
        }

        // Check for missing API key error
        if (error.code === "NO_API_KEY") {
          setError("Please configure your YouTube API key in settings.");
          return;
        }

        throw new Error(error.message || "Sync failed");
      }

      // Success
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sync failed");
    }
  }

  // Show setup message if user has no API key and feature is enabled
  if (
    hasApiKey === false &&
    process.env.NEXT_PUBLIC_ENABLE_USER_API_KEYS === "true"
  ) {
    return (
      <Alert>
        <AlertDescription>
          To sync YouTube content, you need to configure your YouTube API key.{" "}
          <Link href="/profile" className="underline font-medium">
            Set up API key →
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleSync}>Sync YouTube Content</Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### Task 4: Database Migration

**When database is accessible:**

```bash
# Apply schema changes to database
npx prisma db push

# Or create a proper migration
npx prisma migrate dev --name add_user_youtube_api_keys
```

### Task 5: Environment Variables Setup

Add to your `.env` file:

```bash
# Generate encryption secret (REQUIRED)
ENCRYPTION_SECRET=$(openssl rand -base64 32)

# Enable feature (OPTIONAL - defaults to false)
ENABLE_USER_API_KEYS=true

# Also add to .env.local for client-side access (if needed for UI)
NEXT_PUBLIC_ENABLE_USER_API_KEYS=true
```

### Task 6: Testing

**Test Checklist:**

- [ ] Navigate to `/profile` - page loads correctly
- [ ] Click API Keys tab - section displays
- [ ] Enter invalid API key - validation fails with error
- [ ] Enter valid API key - validation succeeds
- [ ] Save API key - encrypted and stored in database
- [ ] Reload page - masked key displays correctly
- [ ] Try syncing YouTube source - uses user's API key
- [ ] Check quota display - updates after sync
- [ ] Delete API key - removed from database
- [ ] Try sync without API key - shows setup message
- [ ] Exhaust quota - system switches to backup key
- [ ] Test with feature flag disabled - falls back to system keys

### Task 7: Cron Job for Quota Reset

**Create daily reset job:**

```typescript
// app/api/cron/reset-quotas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Protect this route with a secret token
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Reset all user quotas
    const result = await prisma.user.updateMany({
      where: {
        NOT: {
          apiKeyQuotaStatus: null,
        },
      },
      data: {
        apiKeyQuotaStatus: {
          primary: { requestsToday: 0, isExhausted: false },
          backup: { requestsToday: 0, isExhausted: false },
        },
      },
    });

    console.log(`Reset quota for ${result.count} users`);

    return NextResponse.json({
      success: true,
      resetCount: result.count,
    });
  } catch (error) {
    console.error("Error resetting quotas:", error);
    return NextResponse.json(
      { error: "Failed to reset quotas" },
      { status: 500 }
    );
  }
}
```

**Set up cron in Vercel:**

1. Go to Project Settings → Cron Jobs
2. Add job: `0 8 * * *` (midnight PST = 8am UTC)
3. Endpoint: `/api/cron/reset-quotas`
4. Add `CRON_SECRET` to environment variables

## 📝 Quick Start Guide

1. **Set environment variables:**

   ```bash
   echo "ENCRYPTION_SECRET=$(openssl rand -base64 32)" >> .env
   echo "ENABLE_USER_API_KEYS=true" >> .env
   ```

2. **Generate Prisma client:**

   ```bash
   npx prisma generate
   ```

3. **Apply database migration** (when DB is accessible):

   ```bash
   npx prisma db push
   ```

4. **Update remaining code:**

   - Modify `lib/youtube.ts` functions
   - Update `/api/sync/youtube` route
   - Update sync button components

5. **Test the feature:**
   - Navigate to `/profile`
   - Add a test API key
   - Try syncing a YouTube source

## 🎯 Next Steps

The core infrastructure is complete! The remaining tasks are:

1. **Integration** - Connect user API keys to existing YouTube sync operations
2. **Error Handling** - Add user-friendly error messages for missing keys
3. **Testing** - End-to-end testing of the complete flow
4. **Cron Setup** - Daily quota reset job
5. **Documentation** - Update user-facing docs

All the hard work is done. The remaining tasks are straightforward integrations that connect the new system to your existing features.
