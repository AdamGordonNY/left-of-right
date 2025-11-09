import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Youtube,
  FileText,
  ExternalLink,
  ArrowRight,
  Users,
  Video,
  List,
} from "lucide-react";
import { getSourceBySlug, generateSlug } from "@/lib/slug-utils";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getContentItemsBySource,
  getPlaylistsBySource,
  getPlaylistCount,
} from "@/lib/prisma-sources";
import { getFollowerCount } from "@/lib/prisma-follows";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "@/components/sources/follow-button";
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";
import { ContentItemCard } from "@/components/content/content-item-card";
import { PlaylistCard } from "@/components/content/playlist-card";

interface ChannelPageProps {
  params: Promise<{
    sourceName: string;
  }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { sourceName } = await params;
  const clerkUserId = await getUserId();

  // Convert Clerk user ID to database user ID
  let dbUserId: string | undefined = undefined;
  if (clerkUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });
    dbUserId = dbUser?.id;
  }

  const source = await getSourceBySlug(sourceName, dbUserId);

  if (!source) {
    notFound();
  }

  const isYoutube = source.type === "youtube";

  const [contentItems, playlists, followerCount, playlistCount] =
    await Promise.all([
      getContentItemsBySource(source.id),
      isYoutube ? getPlaylistsBySource(source.id) : Promise.resolve([]),
      getFollowerCount(source.id),
      isYoutube ? getPlaylistCount(source.id) : Promise.resolve(0),
    ]);

  const recentItems = contentItems.slice(0, 12);
  const recentPlaylists = playlists.slice(0, 12);
  const slug = generateSlug(source.name);

  const TypeIcon = source.type === "youtube" ? Youtube : FileText;
  const initials = source.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={source.avatarUrl || undefined}
                alt={source.name}
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {source.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline">
                      <TypeIcon className="mr-1 h-3 w-3" />
                      {source.type}
                    </Badge>
                    {source.isGlobal && (
                      <Badge variant="secondary">Global Source</Badge>
                    )}
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="mr-1 h-4 w-4" />
                      {followerCount}{" "}
                      {followerCount === 1 ? "follower" : "followers"}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Video className="mr-1 h-4 w-4" />
                      {contentItems.length}{" "}
                      {contentItems.length === 1 ? "video" : "videos"}
                    </div>
                    {isYoutube && playlistCount > 0 && (
                      <div className="flex items-center text-sm text-slate-600">
                        <List className="mr-1 h-4 w-4" />
                        {playlistCount}{" "}
                        {playlistCount === 1 ? "playlist" : "playlists"}
                      </div>
                    )}
                  </div>
                  {source.description && (
                    <p className="text-slate-600 max-w-2xl">
                      {source.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <FollowButton sourceId={source.id} />
                  {isYoutube && (
                    <SyncYouTubeButton
                      sourceId={source.id}
                      sourceName={source.name}
                    />
                  )}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Channel
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isYoutube && playlistCount > 0 ? (
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger
                value="playlists"
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Playlists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  Recent Videos
                </h2>
                {contentItems.length > 12 && (
                  <Link href={`/${slug}/content?tab=videos`}>
                    <Button variant="outline">
                      View All ({contentItems.length})
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>

              {recentItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Video className="h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600 mb-4">
                      No videos available yet
                    </p>
                    {isYoutube && (
                      <SyncYouTubeButton
                        sourceId={source.id}
                        sourceName={source.name}
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentItems.map((item) => (
                    <ContentItemCard
                      key={item.id}
                      item={item}
                      source={source}
                      slug={slug}
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
            </TabsContent>

            <TabsContent value="playlists">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Playlists</h2>
                {playlistCount > 12 && (
                  <Link href={`/${slug}/content?tab=playlists`}>
                    <Button variant="outline">
                      View All ({playlistCount})
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>

              {recentPlaylists.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <List className="h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">No playlists available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentPlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      source={source}
                      slug={slug}
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
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Recent Videos
              </h2>
              {contentItems.length > 12 && (
                <Link href={`/${slug}/content`}>
                  <Button variant="outline">
                    View All ({contentItems.length})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            {recentItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">
                    No content available yet
                  </p>
                  {isYoutube && (
                    <SyncYouTubeButton
                      sourceId={source.id}
                      sourceName={source.name}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recentItems.map((item) => (
                  <ContentItemCard
                    key={item.id}
                    item={item}
                    source={source}
                    slug={slug}
                  />
                ))}
              </div>
            )}

            {contentItems.length > 12 && (
              <div className="mt-8 text-center">
                <Link href={`/${slug}/content`}>
                  <Button size="lg">
                    View All {contentItems.length} Videos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
