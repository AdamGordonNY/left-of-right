import { prisma } from "./prisma";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Ensures a user exists in the database by syncing from Clerk
 * Creates the user if they don't exist
 * Returns the database user ID
 */
export async function ensureUserExists(): Promise<string | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  );

  if (!primaryEmail?.emailAddress) {
    throw new Error("No primary email address found");
  }

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  // If user doesn't exist, create them
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: primaryEmail.emailAddress,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        imageUrl: clerkUser.imageUrl || null,
        role: "member",
      },
      select: { id: true },
    });
  }

  return user.id;
}

/**
 * Gets the database user ID from a Clerk user ID
 */
export async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  return user?.id || null;
}
