import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth";
import { Shield } from "lucide-react";
import { AddSourceDialog } from "@/components/sources/add-source-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/admin/category-manager";
import { UsersList } from "@/components/admin/users-list";

export default async function AdminPage() {
  const role = await getUserRole();

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage global sources and platform settings
                </p>
              </div>
            </div>
            <AddSourceDialog isAdmin={true} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">
                  Global Sources
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage sources that are available to all users
                </p>
                <div className="mt-4">
                  <a
                    href="/admin/sources"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View all sources →
                  </a>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">
                  User Management
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  View users, API keys, and followed sources
                </p>
                <div className="mt-4">
                  <a
                    href="/admin/users"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View all users →
                  </a>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground">
                  Analytics
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  View platform usage and engagement metrics
                </p>
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">
                    Coming soon
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use the "Add Source" button above to create new global sources
                  that will be available to all users on the platform.
                </p>
                <p className="text-sm text-muted-foreground">
                  Global sources appear automatically in all users' content
                  feeds and can be followed by individual users for personalized
                  filtering.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
