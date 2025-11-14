import Link from "next/link";
import { Shield, Info, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-900/50 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              About
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A distraction-free platform for curating content from sources you
              trust, built with ADHD-friendly design principles.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Quick Links</h3>
            <nav className="space-y-2">
              <Link
                href="/search"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Search Channels
              </Link>
              <Link
                href="/categories"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Categories
              </Link>
              <Link
                href="/about"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/privacy"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/my-sources"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Sources
              </Link>
              <Link
                href="/favorites"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Favorites
              </Link>
            </nav>
          </div>

          {/* Privacy & Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy & Support
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>We respect your privacy. No tracking, no data selling.</p>
              <a
                href="https://buymeacoffee.com/adamgordonny"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className="h-4 w-4 text-red-500" />
                Support this project
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Left of Right. Built with purpose, not profit.</p>
        </div>
      </div>
    </footer>
  );
}
