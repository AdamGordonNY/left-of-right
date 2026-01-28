import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "./database.types";
import { prisma } from "./prisma";

// Get the current Clerk user object (can be null when not signed in)
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

// Return the current Clerk user ID or null when unauthenticated
export async function getUserId() {
  const { userId } = await auth();
  return userId;
}

// Ensure the request is authenticated, throwing if no user is present
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

// Look up the user's role from the database; default to member when missing
export async function getUserRole(): Promise<UserRole> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return "member";
  }

  // Get role from database instead of Clerk metadata
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { role: true },
  });

  return (dbUser?.role as UserRole) || "member";
}

// Check if the current user has the admin role
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

// Require admin access, throwing if the user is not an admin
export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Admin access required");
  }
  return true;
}

// Map Clerk user IDs directly to Supabase user IDs (identity match)
export function getSupabaseUserId(clerkUserId: string): string {
  return clerkUserId;
}
