import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth";
import { Users } from "lucide-react";
import { UsersList } from "@/components/admin/users-list";

export default async function AdminUsersPage() {
  const role = await getUserRole();

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                User Management
              </h1>
              <p className="text-sm text-muted-foreground">
                View and manage platform users
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <UsersList />
      </main>
    </div>
  );
}
