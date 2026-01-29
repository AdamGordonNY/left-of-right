import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * @description Retrieves all users with their follows and API key status
 * @access Admin only
 * @returns {Promise<NextResponse>} JSON array of users with transformed data (hasApiKey instead of actual key)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {500} If database query fails
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users with their follows
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        youtubeApiKey: true,
        createdAt: true,
        follows: {
          select: {
            id: true,
            sourceId: true,
            source: {
              select: {
                id: true,
                name: true,
                type: true,
                isGlobal: true,
              },
            },
          },
          orderBy: {
            source: {
              name: "asc",
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include hasApiKey boolean instead of actual key
    const transformedUsers = users.map((user) => ({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      role: user.role,
      hasApiKey: !!user.youtubeApiKey,
      createdAt: user.createdAt.toISOString(),
      follows: user.follows,
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
