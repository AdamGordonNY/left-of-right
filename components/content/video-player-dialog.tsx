"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface VideoPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  description?: string;
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
}: VideoPlayerDialogProps) {
  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0">
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

        <div className="flex items-center justify-end gap-2 p-6 pt-4">
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
