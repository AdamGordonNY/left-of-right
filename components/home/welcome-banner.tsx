import { Info, Heart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
export function WelcomeBanner() {
  return (
    <Alert className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
        Welcome to your distraction-free content feed!
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-3">
        <p>
          I built this website to curate specific YouTube content without the
          distraction of the algorithm, and vet for intellectual honesty. All
          the global sources are curated by me, and I've personally seen enough
          from all the channels listed to believe they are primarily based in
          fact first. Most importantly, I haven't added any MAGA cheerleading
          channels - I consider this to be the womb of disinformation and bad
          faith arguments.
        </p>
        <p>
          <strong>Current Limitations:</strong> There is a 10,000 request limit
          per day from Google. I have a backup key so the limit is really 20,000
          requests per day, however if you follow the instructions in your
          profile and add your own API key, it will massively help the amount of
          content that can be accessed per day, especially as more sources are
          added. The more people who use their own keys, the more overall
          content that can be hosted and shared, distraction free. There are
          more features I'd like to add in the future, including plugging into
          other platforms, potentially AI summaries, I've been wanting to make a
          site like this for a long time but finally decided to go ahead and
          just do it at the beginning of November 2025.
        </p>
        <p className="flex items-start gap-2">
          <Heart className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
          <span>
            Donations are not required, nor am I motivated by profit, I was
            motivated to build this site to curate content I value, and I
            encourage others to do the same. I wanted to separate the good
            youtube content from the noise and distractions of the platform,
            such as autoplay, the comments section, constant ads (Pie AdBlocker
            was a great find after Adblock Plus broke). I have ADHD, and I want
            to limit my "doomscrolling" as much as possible. If you would like
            to support the site, you can{" "}
            <Link
              href="https://buymeacoffee.com/adamgordonny"
              className="underline font-medium"
            >
              donate here
            </Link>
            . It is not required, but it is appreciated. I beat personal
            troubles a decade ago, went back to school to get a BSc in Computer
            Programming, just to have AI come out 6 months later and kill my job
            prospects - I haven't even made it to an interview stage in over a
            year, and I'm currently draining what's left in my bank account to
            survive, so any help is appreciated.
          </span>
        </p>
      </AlertDescription>
    </Alert>
  );
}
