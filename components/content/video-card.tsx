import { VideoContent } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface VideoCardProps {
  video: VideoContent;
  viewMode?: "grid" | "list";
}

export function VideoCard({ video, viewMode = "grid" }: VideoCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="flex gap-4 p-4">
          <div className="relative w-48 flex-shrink-0 aspect-video overflow-hidden bg-muted rounded-md">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <PlayCircle className="h-12 w-12 text-white" />
            </div>
            <Badge className="absolute left-2 top-2 bg-red-600 hover:bg-red-700">
              Video
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {video.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="font-medium">{video.creator}</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(video.publishedAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            {video.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {video.description}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

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
          <CardDescription className="font-medium">
            {video.creator}
          </CardDescription>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">
              {format(new Date(video.publishedAt), "MMM d, yyyy")}
            </span>
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
