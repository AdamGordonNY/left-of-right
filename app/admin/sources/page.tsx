import { redirect } from "next/navigation";
import { getUserRole, getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddSourceDialog } from "@/components/sources/add-source-dialog";
import { EditSourceDialog } from "@/components/sources/edit-source-dialog";
import { DeleteSourceDialog } from "@/components/sources/delete-source-dialog";

async function getGlobalSources() {
  return prisma.source.findMany({
    where: { isGlobal: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      description: true,
      avatarUrl: true,
      isActive: true,
      isGlobal: true,
      createdByUserId: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        select: {
          category: true,
        },
      },
    },
  });
}

export default async function AdminSourcesPage() {
  const role = await getUserRole();

  if (role !== "admin") {
    redirect("/");
  }

  const sources = await getGlobalSources();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Global Sources
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Sources available to all users
                  </p>
                </div>
              </div>
            </div>
            <AddSourceDialog isAdmin={true} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {sources.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
            <div className="rounded-full bg-muted p-6">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No global sources yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first global source to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {sources.length} global{" "}
              {sources.length === 1 ? "source" : "sources"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {source.name}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {source.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <EditSourceDialog
                        source={{
                          ...source,
                          categories: source.categories.map(
                            (sc) => sc.category
                          ),
                        }}
                        isAdmin={true}
                      />
                      <DeleteSourceDialog
                        sourceId={source.id}
                        sourceName={source.name}
                      />
                    </div>
                  </div>
                  {source.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {source.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      View Source
                    </a>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        source.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {source.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
