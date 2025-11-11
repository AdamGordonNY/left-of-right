# Source Categorization System

## Overview

Added a flexible categorization system to organize sources by topics, themes, or any custom taxonomy.

## Database Schema

### New Models

**Category**

- `id`: Unique identifier
- `name`: Category name (unique)
- `slug`: URL-friendly slug (unique)
- `description`: Optional description
- `color`: Hex color code (default: #6366f1)
- `icon`: Icon name for UI display
- `createdAt`, `updatedAt`: Timestamps

**SourceCategory** (Join table for many-to-many relationship)

- `id`: Unique identifier
- `sourceId`: Reference to Source
- `categoryId`: Reference to Category
- `createdAt`: Timestamp
- Unique constraint on `[sourceId, categoryId]`

### Updated Models

**Source**

- Added `categories` relation to SourceCategory[]

## API Endpoints

### Categories

**GET /api/categories**

- Get all categories
- Query params:
  - `withCounts=true`: Include source counts for each category
- Returns: `{ categories: Category[] }`

**POST /api/categories** (Admin only)

- Create a new category
- Body: `{ name, slug, description?, color?, icon? }`
- Returns: `{ category: Category }`

**GET /api/categories/[id]**

- Get a specific category by ID
- Returns: `{ category: Category }`

**PATCH /api/categories/[id]** (Admin only)

- Update a category
- Body: `{ name?, slug?, description?, color?, icon? }`
- Returns: `{ category: Category }`

**DELETE /api/categories/[id]** (Admin only)

- Delete a category
- Returns: `{ success: true }`

### Source Categories

**GET /api/sources/[id]/categories**

- Get all categories assigned to a source
- Returns: `{ categories: Category[] }`

**POST /api/sources/[id]/categories**

- Add a category to a source
- Requires: Source owner or admin (for global sources)
- Body: `{ categoryId: string }`
- Returns: `{ sourceCategory: SourceCategory }`

**DELETE /api/sources/[id]/categories/[categoryId]**

- Remove a category from a source
- Requires: Source owner or admin (for global sources)
- Returns: `{ success: true }`

## Helper Functions

Created in `/lib/prisma-categories.ts`:

- `getCategories()` - Get all categories
- `getCategoryById(id)` - Get category by ID
- `getCategoryBySlug(slug)` - Get category by slug
- `createCategory(data)` - Create new category
- `updateCategory(id, data)` - Update category
- `deleteCategory(id)` - Delete category
- `addCategoryToSource(sourceId, categoryId)` - Add category to source
- `removeCategoryFromSource(sourceId, categoryId)` - Remove category from source
- `getSourceCategories(sourceId)` - Get all categories for a source
- `getSourcesByCategory(categoryId)` - Get all sources in a category
- `getCategoriesWithCounts()` - Get categories with source counts

## Usage Examples

### Create Categories (Admin)

```typescript
// POST /api/categories
{
  "name": "Politics",
  "slug": "politics",
  "description": "Political commentary and analysis",
  "color": "#ef4444",
  "icon": "vote"
}
```

### Assign Category to Source

```typescript
// POST /api/sources/{sourceId}/categories
{
  "categoryId": "clx..."
}
```

### Get Sources by Category

```typescript
import { getSourcesByCategory } from "@/lib/prisma-categories";

const sourceCategories = await getSourcesByCategory(categoryId);
const sources = sourceCategories.map((sc) => sc.source);
```

### Display Categories in UI

```typescript
import { getCategoriesWithCounts } from "@/lib/prisma-categories";

const categories = await getCategoriesWithCounts();

categories.forEach((cat) => {
  console.log(`${cat.name}: ${cat._count.sources} sources`);
});
```

## Suggested Categories

Consider creating these default categories:

- **Politics** (color: #ef4444, icon: "vote")
- **Technology** (color: #3b82f6, icon: "cpu")
- **Science** (color: #10b981, icon: "flask")
- **Business** (color: #f59e0b, icon: "briefcase")
- **Entertainment** (color: #ec4899, icon: "film")
- **Education** (color: #8b5cf6, icon: "book")
- **News** (color: #6366f1, icon: "newspaper")
- **Commentary** (color: #14b8a6, icon: "message-square")

## Next Steps

1. **Create default categories** - Seed the database with initial categories
2. **Build category management UI** - Admin interface to CRUD categories
3. **Add category filters** - Filter sources by category on browse page
4. **Category badges** - Display category tags on source cards
5. **Category pages** - Dedicated pages for each category (e.g., `/categories/politics`)
6. **Multi-select in source editor** - Allow assigning multiple categories when creating/editing sources

## Security

- Category creation/editing/deletion: Admin only
- Adding/removing categories from sources: Source owner or admin (for global sources)
- Viewing categories: Public (no authentication required)
