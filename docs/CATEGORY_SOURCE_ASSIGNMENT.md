# Category Source Assignment Feature

## Overview

Added the ability to manage source assignments to categories from the admin Category Manager. Administrators can now click on any category and see a full list of all sources with the ability to assign/unassign sources to that category.

## What Was Built

### 1. CategorySourcesDialog Component
**File**: `/components/admin/category-sources-dialog.tsx`

A comprehensive dialog for managing which sources belong to a category:

**Features**:
- Displays all available sources in the system
- Shows currently assigned sources with visual indicators
- Search functionality to filter sources
- One-click assign/unassign with immediate API calls
- Loading states for async operations
- Visual feedback with color-coded assigned status
- Source count in dialog header
- Avatar display for sources
- Global/Personal badge for sources

**UI Elements**:
- Search input for filtering
- Scrollable list of sources
- Assign/Assigned buttons with check icons
- Loading spinners during operations
- Toast notifications for success/error

### 2. Updated CategoryManager Component
**File**: `/components/admin/category-manager.tsx`

**Changes**:
- Added "Manage Sources" button to each category card
- Imported `CategorySourcesDialog` component
- Added state for managing the sources dialog
- Added `handleManageSources` function
- Added `Users` icon from lucide-react
- Improved visual design with hover effects

**New UI**:
```
Each category card now has:
- Edit icon button (top right)
- Delete icon button (top right)
- "Manage Sources" button (bottom)
```

### 3. Enhanced API Endpoint
**File**: `/app/api/categories/[id]/route.ts`

**Changes**:
- Added query parameter `?includeSources=true`
- Returns category with related sources when requested
- Uses new helper function `getCategoryByIdWithSources`

### 4. New Prisma Helper Function
**File**: `/lib/prisma-categories.ts`

**New Function**: `getCategoryByIdWithSources(id: string)`

Returns a category with all its assigned sources including:
- Source ID, name, type
- Avatar URL
- Is global status

## User Flow

### Admin Workflow

1. **Navigate to Categories**
   - Go to `/admin`
   - Click on "Categories" tab

2. **Select Category**
   - Find the category to manage
   - Click "Manage Sources" button on the category card

3. **View Sources**
   - Dialog opens showing all sources
   - Already assigned sources show "Assigned" button
   - Unassigned sources show "Assign" button
   - Search box allows filtering by source name

4. **Assign Sources**
   - Click "Assign" on any source
   - Source immediately moves to assigned state
   - Toast confirmation appears
   - Category count updates automatically

5. **Unassign Sources**
   - Click "Assigned" on assigned sources
   - Source returns to unassigned state
   - Toast confirmation appears
   - Category count updates

6. **Close Dialog**
   - Click "Close" or click outside
   - Category list refreshes with updated counts

## API Integration

### Get Category with Sources
```
GET /api/categories/{id}?includeSources=true

Response:
{
  category: {
    id: string,
    name: string,
    slug: string,
    description: string | null,
    color: string | null,
    icon: string | null,
    sources: [{
      source: {
        id: string,
        name: string,
        type: string,
        avatarUrl: string | null,
        isGlobal: boolean
      }
    }]
  }
}
```

### Assign Source to Category
```
POST /api/sources/{sourceId}/categories
Body: { categoryId: string }

Response:
{ success: true }
```

### Unassign Source from Category
```
DELETE /api/sources/{sourceId}/categories/{categoryId}

Response:
{ success: true }
```

## Technical Details

### State Management
- Uses React `useState` for local state
- Uses `Set<string>` for tracking assigned source IDs
- Optimistic UI updates (immediate visual feedback)
- Automatic rollback on API errors

### Performance
- Loads all sources once on dialog open
- Fetches assigned sources separately
- No pagination needed (assuming reasonable source count)
- Efficient Set operations for lookups

### Error Handling
- Try/catch blocks for all API calls
- Toast notifications for errors
- Loading states prevent race conditions
- Graceful degradation if API fails

## UI/UX Features

### Visual Indicators
- **Assigned sources**: Blue primary button with check icon
- **Unassigned sources**: Outline button
- **Loading**: Spinner icon on button
- **Color coding**: Category color dot in header

### Responsive Design
- Dialog max height: 80vh
- Scrollable content area
- Maintains header and footer visibility
- Works on mobile and desktop

### Search
- Real-time filtering
- Case-insensitive matching
- Searches source names
- Updates instantly

## Files Changed

1. ✅ `/components/admin/category-sources-dialog.tsx` - NEW component
2. ✅ `/components/admin/category-manager.tsx` - Added button and dialog
3. ✅ `/app/api/categories/[id]/route.ts` - Added includeSources param
4. ✅ `/lib/prisma-categories.ts` - Added getCategoryByIdWithSources helper

## Testing Checklist

- [ ] Click "Manage Sources" opens dialog
- [ ] Dialog shows correct category name and color
- [ ] All sources appear in the list
- [ ] Search filters sources correctly
- [ ] Assigned sources show check icon
- [ ] Clicking "Assign" assigns source immediately
- [ ] Clicking "Assigned" unassigns source immediately
- [ ] Toast notifications appear for actions
- [ ] Category count updates after changes
- [ ] Dialog closes properly
- [ ] Changes persist after page refresh
- [ ] Loading states prevent double-clicks
- [ ] Avatars display for sources that have them
- [ ] Global badge shows for global sources

## Future Enhancements

1. **Bulk Operations**: Select multiple sources and assign all at once
2. **Drag and Drop**: Drag sources into category
3. **Category Suggestions**: AI-based suggestions for source categories
4. **Recently Added**: Show recently assigned sources
5. **Source Preview**: Hover to see source details
6. **Keyboard Navigation**: Tab through sources, Enter to assign
7. **Sort Options**: Sort by name, type, date added
8. **Filter Options**: Filter by type (YouTube/Substack), global/personal
9. **Pagination**: For systems with 100+ sources
10. **Undo**: Quick undo for accidental unassignment

## Related Documentation

- [CATEGORY_FRONTEND_INTEGRATION.md](./CATEGORY_FRONTEND_INTEGRATION.md) - Overall frontend integration
- [CATEGORIES.md](./CATEGORIES.md) - Complete category system documentation
- [CATEGORIZATION_QUICK_START.md](./CATEGORIZATION_QUICK_START.md) - User guide

## Summary

The category source assignment feature provides a streamlined interface for administrators to manage which sources belong to each category. The implementation uses modern React patterns, provides excellent UX with immediate feedback, and integrates seamlessly with the existing category management system.

Key benefits:
- **Efficient**: Manage all sources for a category in one place
- **Visual**: Clear indication of assignment status
- **Fast**: Immediate updates with optimistic UI
- **User-friendly**: Search, one-click actions, clear feedback
- **Scalable**: Handles growing source lists effectively
