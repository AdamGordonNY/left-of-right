import { NextRequest, NextResponse } from "next/server";
import {
  followSource,
  unfollowSource,
  getUserFollows,
} from "@/lib/prisma-follows";
import { ensureUserExists } from "@/lib/user-sync";

/**
 * GET /api/follows
 * @description Retrieves all sources the authenticated user is following
 * @access Authenticated users
 * @returns {Promise<NextResponse>} JSON response with follows array
 * @throws {401} If user is not authenticated
 * @throws {500} If database query fails
 */
export async function GET(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const follows = await getUserFollows(dbUserId);

    return NextResponse.json({ follows });
  } catch (error) {
    console.error("Error fetching follows:", error);
    return NextResponse.json(
      { error: "Failed to fetch follows" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/follows
 * @description Creates a follow relationship between user and a source
 * @access Authenticated users
 * @param {NextRequest} request - Request body containing sourceId
 * @returns {Promise<NextResponse>} JSON response with created follow or error
 * @throws {401} If user is not authenticated
 * @throws {400} If sourceId is missing
 * @throws {409} If user already follows this source
 * @throws {500} If follow creation fails
 */
export async function POST(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "Missing required field: sourceId" },
        { status: 400 },
      );
    }

    const follow = await followSource(dbUserId, sourceId);

    return NextResponse.json({ follow }, { status: 201 });
  } catch (error: any) {
    console.error("Error following source:", error);

    // P2002 is Prisma's unique constraint violation error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Already following this source" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to follow source" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/follows
 * @description Removes a follow relationship between user and a source
 * @access Authenticated users
 * @param {NextRequest} request - Query param sourceId required
 * @returns {Promise<NextResponse>} JSON response with success status or error
 * @throws {401} If user is not authenticated
 * @throws {400} If sourceId query param is missing
 * @throws {500} If unfollow fails
 */
export async function DELETE(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "Missing required parameter: source_id" },
        { status: 400 },
      );
    }

    await unfollowSource(dbUserId, sourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing source:", error);
    return NextResponse.json(
      { error: "Failed to unfollow source" },
      { status: 500 },
    );
  }
}
