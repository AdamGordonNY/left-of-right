# Fixing "Category is not a type" Error on Vercel

## Problem

When deploying to Vercel, you get an error:
```
Category is not a type
```

But locally everything works fine.

## Root Cause

**Vercel doesn't automatically generate the Prisma Client during builds.**

When you run `npx prisma db push` locally, it generates the Prisma Client with all your models including `Category`. However, Vercel only runs `npm install` and `npm run build` - it doesn't know to generate the Prisma Client unless you tell it to.

## Solution

Add a `postinstall` script to `package.json` that runs `prisma generate`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures that:
1. When Vercel runs `npm install`, the `postinstall` script automatically runs
2. Prisma Client is generated with all your types (User, Source, Category, etc.)
3. TypeScript can find the `Category` type from `@prisma/client`

## How It Works

**Local Development:**
- You run `npx prisma db push` → Generates Prisma Client
- You run `npm run dev` → Uses the generated client

**Vercel Deployment:**
- Vercel runs `npm install` → Triggers `postinstall` → Generates Prisma Client
- Vercel runs `npm run build` → Uses the generated client
- ✅ Build succeeds with all types available

## Verification

After pushing this change to GitHub, Vercel will:
1. Pull your latest code
2. Run `npm install` (which triggers `prisma generate`)
3. Run `npm run build` (which now has access to all Prisma types)
4. ✅ Deploy successfully

## Additional Notes

### Why `@prisma/client` is in devDependencies

You might notice `@prisma/client` is in `devDependencies` instead of `dependencies`. This is actually fine because:
- Vercel installs devDependencies during build
- The generated client is bundled into your production build
- The package itself doesn't need to be in the production node_modules

### Alternative Approaches

If you prefer, you could also:

1. **Use a prebuild script:**
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build"
     }
   }
   ```

2. **Use Vercel build command override:**
   In Vercel dashboard: Settings → Build & Development Settings → Build Command
   ```bash
   prisma generate && npm run build
   ```

However, `postinstall` is the recommended approach because:
- It runs automatically whenever dependencies are installed
- It works in all environments (local, CI, Vercel, etc.)
- It's the official Prisma recommendation

## Common Issues

**Error: "Environment variable not found: DATABASE_URL"**
- Make sure your environment variables are set in Vercel
- Go to Settings → Environment Variables
- Add `DATABASE_URL` and any other required variables

**Error: "Can't reach database server"**
- Your database might not be accessible from Vercel's servers
- Check your database firewall settings
- For Supabase: Enable connection pooling and use the pooled connection string

**Error: "Prisma Client not found"**
- Clear Vercel cache: Settings → Functions → Clear All
- Force a new deployment

## Summary

✅ **Fixed:** Added `"postinstall": "prisma generate"` to package.json
✅ **Result:** Vercel will now generate Prisma Client during builds
✅ **Outcome:** Category type and all other Prisma types will be available
