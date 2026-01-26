# Copilot Instructions for Left-of-Right Content Hub

## Architecture Overview

Next.js 15 app with App Router, Clerk auth, Prisma ORM (PostgreSQL/Supabase), and YouTube API integration. Three-tier architecture: server actions, database layer, client components.

## Critical Patterns

### Server Actions & Client Components

- **Server actions** (`actions/*.actions.ts`): Start with `"use server"`, handle auth, database writes, revalidation
- **Client components**: Mark with `"use client"` when using hooks, event handlers, or React state
- All mutations go through server actions, never direct API calls from client components
- Call `revalidatePath()` after database mutations to update cached pages

### Authentication & Authorization

- Use Clerk for auth: `auth()` for userId in server actions, `currentUser()` for full user object
- Database users sync via webhook at `/api/webhooks/clerk` (requires `CLERK_WEBHOOK_SECRET`)
- Roles stored in database (`User.role`), NOT Clerk metadata
- Helper pattern: `ensureUserExists()` from `lib/user-sync.ts` creates/syncs users on-demand
- Authorization utilities in `lib/auth.ts`: `requireAuth()`, `requireAdmin()`, `getUserRole()`

### Database Patterns (Prisma)

- **Always** use `@/lib/prisma` singleton, never instantiate new clients
- Relation pattern: `include` for eager loading, `select` to minimize data transfer
- Helper files organize queries: `lib/prisma-{categories,follows,sources}.ts`
- User references: Store `clerkId` (string), use `lib/user-sync.ts` to get database `id`
- Many-to-many via join tables: `UserFollow`, `SourceCategory`, `PlaylistItem`

### YouTube API Quota System

- **Critical**: Use `lib/youtube-client-nextjs.ts` (YouTubeClientManager) for all YouTube API calls
- Automatic failover: primary key → backup key → cached data
- Caching in Supabase: channel info (24h), videos (30min), playlists (2h)
- User API keys: Encrypted in database with `lib/encryption.ts` (requires `ENCRYPTION_SECRET`)
- Quota tracking: `youtube_quota_logs`, `youtube_quota_status`, `youtube_cache` tables
- Handle `QuotaExhaustedError` in client components using `hooks/use-quota-error.ts`

### Source Categorization

- Many-to-many: Source ↔ SourceCategory ↔ Category
- Categories have: name, slug (URL-friendly), color, icon
- API: `/api/categories` (CRUD), `/api/sources/[id]/categories` (assignment)
- Seed categories: `npm run seed:categories` using `scripts/seed-categories.ts`

### Data Flow Examples

```typescript
// Server Action Pattern (actions/sync.actions.ts)
"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncYouTubeSource(sourceId: string) {
  const { userId } = await auth(); // Get Clerk user
  if (!userId) throw new Error("Unauthorized");

  // ... database operations ...

  revalidatePath("/my-sources"); // Invalidate cache
  return { success: true };
}

// Client Component Pattern (components/sources/sync-button.tsx)
("use client");
import { syncYouTubeSource } from "@/actions/sync.actions";

export function SyncButton({ sourceId }: { sourceId: string }) {
  const handleSync = async () => {
    const result = await syncYouTubeSource(sourceId);
    // Handle result
  };
  // ... rest of component
}
```

## Development Workflows

### Setup & Build

```bash
npm install                    # Install dependencies
npx prisma generate           # Generate Prisma client (auto-runs on postinstall)
npx prisma db push            # Push schema changes to database
npm run seed:categories       # Seed categories
npm run dev                   # Start dev server (localhost:3000)
npm run build                 # Production build
```

### Required Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database (Supabase)
DATABASE_URL=postgresql://...          # Connection pooler
DIRECT_URL=postgresql://...            # Direct connection

# YouTube API
YOUTUBE_API_KEY=AIza...                # Primary key
YOUTUBE_BACKUP_KEY=AIza...             # Backup key (optional)

# Encryption
ENCRYPTION_SECRET=<32+ char string>    # For user API key encryption
```

### Database Migrations

- Never edit Prisma schema without running `npx prisma db push`
- For production: Use `npx prisma migrate dev` to create migration files
- Check migration status: `npx prisma migrate status`

## File Organization Conventions

### Routing & Components

- Pages: `app/[route]/page.tsx` (Server Components by default)
- API routes: `app/api/[endpoint]/route.ts`
- Components: Organized by feature in `components/{feature}/*.tsx`
- UI primitives: `components/ui/*.tsx` (shadcn/ui components)

### Import Aliases

- `@/` resolves to project root (configured in `tsconfig.json`)
- Pattern: `import { Button } from "@/components/ui/button"`
- Always use `@/` imports, never relative paths across features

### Styling

- Tailwind CSS with `cn()` utility from `lib/utils.ts` for conditional classes
- Component variants: Use `class-variance-authority` (see `components/ui/button.tsx`)
- Theme: Managed by `components/providers/theme-provider.tsx` (light/dark/system)

## Common Pitfalls

1. **Middleware**: Protected routes handled in `middleware.ts` - use `createRouteMatcher()` for public routes
2. **YouTube sync errors**: Always log to `SyncLog` table with `failedVideos` array for debugging
3. **User IDs**: Clerk's `userId` (string) ≠ database `User.id` - use `ensureUserExists()` to convert
4. **Encryption**: User API keys MUST be encrypted before storing - use `encrypt()`/`decrypt()` from `lib/encryption.ts`
5. **Cache invalidation**: Missing `revalidatePath()` after mutations causes stale data
6. **ESLint ignored**: `next.config.js` has `ignoreDuringBuilds: true` - run `npm run lint` manually

## Key Files Reference

- Database schema: [prisma/schema.prisma](prisma/schema.prisma)
- Auth helpers: [lib/auth.ts](lib/auth.ts), [lib/user-sync.ts](lib/user-sync.ts)
- YouTube integration: [lib/youtube-client-nextjs.ts](lib/youtube-client-nextjs.ts), [lib/youtube-cache-nextjs.ts](lib/youtube-cache-nextjs.ts)
- Main layout: [app/layout.tsx](app/layout.tsx) (ClerkProvider, ThemeProvider)
- Setup docs: [docs/SETUP.md](docs/SETUP.md), [docs/YOUTUBE_QUOTA_MANAGEMENT.md](docs/YOUTUBE_QUOTA_MANAGEMENT.md)
