import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";
import {
  getCategories,
  getCategoriesWithCounts,
  createCategory,
} from "@/lib/prisma-categories";

/**
 * GET /api/categories
 * Get all categories
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
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category (admin only)
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
        { status: 400 }
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
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
