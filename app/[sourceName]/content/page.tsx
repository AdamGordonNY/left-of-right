import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video } from 'lucide-react';
import { getSourceBySlug, generateSlug } from '@/lib/slug-utils';
import { getContentItemsBySource } from '@/lib/prisma-sources';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContentItemCard } from '@/components/content/content-item-card';

interface AllContentPageProps {
  params: Promise<{
    sourceName: string;
  }>;
}

export default async function AllContentPage({ params }: AllContentPageProps) {
  const { sourceName } = await params;
  const source = await getSourceBySlug(sourceName);

  if (!source) {
    notFound();
  }

  const contentItems = await getContentItemsBySource(source.id);
  const slug = generateSlug(source.name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/${slug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Channel
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                All Content from {source.name}
              </h1>
              <p className="text-slate-600 mt-2">
                {contentItems.length} {contentItems.length === 1 ? 'video' : 'videos'} available
              </p>
            </div>
          </div>
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
      </main>
    </div>
  );
}
