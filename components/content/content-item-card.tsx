"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayCircle, Calendar, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentItem, Source } from "@prisma/client";
import { format } from "date-fns";
import { VideoPlayerDialog } from "./video-player-dialog";
import { FavoriteButton } from "./favorite-button";

interface ContentItemCardProps {
  item: ContentItem;
  source: Source;
  slug: string;
  viewMode?: "grid" | "list";
}

export function ContentItemCard({
  item,
  source,
  slug,
  viewMode = "grid",
}: ContentItemCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const isVideo = item.type === "video";
  const Icon = isVideo ? PlayCircle : FileText;

  const handleClick = (e: React.MouseEvent) => {
    if (isVideo) {
      e.preventDefault();
      setIsPlayerOpen(true);
    }
  };

  if (viewMode === "list") {
    const listContent = (
      <Card className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
          {item.thumbnailUrl && (
            <div className="relative w-full sm:w-40 md:w-48 flex-shrink-0 aspect-video overflow-hidden bg-muted rounded-md">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <Icon className="h-10 sm:h-12 w-10 sm:w-12 text-white" />
              </div>
              <Badge
                className={`absolute left-2 top-2 text-xs ${
                  isVideo
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {item.type}
              </Badge>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg line-clamp-2 mb-1 sm:mb-2">
                  {item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                  <span className="font-medium truncate">{source.name}</span>
                  {item.publishedAt && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                      <span className="whitespace-nowrap">
                        {format(new Date(item.publishedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
                {item.description && (
                  <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {item.description}
                  </p>
                )}
              </div>
              <FavoriteButton
                contentItemId={item.id}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </Card>
    );

    return (
      <>
        {isVideo ? (
          <div onClick={handleClick}>{listContent}</div>
        ) : (
          <Link href={`/${slug}/content/${item.id}`}>{listContent}</Link>
        )}

        {isVideo && (
          <VideoPlayerDialog
            isOpen={isPlayerOpen}
            onClose={() => setIsPlayerOpen(false)}
            videoUrl={item.url}
            title={item.title}
            description={item.description || undefined}
            contentItemId={item.id}
          />
        )}
      </>
    );
  }

  const cardContent = (
    <Card className="group overflow-hidden transition-all hover:shadow-lg h-full cursor-pointer">
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
          <Badge
            className={`absolute left-3 top-3 ${
              isVideo
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {item.type}
          </Badge>
          <div className="absolute right-3 top-3">
            <FavoriteButton
              contentItemId={item.id}
              className="bg-white/90 hover:bg-white"
            />
          </div>
        </div>
      )}
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          {item.title}
        </CardTitle>
        <div className="flex items-center justify-between text-sm">
          <CardDescription className="font-medium">
            {source.name}
          </CardDescription>
          {item.publishedAt && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">
                {format(new Date(item.publishedAt), "MMM d, yyyy")}
              </span>
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
  );

  return (
    <>
      {isVideo ? (
        <div onClick={handleClick}>{cardContent}</div>
      ) : (
        <Link href={`/${slug}/content/${item.id}`}>{cardContent}</Link>
      )}

      {isVideo && (
        <VideoPlayerDialog
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          videoUrl={item.url}
          title={item.title}
          description={item.description || undefined}
          contentItemId={item.id}
        />
      )}
    </>
  );
}
