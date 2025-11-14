"use client";

import { ChannelFeedCard } from "@/components/feed/channel-feed-card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { SourceWithRecentContent } from "@/lib/feed-queries";

interface HomeClientProps {
  sources: SourceWithRecentContent[];
  userId: string | null;
}

export function HomeClient({ sources, userId }: HomeClientProps) {
  const [viewMode, setViewMode] = useViewMode("home-view-mode");

  return (
    <>
      <div className="flex justify-end mb-4">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-1 lg:grid-cols-2"
            : "space-y-4"
        }
      >
        {sources.map((source) => (
          <ChannelFeedCard
            key={source.id}
            source={source}
            viewMode={viewMode}
            userId={userId}
          />
        ))}
      </div>
    </>
  );
}
