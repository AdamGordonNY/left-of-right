import { Suspense } from "react";
import { getUserFavorites } from "@/actions/favorites.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { FavoritesList } from "@/components/favorites/favorites-list";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-8 w-8 text-red-500 fill-current" />
          <h1 className="text-4xl font-bold">My Favorites</h1>
        </div>
        <p className="text-muted-foreground">
          Videos you've saved with your personal notes
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-slate-200" />
                <CardHeader>
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <FavoritesList />
      </Suspense>
    </div>
  );
}
