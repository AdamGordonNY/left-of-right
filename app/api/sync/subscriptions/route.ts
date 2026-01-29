import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { importYouTubeSubscriptions } from "@/lib/subscription-import";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/sync/subscriptions
 * @description Imports user's YouTube subscriptions using their Google OAuth token
 * @access Authenticated users with Google OAuth connection
 * @returns {Promise<NextResponse>} JSON with import results (channelsAdded, channelsLinked, errors)
 * @throws {401} If user is not authenticated
 * @throws {404} If user is not found in database
 * @throws {500} If import fails
 */
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await importYouTubeSubscriptions(userId, dbUser.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to import subscriptions",
          details: result.errors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "YouTube subscriptions imported successfully",
      channelsAdded: result.channelsAdded,
      channelsLinked: result.channelsLinked,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error in subscription sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
