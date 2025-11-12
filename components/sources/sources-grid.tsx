"use client";

import { SourceCard } from "@/components/sources/source-card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { SourceWithFollowStatus } from "@/lib/prisma-follows";

interface SourcesGridProps {
  sources: SourceWithFollowStatus[];
  showFollowButton?: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
}

export function SourcesGrid({
  sources,
  showFollowButton = true,
  currentUserId = null,
  isAdmin = false,
}: SourcesGridProps) {
  const [viewMode, setViewMode] = useViewMode("sources-view-mode");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {sources.length} {sources.length === 1 ? "source" : "sources"}
        </p>
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      <div
        className={
          viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-4"
        }
      >
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            showFollowButton={showFollowButton}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}
