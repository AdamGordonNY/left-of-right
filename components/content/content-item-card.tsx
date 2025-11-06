import Link from 'next/link';
import { PlayCircle, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContentItem, Source } from '@prisma/client';
import { format } from 'date-fns';

interface ContentItemCardProps {
  item: ContentItem;
  source: Source;
  slug: string;
}

export function ContentItemCard({ item, source, slug }: ContentItemCardProps) {
  const isVideo = item.type === 'video';
  const Icon = isVideo ? PlayCircle : FileText;

  return (
    <Link href={`/${slug}/content/${item.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full">
        {item.thumbnailUrl && (
          <div className="relative aspect-video overflow-hidden bg-slate-100">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <Icon className="h-16 w-16 text-white" />
            </div>
            <Badge className={`absolute left-3 top-3 ${isVideo ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {item.type}
            </Badge>
          </div>
        )}
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="line-clamp-2 text-lg leading-snug">
            {item.title}
          </CardTitle>
          <div className="flex items-center justify-between text-sm">
            <CardDescription className="font-medium">{source.name}</CardDescription>
            {item.publishedAt && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">{format(new Date(item.publishedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </CardHeader>
        {item.description && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
