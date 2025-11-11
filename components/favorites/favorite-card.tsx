"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, PlayCircle, Heart, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { VideoPlayerDialog } from "@/components/content/video-player-dialog";
import { NotesDialog } from "./notes-dialog";
import { removeFromFavorites } from "@/actions/favorites.actions";
import { toast } from "sonner";
import type { ContentItem, Source } from "@prisma/client";

type Favorite = {
  id: string;
  userId: string;
  contentItemId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface FavoriteWithContent extends Favorite {
  contentItem: ContentItem & {
    source: Source;
  };
}

interface FavoriteCardProps {
  favorite: FavoriteWithContent;
  onRemove: (favoriteId: string) => void;
  onUpdateNotes: (favoriteId: string, notes: string) => void;
}

export function FavoriteCard({
  favorite,
  onRemove,
  onUpdateNotes,
}: FavoriteCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { contentItem } = favorite;
  const isVideo = contentItem.type === "video";

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Remove this from your favorites?")) {
      return;
    }

    setIsRemoving(true);
    const result = await removeFromFavorites(contentItem.id);

    if (result.success) {
      toast.success("Removed from favorites");
      onRemove(favorite.id);
    } else {
      toast.error(result.error || "Failed to remove from favorites");
    }
    setIsRemoving(false);
  };

  const handleNotesUpdate = (notes: string) => {
    onUpdateNotes(favorite.id, notes);
  };

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full">
        {contentItem.thumbnailUrl && (
          <div
            className="relative aspect-video overflow-hidden bg-slate-100 cursor-pointer"
            onClick={() => isVideo && setIsPlayerOpen(true)}
          >
            <img
              src={contentItem.thumbnailUrl}
              alt={contentItem.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle className="h-16 w-16 text-white" />
              </div>
            )}
            <Badge className="absolute left-3 top-3 bg-red-600 hover:bg-red-700">
              {contentItem.type}
            </Badge>
          </div>
        )}

        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="line-clamp-2 text-lg leading-snug">
            {contentItem.title}
          </CardTitle>
          <div className="flex items-center justify-between text-sm">
            <CardDescription className="font-medium">
              {contentItem.source.name}
            </CardDescription>
            {contentItem.publishedAt && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {format(new Date(contentItem.publishedAt), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {favorite.notes && (
            <div className="rounded-lg bg-slate-50 p-3 border">
              <p className="text-sm text-slate-700 line-clamp-3">
                {favorite.notes}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsNotesOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {favorite.notes ? "Edit Notes" : "Add Notes"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isVideo && (
        <VideoPlayerDialog
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          videoUrl={contentItem.url}
          title={contentItem.title}
          description={contentItem.description || undefined}
          contentItemId={contentItem.id}
        />
      )}

      <NotesDialog
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        favoriteId={favorite.id}
        contentItem={contentItem}
        initialNotes={favorite.notes || ""}
        onNotesUpdate={handleNotesUpdate}
      />
    </>
  );
}
