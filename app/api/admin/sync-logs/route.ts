import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/sync-logs
 * @description Retrieves the last 100 sync logs with user information for monitoring
 * @access Admin only
 * @returns {Promise<NextResponse>} JSON array of sync logs ordered by startedAt desc
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

    // Fetch sync logs with user information
    const logs = await prisma.syncLog.findMany({
      select: {
        id: true,
        userId: true,
        sourceId: true,
        sourceName: true,
        syncType: true,
        status: true,
        videosAdded: true,
        videosFailed: true,
        totalProcessed: true,
        errorMessage: true,
        failedVideos: true,
        metadata: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 100, // Limit to last 100 syncs
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching sync logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
