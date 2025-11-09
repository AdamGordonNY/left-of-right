"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuotaExceededDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetAt: Date;
}

export function QuotaExceededDialog({
  open,
  onOpenChange,
  resetAt,
}: QuotaExceededDialogProps) {
  const formatResetTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>YouTube API Quota Exceeded</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              We&apos;ve reached our YouTube API quota limit for today. Don&apos;t worry -
              we&apos;re showing you cached content from our database.
            </p>
            <p className="font-semibold">
              The quota will reset at midnight PST:
            </p>
            <p className="text-lg font-bold text-foreground">
              {formatResetTime(resetAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              You can continue browsing existing content, but new videos and
              channel updates won&apos;t be available until the quota resets.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
