"use client";

import { Badge } from "@/components/ui/badge";
import type { Category } from "@prisma/client";

interface CategoryBadgesProps {
  categories: Category[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
}

export function CategoryBadges({
  categories,
  maxDisplay = 3,
  size = "sm",
}: CategoryBadgesProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const displayCategories = categories.slice(0, maxDisplay);
  const remainingCount = categories.length - maxDisplay;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayCategories.map((category) => (
        <Badge
          key={category.id}
          variant="secondary"
          className={`gap-1 ${sizeClasses[size]}`}
          style={{
            backgroundColor: `${category.color}15`,
            borderColor: `${category.color}40`,
            color: category.color || undefined,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: category.color || "#6366f1" }}
          />
          {category.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className={sizeClasses[size]}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
