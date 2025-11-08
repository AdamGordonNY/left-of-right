"use client";

import { useState, useEffect } from "react";
import { getUserFavorites } from "@/actions/favorites.actions";
import { FavoriteCard } from "./favorite-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart } from "lucide-react";
import type { ContentItem, Source } from "@prisma/client";

type Favorite = {
  id: string;
  userId: string;
  contentItemId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type FavoriteWithContent = Favorite & {
  contentItem: ContentItem & {
    source: Source;
  };
};

export function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      const result = await getUserFavorites();
      if (result.success && result.favorites) {
        setFavorites(result.favorites as any);
      } else {
        setError(result.error || "Failed to load favorites");
      }
      setLoading(false);
    }
    loadFavorites();
  }, []);

  const handleRemoveFavorite = (favoriteId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  const handleUpdateNotes = (favoriteId: string, notes: string) => {
    setFavorites((prev) =>
      prev.map((f) => (f.id === favoriteId ? { ...f, notes } : f))
    );
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-slate-200 rounded-lg mb-4" />
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
        <p className="text-muted-foreground">
          Start favoriting videos to save them here with your notes
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map((favorite) => (
        <FavoriteCard
          key={favorite.id}
          favorite={favorite}
          onRemove={handleRemoveFavorite}
          onUpdateNotes={handleUpdateNotes}
        />
      ))}
    </div>
  );
}
