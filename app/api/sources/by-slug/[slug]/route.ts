import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getSourceBySlug } from "@/lib/slug-utils";
import { prisma } from "@/lib/prisma";
import {
  getContentItemsBySource,
  getPlaylistsBySource,
  getPlaylistCount,
} from "@/lib/prisma-sources";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const clerkUserId = await getUserId();

    // Convert Clerk user ID to database user ID
    let dbUserId: string | undefined = undefined;
    if (clerkUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
      dbUserId = dbUser?.id;
    }

    const source = await getSourceBySlug(slug, dbUserId);

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const isYoutube = source.type === "youtube";

    const [contentItems, playlists, playlistCount] = await Promise.all([
      getContentItemsBySource(source.id),
      isYoutube ? getPlaylistsBySource(source.id) : Promise.resolve([]),
      isYoutube ? getPlaylistCount(source.id) : Promise.resolve(0),
    ]);

    return NextResponse.json({
      source,
      contentItems,
      playlists,
      playlistCount,
    });
  } catch (error) {
    console.error("Error fetching source by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}
