import { NextRequest, NextResponse } from "next/server";
import { getUserId, getUserRole } from "@/lib/auth";
import { getSourceById } from "@/lib/prisma-sources";
import {
  getSourceCategories,
  addCategoryToSource,
  removeCategoryFromSource,
} from "@/lib/prisma-categories";

/**
 * GET /api/sources/[id]/categories
 * @description Retrieves all categories assigned to a specific source
 * @access Public
 * @param {NextRequest} request - The incoming request
 * @param {object} params - Route params containing source id
 * @returns {Promise<NextResponse>} JSON with categories array
 * @throws {500} If database query fails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sourceCategories = await getSourceCategories(id);

    return NextResponse.json({
      categories: sourceCategories.map((sc) => sc.category),
    });
  } catch (error) {
    console.error("Error fetching source categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch source categories" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sources/[id]/categories
 * @description Assigns a category to a source
 * @access Source owner or admin (for global sources)
 * @param {NextRequest} request - Request body with categoryId
 * @param {object} params - Route params containing source id
 * @returns {Promise<NextResponse>} JSON with created sourceCategory relation
 * @throws {401} If user is not authenticated
 * @throws {400} If categoryId is missing
 * @throws {403} If user lacks permission to modify the source
 * @throws {404} If source is not found
 * @throws {409} If category is already assigned to this source
 * @throws {500} If operation fails
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sourceId } = await params;
    const body = await request.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

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

    const sourceCategory = await addCategoryToSource(sourceId, categoryId);

    return NextResponse.json({ sourceCategory }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding category to source:", error);

    // Handle unique constraint violations (category already added)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category already added to this source" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to add category to source" },
      { status: 500 },
    );
  }
}
