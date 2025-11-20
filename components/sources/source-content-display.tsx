"use client";

import Link from "next/link";
import { ArrowRight, Video, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { ContentItemCard } from "@/components/content/content-item-card";
import { PlaylistCard } from "@/components/content/playlist-card";
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";
import { AddPlaylistDialog } from "@/components/playlists/add-playlist-dialog";
import { useViewMode } from "@/hooks/use-view-mode";
import { ContentItem, Playlist, Source } from "@prisma/client";

interface SourceContentDisplayProps {
  source: Source;
  slug: string;
  contentItems: ContentItem[];
  playlists: Playlist[];
  isYoutube: boolean;
  hasPlaylists: boolean;
  clerkUserId: string | null;
}

export function SourceContentDisplay({
  source,
  slug,
  contentItems,
  playlists,
  isYoutube,
  hasPlaylists,
  clerkUserId,
}: SourceContentDisplayProps) {
  const [viewMode, setViewMode] = useViewMode("source-view-mode");
  const recentItems = contentItems.slice(0, 12);
  const recentPlaylists = playlists.slice(0, 12);
  const playlistCount = playlists.length;

  return (
    <>
      {/* Videos Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Recent Videos</h2>
        <div className="flex items-center gap-2">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          {contentItems.length > 12 && (
            <Link href={`/${slug}/content?tab=videos`}>
              <Button variant="outline" size="sm">
                View All ({contentItems.length})
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {recentItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 mb-4">No videos available yet</p>
            {isYoutube && clerkUserId && (
              <SyncYouTubeButton
                sourceId={source.id}
                sourceName={source.name}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-4"
          }
        >
          {recentItems.map((item) => (
            <ContentItemCard
              key={item.id}
              item={item}
              source={source}
              slug={slug}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {contentItems.length > 12 && (
        <div className="mt-8 text-center">
          <Link href={`/${slug}/content?tab=videos`}>
            <Button size="lg">
              View All {contentItems.length} Videos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Playlists Section (if YouTube and has playlists) */}
      {hasPlaylists && (
        <div className="mt-12">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Playlists</h2>
            <div className="flex items-center gap-2">
              {clerkUserId && (
                <AddPlaylistDialog
                  sourceId={source.id}
                  sourceName={source.name}
                />
              )}
              {playlistCount > 12 && (
                <Link href={`/${slug}/content?tab=playlists`}>
                  <Button variant="outline" size="sm">
                    View All ({playlistCount})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {recentPlaylists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <List className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">No playlists available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-4"
              }
            >
              {recentPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  source={source}
                  slug={slug}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}

          {playlistCount > 12 && (
            <div className="mt-8 text-center">
              <Link href={`/${slug}/content?tab=playlists`}>
                <Button size="lg">
                  View All {playlistCount} Playlists
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
