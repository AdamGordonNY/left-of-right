import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  encrypt,
  decrypt,
  maskApiKey,
  validateYouTubeApiKey,
} from "@/lib/encryption";

/**
 * GET /api/user/api-keys
 * @description Retrieves user's YouTube API key information with masked values
 * @access Authenticated users
 * @returns {Promise<NextResponse>} JSON with hasPrimaryKey, hasBackupKey, masked keys, and quota status
 * @throws {401} If user is not authenticated
 * @throws {404} If user is not found
 * @throws {500} If retrieval fails
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        youtubeApiKey: true,
        youtubeApiKeyBackup: true,
        apiKeyCreatedAt: true,
        apiKeyLastUsed: true,
        apiKeyQuotaStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return masked keys and metadata
    const response = {
      hasPrimaryKey: !!user.youtubeApiKey,
      hasBackupKey: !!user.youtubeApiKeyBackup,
      maskedPrimaryKey: user.youtubeApiKey
        ? maskApiKey(decrypt(user.youtubeApiKey))
        : undefined,
      maskedBackupKey: user.youtubeApiKeyBackup
        ? maskApiKey(decrypt(user.youtubeApiKeyBackup))
        : undefined,
      apiKeyCreatedAt: user.apiKeyCreatedAt?.toISOString(),
      apiKeyLastUsed: user.apiKeyLastUsed?.toISOString(),
      quotaStatus: user.apiKeyQuotaStatus || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] Error getting API keys:", error);
    return NextResponse.json(
      { error: "Failed to get API keys" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/user/api-keys
 * @description Saves or updates user's YouTube API keys (encrypted before storage)
 * @access Authenticated users
 * @param {NextRequest} request - Request body with primaryKey and/or backupKey
 * @returns {Promise<NextResponse>} JSON with success status and message
 * @throws {401} If user is not authenticated
 * @throws {400} If no keys provided or key format is invalid
 * @throws {404} If user is not found
 * @throws {500} If save fails
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { primaryKey, backupKey } = body;

    // Validate at least one key is provided
    if (!primaryKey && !backupKey) {
      return NextResponse.json(
        { error: "At least one API key must be provided" },
        { status: 400 },
      );
    }

    // Validate key formats
    if (primaryKey && !validateYouTubeApiKey(primaryKey)) {
      return NextResponse.json(
        { error: "Invalid primary API key format" },
        { status: 400 },
      );
    }

    if (backupKey && !validateYouTubeApiKey(backupKey)) {
      return NextResponse.json(
        { error: "Invalid backup API key format" },
        { status: 400 },
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Encrypt keys before storing
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (primaryKey) {
      updateData.youtubeApiKey = encrypt(primaryKey.trim());

      // Initialize quota status if not exists
      if (!user.apiKeyCreatedAt) {
        updateData.apiKeyCreatedAt = new Date();
        updateData.apiKeyQuotaStatus = {
          primary: {
            requestsToday: 0,
            isExhausted: false,
          },
          backup: {
            requestsToday: 0,
            isExhausted: false,
          },
        };
      }
    }

    if (backupKey) {
      updateData.youtubeApiKeyBackup = encrypt(backupKey.trim());
    }

    // Update user in database
    await prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "API keys saved successfully",
    });
  } catch (error) {
    console.error("[API] Error saving API keys:", error);
    return NextResponse.json(
      { error: "Failed to save API keys" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/user/api-keys
 * @description Deletes a user's YouTube API key (primary or backup)
 * @access Authenticated users
 * @param {NextRequest} request - Query param type=primary|backup required
 * @returns {Promise<NextResponse>} JSON with success status and message
 * @throws {401} If user is not authenticated
 * @throws {400} If type param is missing or invalid
 * @throws {500} If deletion fails
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || (type !== "primary" && type !== "backup")) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "primary" or "backup"' },
        { status: 400 },
      );
    }

    // Update user in database
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (type === "primary") {
      updateData.youtubeApiKey = null;
      // Reset quota status when deleting primary key
      updateData.apiKeyQuotaStatus = null;
      updateData.apiKeyCreatedAt = null;
      updateData.apiKeyLastUsed = null;
    } else {
      updateData.youtubeApiKeyBackup = null;
    }

    await prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${type} API key deleted successfully`,
    });
  } catch (error) {
    console.error("[API] Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 },
    );
  }
}
