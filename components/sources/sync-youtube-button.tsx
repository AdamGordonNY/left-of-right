"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import {
  syncYouTubeSource,
  syncAllYouTubeSources,
} from "@/actions/sync.actions";
import { toast } from "sonner";
import { useQuotaError } from "@/hooks/use-quota-error";
import { QuotaExceededDialog } from "@/components/notifications/quota-exceeded-dialog";

interface SyncButtonProps {
  sourceId?: string;
  sourceName?: string;
}

export function SyncYouTubeButton({ sourceId, sourceName }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { quotaError, isDialogOpen, setIsDialogOpen, handleQuotaError } = useQuotaError();

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      if (sourceId) {
        const result = await syncYouTubeSource(sourceId);

        if (result.success === false && result.error === "quota_exceeded") {
          handleQuotaError({
            name: "QuotaExhaustedError",
            message: result.message || "YouTube API quota exceeded",
            resetAt: result.resetAt ? new Date(result.resetAt) : new Date(),
          });
          return;
        }

        toast.success(
          `Synced ${(result.videosAdded || 0) + (result.videosUpdated || 0)} videos from ${
            sourceName || "channel"
          }`
        );
      } else {
        const result = await syncAllYouTubeSources();

        if (result.quotaExceeded && result.resetAt) {
          handleQuotaError({
            name: "QuotaExhaustedError",
            message: "YouTube API quota exceeded",
            resetAt: new Date(result.resetAt),
          });
          return;
        }

        toast.success(
          `Synced ${
            result.totalVideosAdded + result.totalVideosUpdated
          } videos from ${result.sourcesProcessed} channels`
        );

        if (result.errors.length > 0) {
          toast.error(`Failed to sync: ${result.errors.join(", ")}`);
        }
      }
    } catch (error) {
      console.error("Sync error:", error);

      if (!handleQuotaError(error)) {
        toast.error(
          error instanceof Error ? error.message : "Failed to sync videos"
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        size="sm"
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
        />
        {isSyncing ? "Syncing..." : sourceId ? "Sync Videos" : "Sync All Sources"}
      </Button>

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
