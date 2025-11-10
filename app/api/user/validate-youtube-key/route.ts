import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { validateYouTubeApiKey } from "@/lib/encryption";

// POST /api/user/validate-youtube-key - Validate YouTube API keys
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { primaryKey, backupKey } = body;

    const result: {
      primary?: { valid: boolean; message: string };
      backup?: { valid: boolean; message: string };
    } = {};

    // Validate primary key
    if (primaryKey) {
      if (!validateYouTubeApiKey(primaryKey)) {
        result.primary = {
          valid: false,
          message:
            "Invalid API key format. YouTube API keys are typically 39 characters.",
        };
      } else {
        // Test the key by making a simple API call
        try {
          const youtube = google.youtube({
            version: "v3",
            auth: primaryKey.trim(),
          });

          // Try to get a channel (use a known popular channel to test)
          await youtube.channels.list({
            part: ["id"],
            id: ["UCuAXFkgsw1L7xaCfnd5JJOw"], // Random YouTube channel
            maxResults: 1,
          });

          result.primary = {
            valid: true,
            message: "API key is valid and working",
          };
        } catch (error: any) {
          console.error("[Validation] Primary key validation error:", error);

          if (error.code === 403) {
            result.primary = {
              valid: false,
              message:
                "API key is invalid or not authorized for YouTube Data API v3",
            };
          } else if (error.code === 400) {
            result.primary = {
              valid: false,
              message: "Invalid API key",
            };
          } else {
            result.primary = {
              valid: false,
              message: `Validation failed: ${error.message}`,
            };
          }
        }
      }
    }

    // Validate backup key
    if (backupKey) {
      if (!validateYouTubeApiKey(backupKey)) {
        result.backup = {
          valid: false,
          message:
            "Invalid API key format. YouTube API keys are typically 39 characters.",
        };
      } else {
        try {
          const youtube = google.youtube({
            version: "v3",
            auth: backupKey.trim(),
          });

          await youtube.channels.list({
            part: ["id"],
            id: ["UCuAXFkgsw1L7xaCfnd5JJOw"],
            maxResults: 1,
          });

          result.backup = {
            valid: true,
            message: "Backup API key is valid and working",
          };
        } catch (error: any) {
          console.error("[Validation] Backup key validation error:", error);

          if (error.code === 403) {
            result.backup = {
              valid: false,
              message:
                "API key is invalid or not authorized for YouTube Data API v3",
            };
          } else if (error.code === 400) {
            result.backup = {
              valid: false,
              message: "Invalid API key",
            };
          } else {
            result.backup = {
              valid: false,
              message: `Validation failed: ${error.message}`,
            };
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error validating API keys:", error);
    return NextResponse.json(
      { error: "Failed to validate API keys" },
      { status: 500 }
    );
  }
}
