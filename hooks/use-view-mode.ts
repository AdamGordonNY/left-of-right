"use client";

import { useState, useEffect } from "react";

export type ViewMode = "grid" | "list";

export function useViewMode(storageKey: string = "content-view-mode"): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>("grid");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored === "grid" || stored === "list") {
      setViewModeState(stored);
    }
  }, [storageKey]);

  // Save to localStorage when changed
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (mounted) {
      localStorage.setItem(storageKey, mode);
    }
  };

  return [viewMode, setViewMode];
}
