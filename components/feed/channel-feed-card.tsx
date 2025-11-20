import Link from "next/link";
import { Youtube, FileText, ExternalLink, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SourceWithRecentContent } from "@/lib/feed-queries";
import { generateSlug } from "@/lib/slug-utils";
import { format } from "date-fns";
import { FollowButton } from "@/components/sources/follow-button";
import { ViewMode } from "@/hooks/use-view-mode";

interface ChannelFeedCardProps {
  source: SourceWithRecentContent;
  viewMode?: ViewMode;
  userId: string | null;
}

export function ChannelFeedCard({
  source,
  viewMode = "grid",
  userId,
}: ChannelFeedCardProps) {
  const TypeIcon = source.type === "youtube" ? Youtube : FileText;
  const initials = source.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const slug = generateSlug(source.name);

  // List view layout
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
          {/* Left: Avatar and Basic Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link
              href={`/${slug}`}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                <AvatarImage
                  src={source.avatarUrl || undefined}
                  alt={source.name}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/${slug}`}
                className="hover:opacity-80 transition-opacity"
              >
                <h3 className="text-lg sm:text-xl font-bold truncate">
                  {source.name}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                <Badge variant="outline" className="text-xs">
                  <TypeIcon className="mr-1 h-3 w-3" />
                  {source.type}
                </Badge>
                {source.isGlobal && (
                  <Badge variant="secondary" className="text-xs">
                    Global
                  </Badge>
                )}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Visit</span>
                </a>
              </div>
              {source.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground mb-3">
                  {source.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{source.totalContentCount} videos</span>
                {source.recentContent.length > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Latest:{" "}
                      {format(
                        new Date(
                          source.recentContent[0].publishedAt || new Date()
                        ),
                        "MMM d"
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Recent Content Preview */}
          <div className="sm:w-80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Recent Videos</h4>
              <Link href={`/${slug}/content`}>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  View All
                </Button>
              </Link>
            </div>
            {source.recentContent.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No content yet
              </p>
            ) : (
              <ul className="space-y-2">
                {source.recentContent.slice(0, 3).map((content) => (
                  <li key={content.id}>
                    <Link
                      href={`/${slug}/content/${content.id}`}
                      className="group flex items-start gap-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-md transition-colors"
                    >
                      <p className="flex-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {content.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {userId && (
              <div className="pt-2">
                <FollowButton sourceId={source.id} />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Grid view layout (original)
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={source.avatarUrl || undefined}
                alt={source.name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{source.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <TypeIcon className="mr-1 h-3 w-3" />
                  {source.type}
                </Badge>
                {source.isGlobal && (
                  <Badge variant="secondary" className="text-xs">
                    Global
                  </Badge>
                )}
              </div>
            </div>
          </Link>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        {source.description && (
          <CardDescription className="mt-2">
            {source.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recent Videos
            </h3>
            <Link href={`/${slug}/content`}>
              <Button variant="link" size="sm" className="h-auto p-0">
                View All ({source.totalContentCount})
              </Button>
            </Link>
          </div>

          {source.recentContent.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No content available yet
            </p>
          ) : (
            <ul className="space-y-2">
              {source.recentContent.map((content) => (
                <li key={content.id}>
                  <Link
                    href={`/${slug}/content/${content.id}`}
                    className="group flex items-start gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {content.title}
                      </p>
                      {content.publishedAt && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(content.publishedAt), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {userId && (
            <div className="pt-3 border-t">
              <FollowButton sourceId={source.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
