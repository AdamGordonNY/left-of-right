import { getUserRole } from "@/lib/auth";
import {
  getSourcesWithFollowStatus,
  getFollowedSources,
} from "@/lib/prisma-follows";
import { Heart, Library, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourceCard } from "@/components/sources/source-card";
import { AddSourceDialog } from "@/components/sources/add-source-dialog";
import { SyncYouTubeButton } from "@/components/sources/sync-youtube-button";
import { redirect } from "next/navigation";
import { ensureUserExists } from "@/lib/user-sync";

export default async function MySourcesPage() {
  const dbUserId = await ensureUserExists();

  if (!dbUserId) {
    redirect("/sign-in");
  }

  const role = await getUserRole();
  const isAdmin = role === "admin";

  const [sourcesWithStatus, followedSources] = await Promise.all([
    getSourcesWithFollowStatus(dbUserId),
    getFollowedSources(dbUserId),
  ]);

  console.log("Debug - dbUserId:", dbUserId);
  console.log("Debug - sourcesWithStatus count:", sourcesWithStatus.length);
  console.log("Debug - followedSources count:", followedSources.length);
  console.log(
    "Debug - all sources:",
    JSON.stringify(sourcesWithStatus, null, 2)
  );

  const followedSourcesWithStatus = sourcesWithStatus.filter(
    (s) => s.isFollowed
  );

  console.log(
    "Debug - followedSourcesWithStatus count:",
    followedSourcesWithStatus.length
  );
  console.log(
    "Debug - followedSourcesWithStatus:",
    JSON.stringify(followedSourcesWithStatus, null, 2)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <Library className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  My Sources
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your followed channels and personal sources
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {followedSourcesWithStatus.some((s) => s.type === "youtube") && (
                <SyncYouTubeButton />
              )}
              <AddSourceDialog isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="followed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="followed" className="gap-2">
              <Heart className="h-4 w-4" />
              Following ({followedSourcesWithStatus.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <Library className="h-4 w-4" />
              Discover Sources
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Settings className="h-4 w-4" />
              Manage My Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followed" className="space-y-6">
            {followedSourcesWithStatus.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No sources followed yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Start following YouTube channels and Substack authors to build
                  your personalized content feed
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You are following {followedSourcesWithStatus.length}{" "}
                  {followedSourcesWithStatus.length === 1
                    ? "source"
                    : "sources"}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {followedSourcesWithStatus.map((source) => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Discover new sources to follow. Global sources are curated by
                admins, while you can also add your own personal sources.
              </p>
            </div>

            {sourcesWithStatus.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Library className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No sources available
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first source to get started
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing {sourcesWithStatus.length} available{" "}
                  {sourcesWithStatus.length === 1 ? "source" : "sources"}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sourcesWithStatus.map((source) => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/30 p-4">
              <p className="text-sm text-orange-900 dark:text-orange-100">
                Manage your personal sources. You can edit or delete any source you've created.
              </p>
            </div>

            {sourcesWithStatus.filter((s) => s.createdByUserId === dbUserId).length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Settings className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No personal sources yet
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a personal source to get started
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You have {sourcesWithStatus.filter((s) => s.createdByUserId === dbUserId).length}{" "}
                  personal {sourcesWithStatus.filter((s) => s.createdByUserId === dbUserId).length === 1 ? "source" : "sources"}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sourcesWithStatus
                    .filter((s) => s.createdByUserId === dbUserId)
                    .map((source) => (
                      <SourceCard
                        key={source.id}
                        source={source}
                        showFollowButton={false}
                        currentUserId={dbUserId}
                        isAdmin={isAdmin}
                      />
                    ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
