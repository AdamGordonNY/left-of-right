import { getUserRole } from "@/lib/auth";
import {
  getSourcesWithFollowStatus,
  getFollowedSources,
} from "@/lib/prisma-follows";
import { Heart, Library } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourceCard } from "@/components/sources/source-card";
import { AddSourceDialog } from "@/components/sources/add-source-dialog";
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <Library className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  My Sources
                </h1>
                <p className="text-sm text-slate-600">
                  Manage your followed channels and personal sources
                </p>
              </div>
            </div>
            <AddSourceDialog isAdmin={isAdmin} />
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
          </TabsList>

          <TabsContent value="followed" className="space-y-6">
            {followedSourcesWithStatus.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 p-8 text-center">
                <div className="rounded-full bg-slate-100 p-6">
                  <Heart className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No sources followed yet
                </h3>
                <p className="mt-2 text-sm text-slate-600 max-w-md">
                  Start following YouTube channels and Substack authors to build
                  your personalized content feed
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600">
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
            <div className="rounded-lg border bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                Discover new sources to follow. Global sources are curated by
                admins, while you can also add your own personal sources.
              </p>
            </div>

            {sourcesWithStatus.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 p-8 text-center">
                <div className="rounded-full bg-slate-100 p-6">
                  <Library className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No sources available
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Add your first source to get started
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600">
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
        </Tabs>
      </main>
    </div>
  );
}
