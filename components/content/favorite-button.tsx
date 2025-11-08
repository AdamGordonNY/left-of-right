"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  addToFavorites,
  removeFromFavorites,
  isFavorited,
} from "@/actions/favorites.actions";

interface FavoriteButtonProps {
  contentItemId: string;
  variant?: "default" | "ghost";
  className?: string;
}

export function FavoriteButton({
  contentItemId,
  variant = "ghost",
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkFavoriteStatus() {
      const result = await isFavorited(contentItemId);
      setFavorited(result.isFavorited);
      setFavoriteId(result.favoriteId);
    }
    checkFavoriteStatus();
  }, [contentItemId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);

    try {
      if (favorited) {
        const result = await removeFromFavorites(contentItemId);
        if (result.success) {
          setFavorited(false);
          setFavoriteId(undefined);
          toast.success("Removed from favorites");
        } else {
          toast.error(result.error || "Failed to remove from favorites");
        }
      } else {
        const result = await addToFavorites(contentItemId);
        if (result.success && result.favorite) {
          setFavorited(true);
          setFavoriteId(result.favorite.id);
          toast.success("Added to favorites");
        } else {
          toast.error(result.error || "Failed to add to favorites");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`${className} ${
        favorited ? "text-red-500 hover:text-red-600" : ""
      }`}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
    </Button>
  );
}
