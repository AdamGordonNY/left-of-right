"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Heart, Library } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Explainer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100">
            How does this work?
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4 text-sm sm:text-base text-blue-900 dark:text-blue-100">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2 mt-1">
              <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Curate Your Feed</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Instead of being overwhelmed by algorithm-driven content, you
                choose exactly which channels and sources you want to see. Click
                the <Heart className="inline h-4 w-4" /> button on any source to
                follow it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2 mt-1">
              <Library className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                Personalize Your Experience
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                The sources you see below are global. To see only your followed
                channels:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300 ml-2">
                <li>
                  Browse sources below and click{" "}
                  <Heart className="inline h-4 w-4" /> to follow
                </li>
                <li>
                  Or visit{" "}
                  <Link href="/my-sources" className="underline font-medium">
                    Manage Sources
                  </Link>{" "}
                  to discover and follow channels
                </li>
                <li>
                  Return to this homepage to see content only from your followed
                  sources
                </li>
              </ol>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Link href="/my-sources">
              <Button size="sm" className="text-xs sm:text-sm">
                <Library className="mr-2 h-4 w-4" />
                Browse Sources
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
