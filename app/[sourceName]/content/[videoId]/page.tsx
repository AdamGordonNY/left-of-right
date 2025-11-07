import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getContentItemById,
  getAdjacentContentItems,
} from "@/lib/feed-queries";
import { generateSlug } from "@/lib/slug-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface VideoDetailPageProps {
  params: Promise<{
    sourceName: string;
    videoId: string;
  }>;
}

export default async function VideoDetailPage({
  params,
}: VideoDetailPageProps) {
  const { sourceName, videoId } = await params;
  const contentItem = await getContentItemById(videoId);

  if (!contentItem || !contentItem.source) {
    notFound();
  }

  const slug = generateSlug(contentItem.source.name);

  if (slug !== sourceName) {
    notFound();
  }

  const { previous, next } = await getAdjacentContentItems(
    contentItem.source.id,
    contentItem.id,
    contentItem.publishedAt
  );

  const isVideo = contentItem.type === "video";
  const initials = contentItem.source.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Extract YouTube video ID for embedding
  function getYouTubeVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1);
      }
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      }
      return null;
    } catch {
      return null;
    }
  }

  const youtubeVideoId = isVideo ? getYouTubeVideoId(contentItem.url) : null;
  const embedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?rel=0`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link href={`/${slug}/content`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Content
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {isVideo && embedUrl ? (
                <div
                  className="relative w-full overflow-hidden rounded-lg bg-slate-900"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    src={embedUrl}
                    title={contentItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              ) : contentItem.thumbnailUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
                  <img
                    src={contentItem.thumbnailUrl}
                    alt={contentItem.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}{" "}
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Badge className={isVideo ? "bg-red-600" : "bg-blue-600"}>
                    {contentItem.type}
                  </Badge>
                  {contentItem.publishedAt && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {format(
                        new Date(contentItem.publishedAt),
                        "MMMM d, yyyy"
                      )}
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  {contentItem.title}
                </h1>

                {contentItem.description && (
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {contentItem.description}
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <a
                    href={contentItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="w-full sm:w-auto">
                      <ExternalLink className="mr-2 h-5 w-5" />
                      {isVideo ? "Watch on YouTube" : "Read Article"}
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t">
                {next && (
                  <Link href={`/${slug}/content/${next.id}`} className="flex-1">
                    <Button variant="outline" className="w-full justify-start">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      <span className="truncate">Previous: {next.title}</span>
                    </Button>
                  </Link>
                )}
                {previous && (
                  <Link
                    href={`/${slug}/content/${previous.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full justify-end">
                      <span className="truncate">Next: {previous.title}</span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/${slug}`}
                    className="flex items-start gap-3 group"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={contentItem.source.avatarUrl || undefined}
                        alt={contentItem.source.name}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {contentItem.source.name}
                      </p>
                      {contentItem.source.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {contentItem.source.description}
                        </CardDescription>
                      )}
                      <Button variant="link" className="h-auto p-0 mt-2">
                        View Channel →
                      </Button>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
