import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";
import { createSource } from "@/lib/prisma-sources";
import { ensureUserExists } from "@/lib/user-sync";
import { getChannelIdFromUrl, getChannelInfo } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, url, description, avatarUrl, isGlobal, fetchMetadata } =
      body;

    if (!type || !url) {
      return NextResponse.json(
        { error: "Missing required fields: type, url" },
        { status: 400 }
      );
    }

    if (type !== "youtube" && type !== "substack") {
      return NextResponse.json(
        { error: "Invalid type. Must be youtube or substack" },
        { status: 400 }
      );
    }

    const userRole = await getUserRole();
    const shouldBeGlobal = isGlobal && userRole === "admin";

    // Auto-fetch metadata if requested or if name is not provided
    let finalName = name;
    let finalDescription = description;
    let finalAvatarUrl = avatarUrl;

    if (
      type === "youtube" &&
      process.env.YOUTUBE_API_KEY &&
      (fetchMetadata || !name)
    ) {
      try {
        const channelId = await getChannelIdFromUrl(url);
        if (channelId) {
          const channelInfo = await getChannelInfo(channelId);
          if (channelInfo) {
            finalName = name || channelInfo.title; // Use user's name if provided, otherwise channel's
            finalDescription = description || channelInfo.description;
            finalAvatarUrl = channelInfo.thumbnailUrl; // Always use channel avatar
          }
        }
      } catch (error) {
        console.warn("Failed to fetch YouTube channel info:", error);
        // Continue with user-provided data
      }
    }

    // Fallback name if still not set
    if (!finalName) {
      // Extract a name from the URL as last resort
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        finalName =
          pathParts[pathParts.length - 1].replace(/[@_-]/g, " ").trim() ||
          "Unnamed Source";
      } catch {
        finalName = "Unnamed Source";
      }
    }

    const source = await createSource({
      name: finalName,
      type,
      url,
      description: finalDescription,
      avatarUrl: finalAvatarUrl,
      createdByUserId: dbUserId,
      isGlobal: shouldBeGlobal,
      isActive: true,
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error("Error creating source:", error);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
