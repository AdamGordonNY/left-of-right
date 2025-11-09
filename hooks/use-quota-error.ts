"use client";

import { useState, useCallback } from "react";

export interface QuotaError {
  message: string;
  resetAt: Date;
}

export function useQuotaError() {
  const [quotaError, setQuotaError] = useState<QuotaError | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleQuotaError = useCallback((error: any) => {
    if (error?.name === "QuotaExhaustedError" || error?.message?.includes("quota exceeded")) {
      const resetAt = error.resetAt || new Date(new Date().setHours(24, 0, 0, 0));

      setQuotaError({
        message: error.message || "YouTube API quota exceeded",
        resetAt,
      });
      setIsDialogOpen(true);
      return true;
    }
    return false;
  }, []);

  const clearQuotaError = useCallback(() => {
    setQuotaError(null);
    setIsDialogOpen(false);
  }, []);

  return {
    quotaError,
    isDialogOpen,
    setIsDialogOpen,
    handleQuotaError,
    clearQuotaError,
  };
}
