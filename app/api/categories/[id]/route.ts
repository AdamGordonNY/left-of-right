import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";
import {
  getCategoryById,
  getCategoryByIdWithSources,
  updateCategory,
  deleteCategory,
} from "@/lib/prisma-categories";

/**
 * GET /api/categories/[id]
 * @description Retrieves a category by ID, optionally with its assigned sources
 * @access Public
 * @param {NextRequest} request - Query param includeSources=true to include sources
 * @param {object} params - Route params containing category id
 * @returns {Promise<NextResponse>} JSON with category data
 * @throws {404} If category is not found
 * @throws {500} If database query fails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeSources = searchParams.get("includeSources") === "true";

    const category = includeSources
      ? await getCategoryByIdWithSources(id)
      : await getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/categories/[id]
 * @description Updates a category's properties (name, slug, description, color, icon)
 * @access Admin only
 * @param {NextRequest} request - Request body with fields to update
 * @param {object} params - Route params containing category id
 * @returns {Promise<NextResponse>} JSON with updated category
 * @throws {403} If user is not an admin
 * @throws {404} If category is not found
 * @throws {409} If updated name or slug conflicts with existing category
 * @throws {500} If update fails
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userRole = await getUserRole();
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, color, icon } = body;

    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const updatedCategory = await updateCategory(id, {
      name,
      slug,
      description,
      color,
      icon,
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error: any) {
    console.error("Error updating category:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category with this name or slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * @description Deletes a category (removes all source associations)
 * @access Admin only
 * @param {NextRequest} request - The incoming request
 * @param {object} params - Route params containing category id
 * @returns {Promise<NextResponse>} JSON with success status
 * @throws {403} If user is not an admin
 * @throws {404} If category is not found
 * @throws {500} If deletion fails
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userRole = await getUserRole();
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    await deleteCategory(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
