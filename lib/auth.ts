import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "./database.types";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

export async function getUserId() {
  const { userId } = await auth();
  return userId;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

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

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Admin access required");
  }
  return true;
}

export function getSupabaseUserId(clerkUserId: string): string {
  return clerkUserId;
}
