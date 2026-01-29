import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

/**
 * GET /api/debug/auth
 * @description Debug endpoint to check current authentication state
 * @access Public (for debugging purposes)
 * @returns {Promise<NextResponse>} JSON with hasUser, userId, and email fields
 * @throws {500} If auth check fails
 */
export async function GET() {
  try {
    const user = await currentUser();

    return NextResponse.json({
      hasUser: !!user,
      userId: user?.id || null,
      email: user?.emailAddresses[0]?.emailAddress || null,
    });
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
