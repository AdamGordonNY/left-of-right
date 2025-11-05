import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth';
import { Shield } from 'lucide-react';
import { AddSourceDialog } from '@/components/sources/add-source-dialog';

export default async function AdminPage() {
  const role = await getUserRole();

  if (role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  Manage global sources and platform settings
                </p>
              </div>
            </div>
            <AddSourceDialog isAdmin={true} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Global Sources</h3>
            <p className="mt-2 text-sm text-slate-600">
              Manage sources that are available to all users
            </p>
            <div className="mt-4">
              <a
                href="/admin/sources"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all sources →
              </a>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
            <p className="mt-2 text-sm text-slate-600">
              Manage user roles and permissions
            </p>
            <div className="mt-4">
              <span className="text-sm text-slate-500">Coming soon</span>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
            <p className="mt-2 text-sm text-slate-600">
              View platform usage and engagement metrics
            </p>
            <div className="mt-4">
              <span className="text-sm text-slate-500">Coming soon</span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Use the "Add Source" button above to create new global sources that will be
              available to all users on the platform.
            </p>
            <p className="text-sm text-slate-600">
              Global sources appear automatically in all users' content feeds and can be
              followed by individual users for personalized filtering.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
