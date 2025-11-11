import { prisma } from "./prisma";
import type { Category, Source, SourceCategory } from "@prisma/client";

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Get a category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  return prisma.category.findUnique({
    where: { id },
  });
}

/**
 * Get a category by ID with sources
 */
export async function getCategoryByIdWithSources(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      sources: {
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
              avatarUrl: true,
              isGlobal: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get a category by slug
 */
export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  return prisma.category.findUnique({
    where: { slug },
  });
}

/**
 * Create a new category
 */
export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<Category> {
  return prisma.category.create({
    data,
  });
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    color?: string;
    icon?: string;
  }
): Promise<Category> {
  return prisma.category.update({
    where: { id },
    data,
  });
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<Category> {
  return prisma.category.delete({
    where: { id },
  });
}

/**
 * Add a category to a source
 */
export async function addCategoryToSource(
  sourceId: string,
  categoryId: string
): Promise<SourceCategory> {
  return prisma.sourceCategory.create({
    data: {
      sourceId,
      categoryId,
    },
  });
}

/**
 * Remove a category from a source
 */
export async function removeCategoryFromSource(
  sourceId: string,
  categoryId: string
): Promise<SourceCategory> {
  return prisma.sourceCategory.delete({
    where: {
      sourceId_categoryId: {
        sourceId,
        categoryId,
      },
    },
  });
}

/**
 * Get all categories for a source
 */
export async function getSourceCategories(sourceId: string): Promise<
  Array<
    SourceCategory & {
      category: Category;
    }
  >
> {
  return prisma.sourceCategory.findMany({
    where: { sourceId },
    include: {
      category: true,
    },
  });
}

/**
 * Get all sources in a category
 */
export async function getSourcesByCategory(categoryId: string): Promise<
  Array<
    SourceCategory & {
      source: Source;
    }
  >
> {
  return prisma.sourceCategory.findMany({
    where: { categoryId },
    include: {
      source: true,
    },
  });
}

/**
 * Get category with source count
 */
export async function getCategoriesWithCounts(): Promise<
  Array<Category & { _count: { sources: number } }>
> {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { sources: true },
      },
    },
    orderBy: { name: "asc" },
  });
}
