import { NextRequest, NextResponse } from "next/server";
import { getUserId, getUserRole } from "@/lib/auth";
import { getSourceById } from "@/lib/prisma-sources";
import { removeCategoryFromSource } from "@/lib/prisma-categories";

/**
 * DELETE /api/sources/[id]/categories/[categoryId]
 * Remove a category from a source
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sourceId, categoryId } = await params;

    const source = await getSourceById(sourceId);
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const userRole = await getUserRole();
    const canUpdate =
      source.createdByUserId === userId ||
      (source.isGlobal && userRole === "admin");

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await removeCategoryFromSource(sourceId, categoryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing category from source:", error);
    return NextResponse.json(
      { error: "Failed to remove category from source" },
      { status: 500 }
    );
  }
}
