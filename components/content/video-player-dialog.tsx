"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExternalLink, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VideoPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  description?: string;
  contentItemId?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtu.be short links
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }

    // Handle youtube.com watch links
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

export function VideoPlayerDialog({
  isOpen,
  onClose,
  videoUrl,
  title,
  description,
  contentItemId,
}: VideoPlayerDialogProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    : null;

  // Check if video is favorited when dialog opens
  useEffect(() => {
    if (isOpen && contentItemId) {
      checkFavoriteStatus();
    }
  }, [isOpen, contentItemId]);

  const checkFavoriteStatus = async () => {
    if (!contentItemId) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        const favorite = data.favorites.find(
          (f: any) => f.contentItemId === contentItemId
        );
        if (favorite) {
          setIsFavorited(true);
          setNotes(favorite.notes || "");
        } else {
          setIsFavorited(false);
          setNotes("");
        }
      }
    } catch (error) {
      console.error("Failed to check favorite status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!contentItemId) {
      toast.error("Cannot favorite this video");
      return;
    }

    setIsSavingFavorite(true);
    try {
      if (isFavorited) {
        // Remove from favorites
        const res = await fetch(
          `/api/favorites?contentItemId=${contentItemId}`,
          {
            method: "DELETE",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to remove from favorites");
        }

        setIsFavorited(false);
        setNotes("");
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentItemId,
            notes: notes || null,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to add to favorites");
        }

        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const saveNotes = async () => {
    if (!contentItemId || !isFavorited) return;

    setIsSavingFavorite(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentItemId,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save notes");
      }

      toast.success("Notes saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save notes");
    } finally {
      setIsSavingFavorite(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="pr-8">{title}</DialogTitle>
          {description && (
            <DialogDescription className="line-clamp-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="px-6">
          {embedUrl ? (
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full rounded-lg"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-100">
              <p className="text-slate-500">Unable to load video player</p>
            </div>
          )}
        </div>

        {/* Favorite Section */}
        {contentItemId && (
          <div className="px-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Favorite</Label>
              <Button
                variant={isFavorited ? "default" : "outline"}
                size="sm"
                onClick={toggleFavorite}
                disabled={isSavingFavorite || isLoading}
              >
                {isSavingFavorite || isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    className={`mr-2 h-4 w-4 ${
                      isFavorited ? "fill-current" : ""
                    }`}
                  />
                )}
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </Button>
            </div>

            {isFavorited && (
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add your thoughts about this video..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={saveNotes}
                    disabled={isSavingFavorite}
                  >
                    {isSavingFavorite ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Notes"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              Watch on YouTube
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
