"use client";

import { useQuotaError } from "@/hooks/use-quota-error";
import { QuotaExceededDialog } from "@/components/notifications/quota-exceeded-dialog";

export function QuotaErrorExample() {
  const { quotaError, isDialogOpen, setIsDialogOpen, handleQuotaError } = useQuotaError();

  const handleSomeYouTubeOperation = async () => {
    try {
      const response = await fetch("/api/sync/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: "some-id" }),
      });

      const data = await response.json();

      if (data.quotaExceeded) {
        handleQuotaError({
          name: "QuotaExhaustedError",
          message: data.message,
          resetAt: new Date(data.resetAt),
        });
      }
    } catch (error: any) {
      if (!handleQuotaError(error)) {
        console.error("Other error:", error);
      }
    }
  };

  return (
    <>
      <button onClick={handleSomeYouTubeOperation}>
        Sync YouTube Content
      </button>

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
