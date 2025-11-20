"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListVideo, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { savePublicPlaylist } from "@/actions/playlist.actions";
import { useRouter } from "next/navigation";
import { useQuotaError } from "@/hooks/use-quota-error";
import { QuotaExceededDialog } from "@/components/notifications/quota-exceeded-dialog";

interface AddPlaylistDialogProps {
  sourceId: string;
  sourceName: string;
  trigger?: React.ReactNode;
}

export function AddPlaylistDialog({
  sourceId,
  sourceName,
  trigger,
}: AddPlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { quotaError, isDialogOpen, setIsDialogOpen, handleQuotaError } =
    useQuotaError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playlistUrl.trim()) {
      toast.error("Please enter a playlist URL");
      return;
    }

    // Basic URL validation
    if (
      !playlistUrl.includes("youtube.com") &&
      !playlistUrl.includes("youtu.be")
    ) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setIsLoading(true);

    try {
      const result = await savePublicPlaylist(playlistUrl, sourceId);

      if (result.success === false && result.error === "quota_exceeded") {
        handleQuotaError({
          name: "QuotaExhaustedError",
          message: result.message || "YouTube API quota exceeded",
          resetAt: result.resetAt ? new Date(result.resetAt) : new Date(),
        });
        return;
      }

      toast.success(result.message || "Playlist saved successfully", {
        description: result.videosAdded
          ? `Added ${result.videosAdded} new videos`
          : undefined,
      });

      setPlaylistUrl("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving playlist:", error);

      if (!handleQuotaError(error)) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save playlist"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <ListVideo className="mr-2 h-4 w-4" />
              Add Playlist
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add YouTube Playlist</DialogTitle>
              <DialogDescription>
                Save a public YouTube playlist to {sourceName}. Enter the
                playlist URL below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="playlistUrl">Playlist URL</Label>
                <Input
                  id="playlistUrl"
                  placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Example formats:
                  <br />
                  • https://www.youtube.com/playlist?list=PLxxxxxx
                  <br />• https://youtube.com/watch?v=xxxxx&list=PLxxxxxx
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ListVideo className="mr-2 h-4 w-4" />
                    Save Playlist
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {quotaError && (
        <QuotaExceededDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          resetAt={quotaError.resetAt}
        />
      )}
    </>
  );
}
