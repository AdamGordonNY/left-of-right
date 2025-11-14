import { getSourcesWithFollowStatus } from "@/lib/prisma-follows";
import { getCategories } from "@/lib/prisma-categories";
import { getUserId } from "@/lib/auth";
import { SearchClient } from "@/components/search/search-client";
import { prisma } from "@/lib/prisma";

export default async function SearchPage() {
  const userId = await getUserId();
  const categories = await getCategories();

  // Fetch sources with follow status if user is logged in
  const allSources = userId
    ? await getSourcesWithFollowStatus(userId)
    : await prisma.source
        .findMany({
          where: { isActive: true },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { name: "asc" },
        })
        .then((sources) =>
          sources.map((source) => ({
            ...source,
            isFollowed: false,
            categories: source.categories.map((sc) => sc.category),
          }))
        );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Search Channels
          </h1>
          <p className="text-muted-foreground">
            Find channels by name or filter by category
          </p>
        </div>

        <SearchClient
          sources={allSources}
          categories={categories}
          userId={userId}
        />
      </main>
    </div>
  );
}
