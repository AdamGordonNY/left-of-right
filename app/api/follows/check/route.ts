import { NextRequest, NextResponse } from "next/server";
import { isFollowingSource } from "@/lib/prisma-follows";
import { ensureUserExists } from "@/lib/user-sync";

/**
 * GET /api/follows/check
 * @description Checks if the authenticated user is following a specific source
 * @access Public (returns false for unauthenticated users)
 * @param {NextRequest} request - Query param sourceId required
 * @returns {Promise<NextResponse>} JSON response with isFollowing boolean
 * @throws {400} If sourceId query param is missing
 * @throws {500} If check fails
 */
export async function GET(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();

    if (!dbUserId) {
      return NextResponse.json({ isFollowing: false }, { status: 200 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 },
      );
    }

    const isFollowing = await isFollowingSource(dbUserId, sourceId);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 },
    );
  }
}
