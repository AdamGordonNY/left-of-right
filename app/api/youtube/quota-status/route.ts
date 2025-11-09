import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/youtube-cache";

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
      { status: 500 }
    );
  }
}
