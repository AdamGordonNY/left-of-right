# Environment Configuration for User API Keys

## Required Environment Variables

Add these to your `.env` file:

```bash
# API Key Encryption Secret (REQUIRED)
# Generate with: openssl rand -base64 32
ENCRYPTION_SECRET=Y/gjVmzUVlbbDXrkXBEYMy8iUhBazfAMZQVEuCOgIP8=

# Enable User-Managed API Keys Feature
ENABLE_USER_API_KEYS=true

# Cron Job Secret (for daily quota reset)
# Generate with: openssl rand -base64 32
CRON_SECRET=your_cron_secret_here
```

## Setup Steps

### 1. Generate Encryption Secret

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env` file as `ENCRYPTION_SECRET`.

### 2. Enable Feature Flag

Set `ENABLE_USER_API_KEYS=true` in your `.env` file to enable the user API keys feature.

### 3. Generate Cron Secret

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env` file as `CRON_SECRET`.

### 4. Configure Vercel Cron Job (Production)

In your Vercel project settings:

1. Go to **Settings** → **Cron Jobs**
2. Click **Create Cron Job**
3. Configure:
   - **Schedule**: `0 8 * * *` (runs at midnight PST / 8am UTC)
   - **Path**: `/api/cron/reset-quotas`
   - **Method**: POST
4. Add environment variable:
   - **Key**: `CRON_SECRET`
   - **Value**: The same value from your `.env` file

### 5. Test Cron Job

You can test the cron job locally:

```bash
curl -X POST http://localhost:3000/api/cron/reset-quotas \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or get status:

```bash
curl -X GET http://localhost:3000/api/cron/reset-quotas \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Security Notes

- **Never commit** `.env` files to version control
- **ENCRYPTION_SECRET**: If you change this, all stored API keys will become unreadable
- **CRON_SECRET**: Keep this secret to prevent unauthorized quota resets
- Use different secrets for development and production

## Troubleshooting

### "ENCRYPTION_SECRET environment variable is not set"

Make sure you've added `ENCRYPTION_SECRET` to your `.env` file with a value of at least 32 characters.

### "Failed to decrypt data"

The encryption secret may have changed. Users will need to re-enter their API keys.

### Feature not working

Ensure `ENABLE_USER_API_KEYS=true` is set in your environment variables.
