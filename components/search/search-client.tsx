"use client";

import { useState, useMemo } from "react";
import { Search, X, Tag, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceCard } from "@/components/sources/source-card";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { Category } from "@prisma/client";
import type { SourceWithFollowStatus } from "@/lib/prisma-follows";

interface SearchClientProps {
  sources: SourceWithFollowStatus[];
  categories: Category[];
  userId: string | null;
}

export function SearchClient({
  sources,
  categories,
  userId,
}: SearchClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useViewMode("search-view-mode");

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      // Filter by search query
      const matchesSearch =
        searchQuery.trim() === "" ||
        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by selected categories
      const matchesCategory =
        selectedCategories.length === 0 ||
        (source.categories &&
          source.categories.some((cat) => selectedCategories.includes(cat.id)));

      return matchesSearch && matchesCategory;
    });
  }, [sources, searchQuery, selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedCategories.length > 0;

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by channel name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Filter by Category
              </h3>
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <Badge
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={
                      isSelected
                        ? {
                            backgroundColor: category.color || "#6366f1",
                            color: "white",
                            borderColor: category.color || "#6366f1",
                          }
                        : {
                            borderColor: category.color || "#6366f1",
                            color: category.color || "#6366f1",
                          }
                    }
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Active filters:
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCategories.length}{" "}
                  {selectedCategories.length === 1 ? "category" : "categories"}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto py-1 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredSources.length}{" "}
          {filteredSources.length === 1 ? "channel" : "channels"} found
        </p>
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Results */}
      {filteredSources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 dark:bg-slate-900/50 p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No channels found
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Try adjusting your search terms or filters to find what you're
            looking for.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              viewMode={viewMode}
              showFollowButton={true}
              currentUserId={userId}
              isAdmin={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
