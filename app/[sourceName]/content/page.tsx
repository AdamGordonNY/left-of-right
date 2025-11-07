import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, List } from 'lucide-react';
import { getSourceBySlug, generateSlug } from '@/lib/slug-utils';
import { getContentItemsBySource, getPlaylistsBySource, getPlaylistCount } from '@/lib/prisma-sources';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentItemCard } from '@/components/content/content-item-card';
import { PlaylistCard } from '@/components/content/playlist-card';

interface AllContentPageProps {
  params: Promise<{
    sourceName: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AllContentPage({ params, searchParams }: AllContentPageProps) {
  const { sourceName } = await params;
  const { tab } = await searchParams;
  const source = await getSourceBySlug(sourceName);

  if (!source) {
    notFound();
  }

  const isYoutube = source.type === 'youtube';
  const defaultTab = tab || 'videos';

  const [contentItems, playlists, playlistCount] = await Promise.all([
    getContentItemsBySource(source.id),
    isYoutube ? getPlaylistsBySource(source.id) : Promise.resolve([]),
    isYoutube ? getPlaylistCount(source.id) : Promise.resolve(0),
  ]);

  const slug = generateSlug(source.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link href={`/${slug}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Channel
          </Button>
        </Link>

        {isYoutube && playlistCount > 0 ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                All Content from {source.name}
              </h1>
              <TabsList>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videos ({contentItems.length})
                </TabsTrigger>
                <TabsTrigger value="playlists" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Playlists ({playlistCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="videos">
              {contentItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Video className="h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">No videos available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {contentItems.map((item) => (
                    <ContentItemCard
                      key={item.id}
                      item={item}
                      source={source}
                      slug={slug}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              {playlists.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <List className="h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">No playlists available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      source={source}
                      slug={slug}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900">
                All Content from {source.name}
              </h1>
              <p className="text-slate-600 mt-2">
                {contentItems.length} {contentItems.length === 1 ? 'video' : 'videos'} available
              </p>
            </div>

            {contentItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600">No content available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {contentItems.map((item) => (
                  <ContentItemCard
                    key={item.id}
                    item={item}
                    source={source}
                    slug={slug}
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
