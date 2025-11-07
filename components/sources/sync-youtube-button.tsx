"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import {
  syncYouTubeSource,
  syncAllYouTubeSources,
} from "@/actions/sync.actions";
import { toast } from "sonner";

interface SyncButtonProps {
  sourceId?: string;
  sourceName?: string;
}

export function SyncYouTubeButton({ sourceId, sourceName }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      if (sourceId) {
        // Sync single source
        const result = await syncYouTubeSource(sourceId);
        toast.success(
          `Synced ${result.videosAdded + result.videosUpdated} videos from ${
            sourceName || "channel"
          }`
        );
      } else {
        // Sync all sources
        const result = await syncAllYouTubeSources();
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
      toast.error(
        error instanceof Error ? error.message : "Failed to sync videos"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
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
  );
}
