import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/youtube-cache";

/**
 * GET /api/youtube/quota-status
 * @description Retrieves the current YouTube API quota status for primary and backup keys
 * @access Public
 * @returns {Promise<NextResponse>} JSON with quota status for both keys and allExhausted flag
 * @throws {500} If quota status retrieval fails
 */
export async function GET() {
  try {
    const status = await getQuotaStatus();

    return NextResponse.json({
      success: true,
      primary: {
        isExhausted: status.primary.isExhausted,
        resetAt: status.primary.resetAt,
      },
      backup: {
        isExhausted: status.backup.isExhausted,
        resetAt: status.backup.resetAt,
      },
      allExhausted: status.primary.isExhausted && status.backup.isExhausted,
    });
  } catch (error) {
    console.error("Error fetching quota status:", error);
    return NextResponse.json(
      { error: "Failed to fetch quota status" },
      { status: 500 },
    );
  }
}
