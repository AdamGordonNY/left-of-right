import { VideoContent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface VideoCardProps {
  video: VideoContent;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayCircle className="h-16 w-16 text-white" />
        </div>
        <Badge className="absolute left-3 top-3 bg-red-600 hover:bg-red-700">
          Video
        </Badge>
      </div>
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          {video.title}
        </CardTitle>
        <div className="flex items-center justify-between text-sm">
          <CardDescription className="font-medium">{video.creator}</CardDescription>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {video.description}
        </p>
      </CardContent>
    </Card>
  );
}
