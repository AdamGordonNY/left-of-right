# User-Managed YouTube API Keys

This feature allows users to provide their own YouTube Data API v3 keys to use instead of shared platform keys. This gives users dedicated quota (10,000 units/day) and better reliability.

## Features

- **Secure Storage**: API keys are encrypted using AES-256-GCM before being stored in the database
- **Backup Keys**: Users can optionally provide a backup key for automatic fallback
- **Quota Tracking**: Per-user quota monitoring stored in the database
- **Automatic Fallback**: System automatically switches to backup key when primary is exhausted
- **Key Validation**: API keys are validated before being saved
- **Feature Flag**: Can be gradually rolled out with `ENABLE_USER_API_KEYS` environment variable

## Architecture

### Database Schema

The `User` model includes the following fields:

```prisma
model User {
  // ... existing fields
  youtubeApiKey         String?      // Encrypted API key
  youtubeApiKeyBackup   String?      // Encrypted backup API key
  apiKeyCreatedAt       DateTime?
  apiKeyLastUsed        DateTime?
  apiKeyQuotaStatus     Json?        // { primary: { requestsToday: 0, isExhausted: false }, backup: { ... } }
}
```

### Encryption

API keys are encrypted using the `lib/encryption.ts` module:

- **Algorithm**: AES-256-GCM with PBKDF2 key derivation
- **Format**: `salt:iv:authTag:ciphertext` (all base64 encoded)
- **Secret**: Stored in `ENCRYPTION_SECRET` environment variable (min 32 characters)

### API Endpoints

#### GET `/api/user/api-keys`

Returns user's masked API keys and quota status.

**Response:**

```json
{
  "hasPrimaryKey": true,
  "hasBackupKey": false,
  "maskedPrimaryKey": "AIzaSyAB••••••••••••••••••••1234",
  "apiKeyCreatedAt": "2025-11-10T...",
  "apiKeyLastUsed": "2025-11-10T...",
  "quotaStatus": {
    "primary": {
      "requestsToday": 150,
      "isExhausted": false
    },
    "backup": {
      "requestsToday": 0,
      "isExhausted": false
    }
  }
}
```

#### POST `/api/user/api-keys`

Save or update user's API keys.

**Request:**

```json
{
  "primaryKey": "AIzaSyA...",
  "backupKey": "AIzaSyB..." // optional
}
```

#### DELETE `/api/user/api-keys?type=primary|backup`

Delete a specific API key.

#### POST `/api/user/validate-youtube-key`

Validate API keys before saving.

**Request:**

```json
{
  "primaryKey": "AIzaSyA...",
  "backupKey": "AIzaSyB..." // optional
}
```

**Response:**

```json
{
  "primary": {
    "valid": true,
    "message": "API key is valid and working"
  },
  "backup": {
    "valid": false,
    "message": "API key is invalid or not authorized for YouTube Data API v3"
  }
}
```

### YouTube Client Management

The `YouTubeClientManager` class has been refactored to support user-specific API keys:

```typescript
// Create client with system keys (default)
const systemClient = new YouTubeClientManager();

// Create client with user keys
const userClient = new YouTubeClientManager({
  userId: "user_...",
  primaryKey: "AIzaSyA...",
  backupKey: "AIzaSyB...",
});

// Helper function that automatically selects appropriate keys
const client = await createUserYouTubeClient(userId);
```

The `executeYouTubeOperation` function now accepts an optional `userId` parameter:

```typescript
// Use system keys
const data = await executeYouTubeOperation(
  (apiKey) => youtube.channels.list({ auth: apiKey, ... }),
  'channels.list',
  { channelId: '...' }
);

// Use user's keys (if they have configured them)
const data = await executeYouTubeOperation(
  (apiKey) => youtube.channels.list({ auth: apiKey, ... }),
  'channels.list',
  { channelId: '...' },
  { userId: 'user_...' }
);
```

### Quota Tracking

User quota is tracked in the database using `apiKeyQuotaStatus` JSON field:

```typescript
// Get user's current quota status
const status = await getUserQuotaStatus(userId);

// Log a quota usage event
await logUserQuotaUsage(userId, "primary", true, false);

// Reset user's quota (run daily at midnight PST)
await resetUserQuotaStatus(userId);
```

## User Interface

### Profile Page

Located at `/profile`, the settings page includes:

- **API Keys Tab**: Manage YouTube API keys
- **Profile Tab**: View profile information
- **Preferences Tab**: (Future use)

### API Keys Section

The API keys section (`components/profile/api-keys-section.tsx`) provides:

1. **Quota Usage Display**: Real-time quota usage for both keys
2. **Current Keys**: Shows masked keys with delete options
3. **Add/Update Form**:
   - Password-style inputs with show/hide toggle
   - Validate button to test keys before saving
   - Visual indicators for validation status
4. **Instructions**: Step-by-step guide to obtain API keys from Google Cloud Console

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
# Generate a secure encryption secret (min 32 characters)
ENCRYPTION_SECRET=$(openssl rand -base64 32)

# Enable user-managed API keys feature
ENABLE_USER_API_KEYS=true
```

### 2. Database Migration

The Prisma schema has been updated. Apply the migration:

```bash
# When database is accessible
npx prisma db push

# Or create and apply migration
npx prisma migrate dev --name add_user_youtube_api_keys
```

### 3. Regenerate Prisma Client

```bash
npx prisma generate
```

## Feature Flag

The feature is controlled by the `ENABLE_USER_API_KEYS` environment variable:

- `false` or not set: Users cannot add their own keys, all requests use system keys
- `true`: Users can optionally add their own keys

This allows gradual rollout and easy disabling if issues arise.

## Security Considerations

1. **Encryption Secret**:

   - Must be at least 32 characters
   - Store securely in environment variables
   - Never commit to version control
   - Changing it will invalidate all stored API keys

2. **API Key Validation**:

   - Keys are validated both client-side (format) and server-side (API test)
   - Only authenticated users can manage their own keys
   - Keys are restricted to YouTube Data API v3 in Google Cloud Console

3. **Rate Limiting**:
   - Consider adding rate limiting to validation endpoint
   - Monitor for abuse of free API key testing

## Quota Management

YouTube Data API quota resets at midnight PST (Pacific Time). The system:

1. Tracks requests per key in `apiKeyQuotaStatus`
2. Marks keys as exhausted when quota exceeded (403 error)
3. Automatically falls back to backup key
4. Prevents further requests until quota resets

Daily quota reset should be implemented as a cron job:

```typescript
// Reset all user quotas at midnight PST
import { prisma } from "@/lib/prisma";

async function resetAllUserQuotas() {
  await prisma.user.updateMany({
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
}
```

## Future Enhancements

1. **Quota Alerts**: Email users when approaching quota limit
2. **Usage Analytics**: Dashboard showing API usage over time
3. **Key Rotation**: Automated reminders to rotate keys periodically
4. **Team Keys**: Share API keys across organization/team
5. **Cost Tracking**: If users upgrade to paid Google Cloud quota
6. **Auto-reset**: Scheduled task to reset quotas daily at midnight PST

## Troubleshooting

### "ENCRYPTION_SECRET environment variable is not set"

Add `ENCRYPTION_SECRET` to your `.env` file:

```bash
ENCRYPTION_SECRET=$(openssl rand -base64 32)
```

### "Failed to decrypt data"

The encryption secret may have changed. Users will need to re-enter their API keys.

### "API key is invalid or not authorized"

Ensure the API key:

1. Is restricted to YouTube Data API v3 in Google Cloud Console
2. Has the YouTube Data API v3 enabled in the project
3. Is copied correctly without extra spaces

### Quota exhausted but it's a new day

Quota resets at midnight PST, not midnight in your timezone. Wait until then or implement the daily reset cron job.

## Testing

To test the feature:

1. Set `ENABLE_USER_API_KEYS=true` in `.env`
2. Navigate to `/profile`
3. Go to "API Keys" tab
4. Create a test API key in Google Cloud Console
5. Paste it in the form and click "Validate Keys"
6. Save the key
7. Try syncing a YouTube source to see it use your key
8. Check quota usage updates in the profile page

## Migration Path

For existing installations:

1. **Phase 1**: Deploy with `ENABLE_USER_API_KEYS=false`
   - New code is deployed but feature is disabled
   - All users continue using system keys
2. **Phase 2**: Enable for beta users
   - Set `ENABLE_USER_API_KEYS=true`
   - Announce feature to subset of users
   - Monitor for issues
3. **Phase 3**: Full rollout
   - Announce to all users
   - Provide migration support
   - Keep system keys as fallback
4. **Phase 4** (Optional): Require user keys
   - Make user API keys mandatory for certain operations
   - Deprecate system keys for user operations
   - Keep system keys only for admin/global features
