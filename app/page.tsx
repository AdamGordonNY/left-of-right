import { getUserId } from "@/lib/auth";
import {
  getFollowedSourcesWithRecentContent,
  getGlobalSourcesWithRecentContent,
} from "@/lib/feed-queries";
import { Heart, Library } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChannelFeedCard } from "@/components/feed/channel-feed-card";
import { WelcomeBanner } from "@/components/home/welcome-banner";

export default async function Home() {
  const userId = await getUserId();

  let sources = [];
  let isPersonalFeed = false;

  if (userId) {
    const followedSources = await getFollowedSourcesWithRecentContent(userId);
    if (followedSources.length > 0) {
      sources = followedSources;
      isPersonalFeed = true;
    } else {
      sources = await getGlobalSourcesWithRecentContent();
    }
  } else {
    sources = await getGlobalSourcesWithRecentContent();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <WelcomeBanner />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {isPersonalFeed ? "Your Feed" : "Discover Content"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isPersonalFeed
                  ? "Latest content from channels you follow"
                  : "Explore curated channels and content"}
              </p>
            </div>
            {userId && (
              <Link href="/my-sources">
                <Button variant="outline">
                  <Library className="mr-2 h-4 w-4" />
                  Manage Sources
                </Button>
              </Link>
            )}
          </div>

          {userId && !isPersonalFeed && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4 mb-6">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    You're not following any channels yet
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Start following channels to build your personalized feed.
                    Browse global sources below or{" "}
                    <Link href="/my-sources" className="underline font-medium">
                      manage your sources
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {sources.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 dark:bg-slate-900/50 p-8 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
              <Library className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No content available
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              There are no active sources yet. Check back soon for new content!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {sources.map((source) => (
              <ChannelFeedCard key={source.id} source={source} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
