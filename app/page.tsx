import { getUserId, getUserRole } from '@/lib/auth';
import { getFollowedSources } from '@/lib/follows';
import { Layers, UserPlus, Shield, Library } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Source } from '@/lib/database.types';

export default async function Home() {
  const userId = await getUserId();
  const role = userId ? await getUserRole() : 'member';
  const isAdmin = role === 'admin';

  let followedSources: Source[] = [];
  if (userId) {
    followedSources = await getFollowedSources(userId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Content Hub
                </h1>
                <p className="text-sm text-slate-600">
                  Algorithm-free content discovery
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SignedIn>
                <Link href="/my-sources">
                  <Button variant="outline" size="sm">
                    <Library className="mr-2 h-4 w-4" />
                    My Sources
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Take Control of Your Content Feed
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Follow your favorite YouTube channels and Substack authors without the
            algorithm. Build a personalized feed that shows only what you want to see.
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {followedSources.length > 0 ? (
              <div className="mt-8">
                <Link href="/my-sources">
                  <Button size="lg" className="text-lg px-8 py-6">
                    View My Feed ({followedSources.length} Sources)
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <Link href="/my-sources">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Add Your First Source
                  </Button>
                </Link>
              </div>
            )}
          </SignedIn>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-lg border bg-white shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Library className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Follow Your Favorites
            </h3>
            <p className="text-sm text-slate-600">
              Add YouTube channels and Substack authors you love to build your
              personalized library
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border bg-white shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Layers className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Algorithm-Free
            </h3>
            <p className="text-sm text-slate-600">
              See content chronologically from sources you choose, without
              recommendations or ads
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border bg-white shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Curated & Personal
            </h3>
            <p className="text-sm text-slate-600">
              Access admin-curated global sources or add your own private channels
            </p>
          </div>
        </div>

        <SignedIn>
          {followedSources.length > 0 && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Your Followed Sources
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {followedSources.slice(0, 6).map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {source.name}
                        </p>
                        <p className="text-sm text-slate-600 capitalize">
                          {source.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {followedSources.length > 6 && (
                  <Link href="/my-sources">
                    <Button variant="link" className="mt-4">
                      View all {followedSources.length} sources →
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </SignedIn>
      </main>

      <footer className="mt-16 border-t bg-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-600">
            Content aggregation platform built with Next.js 15 and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
