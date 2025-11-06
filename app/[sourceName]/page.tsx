import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Youtube, FileText, ExternalLink, ArrowRight, Users, Video } from 'lucide-react';
import { getSourceBySlug, generateSlug } from '@/lib/slug-utils';
import { getContentItemsBySource } from '@/lib/prisma-sources';
import { getFollowerCount } from '@/lib/prisma-follows';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FollowButton } from '@/components/sources/follow-button';
import { ContentItemCard } from '@/components/content/content-item-card';

interface ChannelPageProps {
  params: Promise<{
    sourceName: string;
  }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { sourceName } = await params;
  const source = await getSourceBySlug(sourceName);

  if (!source) {
    notFound();
  }

  const [contentItems, followerCount] = await Promise.all([
    getContentItemsBySource(source.id),
    getFollowerCount(source.id),
  ]);

  const recentItems = contentItems.slice(0, 12);
  const slug = generateSlug(source.name);

  const TypeIcon = source.type === 'youtube' ? Youtube : FileText;
  const initials = source.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={source.avatarUrl || undefined} alt={source.name} />
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
                      {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Video className="mr-1 h-4 w-4" />
                      {contentItems.length} {contentItems.length === 1 ? 'video' : 'videos'}
                    </div>
                  </div>
                  {source.description && (
                    <p className="text-slate-600 max-w-2xl">{source.description}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <FollowButton sourceId={source.id} />
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recent Videos</h2>
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
              <p className="text-slate-600">No content available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </main>
    </div>
  );
}
