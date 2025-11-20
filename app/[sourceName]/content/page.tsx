"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  List as ListIcon,
  Grid3x3,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { ContentItemCard } from "@/components/content/content-item-card";
import { PlaylistCard } from "@/components/content/playlist-card";
import { AddPlaylistDialog } from "@/components/playlists/add-playlist-dialog";
import { useUser } from "@clerk/nextjs";
import type { ContentItem, Source, Playlist } from "@prisma/client";

interface AllContentPageProps {
  params: Promise<{
    sourceName: string;
  }>;
}

export default function AllContentPage({ params }: AllContentPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const [sourceName, setSourceName] = useState<string>("");
  const [source, setSource] = useState<Source | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useViewMode("content-view-mode");

  const tab = searchParams.get("tab") || "videos";

  useEffect(() => {
    params.then((p) => setSourceName(p.sourceName));
  }, [params]);

  useEffect(() => {
    if (!sourceName) return;

    async function loadData() {
      try {
        const res = await fetch(`/api/sources/by-slug/${sourceName}`);
        if (!res.ok) {
          router.push("/404");
          return;
        }

        const data = await res.json();
        setSource(data.source);
        setContentItems(data.contentItems || []);
        setPlaylists(data.playlists || []);
        setPlaylistCount(data.playlistCount || 0);
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sourceName, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-32 bg-muted rounded" />
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!source) {
    return null;
  }

  const isYoutube = source.type === "youtube";
  const slug = sourceName;

  const handleTabChange = (value: string) => {
    router.push(`/${slug}/content?tab=${value}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link href={`/${slug}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Channel
          </Button>
        </Link>

        {isYoutube && playlistCount > 0 ? (
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-4">
                  All Content from {source.name}
                </h1>
                <TabsList>
                  <TabsTrigger
                    value="videos"
                    className="flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Videos ({contentItems.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="playlists"
                    className="flex items-center gap-2"
                  >
                    <ListIcon className="h-4 w-4" />
                    Playlists ({playlistCount})
                  </TabsTrigger>
                </TabsList>
              </div>

              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>

            <TabsContent value="videos">
              {contentItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Video className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No videos available yet
                    </p>
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
                  {contentItems.map((item) => (
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
            </TabsContent>

            <TabsContent value="playlists">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  {isSignedIn && source.type === "youtube" && (
                    <AddPlaylistDialog
                      sourceId={source.id}
                      sourceName={source.name}
                    />
                  )}
                </div>
                <ViewToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>

              {playlists.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ListIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No playlists available yet
                    </p>
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
                  {playlists.map((playlist) => (
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
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  All Content from {source.name}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {contentItems.length}{" "}
                  {contentItems.length === 1 ? "video" : "videos"} available
                </p>
              </div>

              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>

            {contentItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No content available yet
                  </p>
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
                {contentItems.map((item) => (
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
          </>
        )}
      </main>
    </div>
  );
}
