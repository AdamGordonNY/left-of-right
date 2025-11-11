# Category Frontend Integration

This document explains how categories are integrated into the source management UI.

## Overview

Sources can now be categorized when being created or edited. This helps organize sources by:
- **Topic**: News, Politics, Science, Entertainment, Tech, Business, History, Comedy
- **Geographic Scope**: Foreign, Domestic
- **Political Perspective**: Leans Left, Leans Right, Center

## User Interface

### 1. Edit Source Dialog

**Location**: `/components/sources/edit-source-dialog.tsx`

**Features**:
- Shows a "Categories" section with CategorySelector component
- Displays currently assigned categories as color-coded badges
- Allows adding/removing categories via dropdown
- Categories are saved immediately when changed
- Available for both admin editing global sources and users editing personal sources

**Usage**:
```tsx
<EditSourceDialog 
  source={{
    ...source,
    categories: source.categories.map(sc => sc.category)
  }} 
  isAdmin={true} 
/>
```

**Screenshot Flow**:
1. Click "Edit" on any source
2. Scroll to "Categories" section
3. Click "+ Add Category" to open dropdown
4. Search or select categories
5. Click X on badges to remove categories
6. Categories save automatically

### 2. Add Source Dialog

**Location**: `/components/sources/add-source-dialog.tsx`

**Current Behavior**:
- Categories cannot be assigned during initial source creation
- After a source is created, a toast message reminds users they can add categories by editing the source
- This is because the CategorySelector requires an existing source ID to function

**Future Enhancement** (Optional):
- Could add a two-step wizard:
  1. Step 1: Create source (name, URL, etc.)
  2. Step 2: Assign categories (after source is created)

**Toast Message**:
```
"Source added successfully. You can now add categories by editing the source."
```

### 3. Admin Sources Page

**Location**: `/app/admin/sources/page.tsx`

**Changes**:
- Updated Prisma query to include categories relation
- Maps junction table to flat category array for EditSourceDialog
- Each source card shows edit button that opens dialog with categories

**Data Structure**:
```typescript
const sources = await prisma.source.findMany({
  // ... other options
  select: {
    // ... other fields
    categories: {
      select: {
        category: true,
      },
    },
  },
});

// Then map to flat array:
source={{
  ...source,
  categories: source.categories.map(sc => sc.category)
}}
```

## Components Used

### CategorySelector Component

**Location**: `/components/sources/category-selector.tsx`

**Props**:
```typescript
interface CategorySelectorProps {
  sourceId: string;              // Required: The source being categorized
  selectedCategories?: Category[]; // Optional: Pre-selected categories
  onUpdate?: () => void;          // Optional: Callback after changes
}
```

**Features**:
- Loads all available categories from API
- Displays selected categories as color-coded badges with X buttons
- Popover dropdown for adding new categories
- Search functionality to filter categories
- Checkmarks indicate already-selected categories
- Immediate API calls to add/remove categories
- Loading states during operations
- Toast notifications for success/error

**Example Usage**:
```tsx
<CategorySelector
  sourceId={source.id}
  selectedCategories={source.categories || []}
  onUpdate={() => router.refresh()}
/>
```

## API Integration

### Fetch All Categories
```
GET /api/categories
Response: { categories: Category[] }
```

### Add Category to Source
```
POST /api/sources/{sourceId}/categories
Body: { categoryId: string }
Response: { success: true }
```

### Remove Category from Source
```
DELETE /api/sources/{sourceId}/categories/{categoryId}
Response: { success: true }
```

### Get Source with Categories
```
GET /api/sources/{sourceId}
Response includes: categories: [{ category: Category }]
```

## User Flows

### Admin Creating Global Source
1. Go to `/admin` or `/admin/sources`
2. Click "Add Source"
3. Fill in source details
4. Check "Global Source" (default for admins)
5. Click "Add Source"
6. Toast appears: "Source added successfully. You can now add categories..."
7. Find the source in the list
8. Click "Edit"
9. Scroll to Categories section
10. Click "+ Add Category"
11. Select categories (News, Politics, Leans Left, etc.)
12. Categories save automatically
13. Close dialog

### User Editing Personal Source
1. Go to `/my-sources`
2. Find a source you created
3. Click on source to view details (implementation varies)
4. Use edit functionality
5. Add/remove categories as needed

### Admin Editing Any Source
1. Go to `/admin/sources`
2. Click "Edit" on any global source
3. Modify categories using CategorySelector
4. Changes save immediately
5. Close dialog

## Permissions

**Who Can Categorize**:
- ✅ Source owner can categorize their own sources
- ✅ Admins can categorize any source (global or personal)
- ❌ Regular users cannot categorize sources they don't own

**Enforced At**:
- API level: `/api/sources/[id]/categories` endpoints check ownership
- UI level: EditSourceDialog only appears where user has permission

## Visual Design

### Category Badges
- Color-coded using category.color (hex value)
- Small colored dot indicator
- Background uses alpha transparency: `${color}20`
- Border uses full color
- X button for removal
- Hover state on X button shows red color

### Category Dropdown
- Searchable command palette interface
- Category name with colored dot
- Checkmark for selected categories
- Hover/focus states
- Max height with scroll for many categories

### Edit Dialog Layout
```
┌─────────────────────────────────┐
│ Edit Source                     │
├─────────────────────────────────┤
│ Name: [Input]                   │
│ Type: [Dropdown]                │
│ URL: [Input]                    │
│ Description: [Textarea]         │
│ Avatar URL: [Input]             │
│                                 │
│ Categories                      │
│ Organize this source by topic...│
│ [News] [Politics] [Leans Left]  │
│ [+ Add Category]                │
│                                 │
│ Active Status: [Toggle]         │
│ Global Source: [Toggle]         │
│                                 │
│       [Cancel]  [Save Changes]  │
└─────────────────────────────────┘
```

## Database Queries

### Fetch Source with Categories
```typescript
const source = await prisma.source.findUnique({
  where: { id: sourceId },
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
});

// Transform for UI:
const sourceWithCategories = {
  ...source,
  categories: source.categories.map(sc => sc.category),
};
```

### Fetch All Sources with Categories (Admin)
```typescript
const sources = await prisma.source.findMany({
  where: { isGlobal: true },
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
});
```

## Error Handling

**Scenarios**:
1. **Category already assigned**: API returns 400, toast shows error
2. **Invalid category ID**: API returns 404
3. **Permission denied**: API returns 403
4. **Network error**: Toast shows "Failed to add/remove category"

**User Experience**:
- Loading states prevent double-clicks
- Optimistic UI updates (category appears immediately)
- Rollback on error (category removed if API fails)
- Clear error messages in toasts

## Testing Checklist

- [ ] Admin can edit global source and add categories
- [ ] Admin can remove categories from global source
- [ ] Categories persist after page refresh
- [ ] Multiple categories can be assigned to one source
- [ ] Category colors display correctly
- [ ] Search in category dropdown works
- [ ] Toast notifications appear for success/error
- [ ] Edit dialog scrolls properly with many fields
- [ ] Categories section is responsive on mobile
- [ ] User cannot add duplicate categories
- [ ] Removing a category updates UI immediately

## Future Enhancements

1. **Bulk Categorization**: Select multiple sources and apply categories at once
2. **Category Suggestions**: AI-based category suggestions based on source name/description
3. **Category Analytics**: Show which categories are most popular
4. **Category Filters**: Filter source lists by category on main pages
5. **Two-Step Add Dialog**: Assign categories immediately after creating source
6. **Quick Actions**: Right-click menu on source cards for quick category assignment
7. **Keyboard Shortcuts**: Hotkeys for opening category selector
8. **Category Presets**: Save common category combinations ("News + Politics + Leans Left")

## Related Documentation

- [CATEGORIES.md](./CATEGORIES.md) - Complete category system documentation
- [CATEGORY_IMPLEMENTATION.md](./CATEGORY_IMPLEMENTATION.md) - Implementation summary
- [Database Schema](../prisma/schema.prisma) - Category models
