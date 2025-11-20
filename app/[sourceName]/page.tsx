import { notFound } from "next/navigation";
import {
  Youtube,
  FileText,
  ExternalLink,
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
import { getSourceCategories } from "@/lib/prisma-categories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/sources/follow-button";
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";
import { AddPlaylistDialog } from "@/components/playlists/add-playlist-dialog";
import { SourceContentDisplay } from "@/components/sources/source-content-display";

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

  const [
    contentItems,
    playlists,
    followerCount,
    playlistCount,
    sourceCategories,
  ] = await Promise.all([
    getContentItemsBySource(source.id),
    isYoutube ? getPlaylistsBySource(source.id) : Promise.resolve([]),
    getFollowerCount(source.id),
    isYoutube ? getPlaylistCount(source.id) : Promise.resolve(0),
    getSourceCategories(source.id),
  ]);

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
                    {sourceCategories.map((sc) => (
                      <Badge
                        key={sc.id}
                        variant="default"
                        style={{
                          backgroundColor: sc.category.color || "#6366f1",
                          color: "white",
                        }}
                      >
                        {sc.category.name}
                      </Badge>
                    ))}
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
                  {isYoutube && clerkUserId && (
                    <>
                      <SyncYouTubeButton
                        sourceId={source.id}
                        sourceName={source.name}
                      />
                      <AddPlaylistDialog
                        sourceId={source.id}
                        sourceName={source.name}
                      />
                    </>
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
        <SourceContentDisplay
          source={source}
          slug={slug}
          contentItems={contentItems}
          playlists={playlists}
          isYoutube={isYoutube}
          hasPlaylists={playlistCount > 0}
          clerkUserId={clerkUserId}
        />
      </main>
    </div>
  );
}
