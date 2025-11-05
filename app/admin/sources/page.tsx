import { redirect } from 'next/navigation';
import { getUserRole, getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Source } from '@/lib/database.types';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AddSourceDialog } from '@/components/sources/add-source-dialog';

async function getGlobalSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_global', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export default async function AdminSourcesPage() {
  const role = await getUserRole();

  if (role !== 'admin') {
    redirect('/');
  }

  const sources = await getGlobalSources();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
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
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Global Sources
                  </h1>
                  <p className="text-sm text-slate-600">
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
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 p-8 text-center">
            <div className="rounded-full bg-slate-100 p-6">
              <Shield className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No global sources yet
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Add your first global source to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Showing {sources.length} global {sources.length === 1 ? 'source' : 'sources'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{source.name}</h3>
                      <p className="text-sm text-slate-600 capitalize mt-1">
                        {source.type}
                      </p>
                    </div>
                  </div>
                  {source.description && (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                      {source.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Source
                    </a>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        source.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {source.is_active ? 'Active' : 'Inactive'}
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
