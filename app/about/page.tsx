import { Info, Shield, Heart, Brain, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "About | Left of Right",
  description:
    "Learn about Left of Right - a distraction-free content platform built for intellectual honesty and ADHD-friendly content consumption.",
};

export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About Left of Right</h1>

      {/* Origin Story */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Why This Exists
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            I built this website to curate specific YouTube content without the
            distraction of the algorithm, and vet for intellectual honesty. All
            the global sources are curated by me, and I've personally seen
            enough from all the channels listed to believe they are primarily
            based in fact first. Most importantly, I haven't added any MAGA
            cheerleading channels - I consider this to be the womb of
            disinformation and bad faith arguments.
          </p>
          <p>
            I have ADHD, and I want to limit my "doomscrolling" as much as
            possible. This site is my answer to the constant distractions of
            modern platforms: autoplay features that keep you watching for
            hours, comment sections that pull you into endless arguments,
            intrusive ads, and algorithms designed to maximize engagement rather
            than value. I wanted to separate the good YouTube content from the
            noise and distractions of the platform.
          </p>
          <p>
            I've been wanting to make a site like this for a long time but
            finally decided to go ahead and just do it at the beginning of
            November 2024. After beating personal troubles a decade ago, I went
            back to school to get a BSc in Computer Programming, just to have AI
            come out 6 months later and kill my job prospects. I haven't even
            made it to an interview stage in over a year, and I'm currently
            draining what's left in my bank account to survive. So I built
            something I believe in.
          </p>
        </CardContent>
      </Card>

      {/* ADHD-Friendly Design */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Built for ADHD Brains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            This platform is designed from the ground up to help people with
            ADHD (and anyone else) consume content in a healthier way:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>No autoplay:</strong> Videos don't start playing
              automatically or suggest "what's next" to keep you watching
              endlessly
            </li>
            <li>
              <strong>No comments section:</strong> Avoid the rabbit hole of
              reading (and responding to) comments that can consume hours
            </li>
            <li>
              <strong>Curated sources:</strong> Pre-vetted channels based on
              intellectual honesty and factual reporting, not algorithmic
              suggestions
            </li>
            <li>
              <strong>Clean interface:</strong> Minimal distractions, clear
              organization, and purposeful navigation
            </li>
            <li>
              <strong>Your choice:</strong> Follow sources you care about,
              create playlists, and favorite content on your own terms
            </li>
          </ul>
          <p>
            The goal is simple: get the value from great content creators
            without the platform's attempts to monopolize your time and
            attention.
          </p>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p className="font-semibold text-foreground">
            I don't track your data. I will never disclose your personal
            information.
          </p>
          <p>
            This site uses Clerk for authentication, which means I don't even
            store your password - that's handled securely by a trusted
            third-party service. Your API keys (if you choose to add them) are
            encrypted in the database.
          </p>
          <p>What data is stored:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Your email and basic profile information (via Clerk)</li>
            <li>
              Sources you follow, favorites you save, and playlists you create
            </li>
            <li>Your API key (encrypted) if you choose to add one</li>
          </ul>
          <p>
            What I <strong>don't</strong> do:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Track your viewing habits across the web</li>
            <li>Sell your data to third parties</li>
            <li>Use analytics to profile you</li>
            <li>Share your information with anyone</li>
            <li>Serve targeted advertisements</li>
          </ul>
          <p>
            This is a passion project, not a data harvesting operation. Your
            privacy is respected because it should be, not because regulations
            require it.
          </p>
        </CardContent>
      </Card>

      {/* Current Limitations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Current Limitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            There is a 10,000 request limit per day from Google's YouTube API. I
            have a backup key so the limit is really 20,000 requests per day,
            however if you follow the instructions in your{" "}
            <Link
              href="/profile"
              className="underline text-foreground font-medium"
            >
              profile
            </Link>{" "}
            and add your own API key, it will massively help the amount of
            content that can be accessed per day, especially as more sources are
            added.
          </p>
          <p>
            The more people who use their own keys, the more overall content
            that can be hosted and shared, distraction free.
          </p>
          <p>
            There are more features I'd like to add in the future, including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Integration with other platforms (podcasts, articles, etc.)</li>
            <li>AI-powered summaries for quick content overviews</li>
            <li>Better discovery features for finding new quality sources</li>
            <li>Community features while maintaining privacy focus</li>
          </ul>
        </CardContent>
      </Card>

      {/* Support */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <Heart className="h-5 w-5 text-red-500" />
        <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
          Support This Project
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            Donations are not required, nor am I motivated by profit. I was
            motivated to build this site to curate content I value, and I
            encourage others to do the same.
          </p>
          <p>
            If you would like to support the site, you can{" "}
            <Link
              href="https://buymeacoffee.com/adamgordonny"
              className="underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              donate here
            </Link>
            . It is not required, but it is appreciated as I continue to build
            and improve this platform.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
