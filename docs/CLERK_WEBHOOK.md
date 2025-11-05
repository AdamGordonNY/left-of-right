# Clerk Webhook Setup

This webhook endpoint handles user lifecycle events from Clerk.

## Endpoint

`POST /api/webhooks/clerk`

## Events Handled

- `user.created` - Creates a new user in the database
- `user.updated` - Updates existing user information
- `user.deleted` - Removes user from the database

## Setup Instructions

### 1. Get Your Webhook Secret

1. Go to the [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the left sidebar
3. Click **Add Endpoint**
4. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
5. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Copy the **Signing Secret**

### 2. Add Environment Variable

Add the following to your `.env.local` file:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### 3. Test the Webhook

You can test the webhook using the Clerk Dashboard's webhook testing feature, or by:

1. Creating a new user in your application
2. Updating user information
3. Deleting a user

### 4. Local Development

For local development, you can use a tool like [ngrok](https://ngrok.com/) or [localtunnel](https://localtunnel.github.io/www/) to expose your local server:

```bash
# Using ngrok
ngrok http 3000

# Then use the ngrok URL in Clerk Dashboard
# Example: https://abc123.ngrok.io/api/webhooks/clerk
```

## Security

The webhook verifies the signature of incoming requests using the Svix library to ensure they're coming from Clerk. Requests with invalid signatures are rejected with a 400 error.

## Database Schema

The webhook expects the following User model in your Prisma schema:

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?
  role      String   @default("member")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Troubleshooting

### Missing Headers Error

If you see "Missing svix headers", ensure your webhook is properly configured in the Clerk Dashboard and the request is coming from Clerk.

### Invalid Signature Error

If you see "Invalid webhook signature", verify that:

- Your `CLERK_WEBHOOK_SECRET` is correct
- The secret matches the one in your Clerk Dashboard webhook configuration

### User Not Found Error (on update/delete)

This can happen if the webhook receives an update or delete event for a user that doesn't exist in your database. Ensure user.created events are processed first.
