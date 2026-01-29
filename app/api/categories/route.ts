import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";
import {
  getCategories,
  getCategoriesWithCounts,
  createCategory,
} from "@/lib/prisma-categories";

/**
 * GET /api/categories
 * @description Retrieves all categories, optionally with source counts
 * @access Public
 * @param {NextRequest} request - Query param withCounts=true to include source counts
 * @returns {Promise<NextResponse>} JSON with categories array
 * @throws {500} If database query fails
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withCounts = searchParams.get("withCounts") === "true";

    const categories = withCounts
      ? await getCategoriesWithCounts()
      : await getCategories();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/categories
 * @description Creates a new category with name, slug, description, color, and icon
 * @access Admin only
 * @param {NextRequest} request - Request body with name, slug (required), and optional fields
 * @returns {Promise<NextResponse>} JSON with created category
 * @throws {403} If user is not an admin
 * @throws {400} If name or slug is missing
 * @throws {409} If category with same name or slug exists
 * @throws {500} If creation fails
 */
export async function POST(request: NextRequest) {
  try {
    const userRole = await getUserRole();
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, color, icon } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const category = await createCategory({
      name,
      slug,
      description,
      color,
      icon,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category with this name or slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
