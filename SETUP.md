# Content Hub Setup Guide

This guide will help you set up and configure your Content Hub application with Clerk authentication and Prisma/Supabase database.

## Prerequisites

- Node.js 18+ installed
- A Clerk account (free tier available)
- A Supabase project with PostgreSQL database (already configured)

## Step 1: Clerk Authentication Setup

### Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign up or log in to your account
3. Click "Add application" or select an existing application
4. Choose your authentication methods (Email/Password is recommended)
5. Navigate to **API Keys** in the left sidebar

### Get Your Clerk Keys

You'll need two keys:
- **Publishable Key**: Starts with `pk_test_` or `pk_live_`
- **Secret Key**: Starts with `sk_test_` or `sk_live_`

### Update Environment Variables

Open `.env` file and replace the placeholder values:

```env
# Replace these with your actual Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

## Step 2: Configure User Roles in Clerk

To enable admin functionality, you need to set user roles in Clerk:

### Method 1: Using Clerk Dashboard (Recommended)

1. Go to your Clerk Dashboard
2. Navigate to **Users** in the left sidebar
3. Click on a user you want to make an admin
4. Scroll to **Public Metadata** section
5. Click "Edit"
6. Add the following JSON:
   ```json
   {
     "role": "admin"
   }
   ```
7. Save changes

### Method 2: Using Clerk API

You can also set roles programmatically using the Clerk Backend API:

```javascript
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: "admin"
  }
});
```

## Step 3: Database Setup with Prisma

The application uses Prisma as the ORM to connect to your Supabase PostgreSQL database.

### Database Schema

The Prisma schema includes:

- **User** table: Stores user information from Clerk with roles
- **Source** table: Stores YouTube channels and Substack authors
- **ContentItem** table: Stores individual videos and articles
- **UserFollow** table: Tracks which sources each user follows

### Push Database Schema

Run Prisma migrations to create the database tables:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### Verify Database Tables

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor**
4. Verify these tables exist:
   - `User`
   - `Source`
   - `ContentItem`
   - `UserFollow`

## Step 4: Install Dependencies and Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Step 5: Test the Application

### As a Regular User (Member)

1. Click "Sign In" and create a new account
2. You'll be redirected to "My Sources"
3. Click "Add Source" to add a YouTube channel or Substack author
4. Personal sources are only visible to you
5. Follow sources by clicking the "Follow" button
6. Your feed will show content only from sources you follow

### As an Admin

1. Sign in with the account you set as admin
2. You'll see an "Admin" button in the header
3. Click "Admin" to access the admin dashboard
4. When adding sources, you can toggle "Global Source"
5. Global sources are automatically available to all users
6. Manage global sources from the admin panel

## Features Overview

### User Roles

- **Member** (default): Can add personal sources and follow any available source
- **Admin**: Can create global sources that are available to all users

### Source Management

- **Personal Sources**: Added by individual users, only visible to them
- **Global Sources**: Added by admins, automatically available to everyone
- **Follow System**: Users can follow/unfollow any source they have access to

### Content Discovery

- **Algorithm-Free**: Content is shown chronologically from followed sources
- **Personalized Feed**: Users only see content from sources they choose to follow
- **No Recommendations**: Pure subscription-based content without algorithmic suggestions

## Troubleshooting

### Build Errors

If you see Clerk-related errors during build:
- Verify your `.env` file has valid Clerk keys
- Ensure keys are not wrapped in quotes
- Restart the development server after updating `.env`

### Database Connection Issues

If you can't connect to the database:
- Check that your `DIRECT_URL` is correct in `.env`
- Verify your Supabase project is active
- Run `npx prisma db push` to ensure tables are created
- Check Prisma client is generated with `npx prisma generate`

### Admin Access Not Working

If admin features aren't showing:
- Verify you set `"role": "admin"` in Clerk's Public Metadata
- Sign out and sign back in to refresh the user session
- Check browser console for any errors

## Architecture

### Authentication Flow

1. User signs in via Clerk
2. Clerk provides a user ID and metadata (including role)
3. User ID is used as the foreign key in Prisma/database tables
4. Role metadata determines access to admin features

### Database Architecture

- **Prisma ORM** handles all database operations
- Users can only access sources they created or global sources
- Admin role is checked via Clerk user metadata
- Follow relationships are user-specific with unique constraints
- Foreign key constraints ensure data integrity

## Next Steps

1. **Add Content**: Manually add content items for your sources, or integrate with YouTube/Substack APIs
2. **Customize UI**: Modify components in `/components` directory
3. **Add Features**: Implement content fetching, notifications, search, etc.
4. **Deploy**: Deploy to Vercel, Netlify, or your preferred platform

## Support

For issues or questions:
- Check the [Clerk Documentation](https://clerk.com/docs)
- Review [Prisma Documentation](https://www.prisma.io/docs)
- Review [Supabase Documentation](https://supabase.com/docs)
- Check [Next.js Documentation](https://nextjs.org/docs)

## Security Notes

- Never commit `.env` file to version control
- Keep your Clerk Secret Key private
- Rotate API keys if they are accidentally exposed
- Enable MFA for admin accounts in Clerk
