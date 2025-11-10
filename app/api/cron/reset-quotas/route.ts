import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cron/reset-quotas
 * Resets all user YouTube API quota counters
 * Should be called daily at midnight PST (8am UTC)
 *
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET environment variable not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting quota reset job...");

    // Get all users with API keys
    const usersWithKeys = await prisma.user.findMany({
      where: {
        NOT: {
          youtubeApiKey: null,
        },
      },
      select: {
        id: true,
      },
    });

    // Reset quota for each user
    const resetPromises = usersWithKeys.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          apiKeyQuotaStatus: {
            primary: { requestsToday: 0, isExhausted: false },
            backup: { requestsToday: 0, isExhausted: false },
          },
        },
      })
    );

    await Promise.all(resetPromises);
    const result = { count: usersWithKeys.length };

    console.log(`[Cron] Reset quota for ${result.count} users`);

    return NextResponse.json({
      success: true,
      resetCount: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error resetting quotas:", error);
    return NextResponse.json(
      { error: "Failed to reset quotas" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/reset-quotas
 * Get information about the cron job
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count users with API keys configured
    const usersWithKeys = await prisma.user.count({
      where: {
        NOT: {
          youtubeApiKey: null,
        },
      },
    });

    // Get users with exhausted quotas
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          youtubeApiKey: null,
        },
      },
      select: {
        id: true,
        email: true,
        apiKeyQuotaStatus: true,
      },
    });

    const exhaustedCount = users.filter((user: any) => {
      const status = user.apiKeyQuotaStatus as any;
      return status?.primary?.isExhausted || status?.backup?.isExhausted;
    }).length;

    return NextResponse.json({
      usersWithKeys,
      exhaustedCount,
      nextResetTime: "Midnight PST (8:00 AM UTC)",
      cronSchedule: "0 8 * * *",
    });
  } catch (error) {
    console.error("[Cron] Error getting cron info:", error);
    return NextResponse.json(
      { error: "Failed to get cron info" },
      { status: 500 }
    );
  }
}
