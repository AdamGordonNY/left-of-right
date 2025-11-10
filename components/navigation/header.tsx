"use client";

import { Layers, Library, Shield, Heart, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user) {
        try {
          const response = await fetch("/api/user/role");
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.role === "admin");
          }
        } catch (error) {
          console.error("Failed to check admin status:", error);
        }
      }
    }
    checkAdminStatus();
  }, [user]);

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Content Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Algorithm-free content discovery
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link href="/my-sources">
                <Button variant="outline" size="sm">
                  <Library className="mr-2 h-4 w-4" />
                  My Sources
                </Button>
              </Link>
              <Link href="/favorites">
                <Button variant="outline" size="sm">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
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
              <ThemeToggle />
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <ThemeToggle />
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
