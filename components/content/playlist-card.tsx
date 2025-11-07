import Link from 'next/link';
import { List, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Playlist, Source } from '@prisma/client';
import { format } from 'date-fns';

interface PlaylistCardProps {
  playlist: Playlist;
  source: Source;
  slug: string;
}

export function PlaylistCard({ playlist, source, slug }: PlaylistCardProps) {
  return (
    <a href={playlist.playlistUrl} target="_blank" rel="noopener noreferrer">
      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full">
        {playlist.thumbnailUrl && (
          <div className="relative aspect-video overflow-hidden bg-slate-100">
            <img
              src={playlist.thumbnailUrl}
              alt={playlist.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
              <div className="flex items-center gap-2 text-white">
                <List className="h-8 w-8" />
                <span className="text-2xl font-bold">{playlist.videoCount}</span>
              </div>
            </div>
            <Badge className="absolute left-3 top-3 bg-slate-800 hover:bg-slate-900">
              Playlist
            </Badge>
          </div>
        )}
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="line-clamp-2 text-lg leading-snug">
            {playlist.title}
          </CardTitle>
          <div className="flex items-center justify-between text-sm">
            <CardDescription className="font-medium">{source.name}</CardDescription>
            {playlist.publishedAt && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">{format(new Date(playlist.publishedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </CardHeader>
        {playlist.description && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {playlist.description}
            </p>
          </CardContent>
        )}
      </Card>
    </a>
  );
}
