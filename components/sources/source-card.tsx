"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Youtube, FileText, ExternalLink, Heart, Users } from "lucide-react";
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
import { SourceWithFollowStatus } from "@/lib/prisma-follows";
import { toast } from "sonner";

interface SourceCardProps {
  source: SourceWithFollowStatus;
  showFollowButton?: boolean;
}

export function SourceCard({
  source,
  showFollowButton = true,
}: SourceCardProps) {
  const [isFollowing, setIsFollowing] = useState(source.isFollowed);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFollowToggle = async () => {
    setIsLoading(true);

    try {
      if (isFollowing) {
        const response = await fetch(`/api/follows?sourceId=${source.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to unfollow");
        }

        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId: source.id }),
        });

        if (!response.ok) {
          throw new Error("Failed to follow");
        }

        setIsFollowing(true);
        toast.success("Following successfully");
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const TypeIcon = source.type === "youtube" ? Youtube : FileText;
  const initials = source.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Create URL-friendly slug from source name
  const sourceSlug = source.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const handleViewContent = () => {
    router.push(`/${sourceSlug}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-12 w-12 cursor-pointer"
              onClick={handleViewContent}
            >
              <AvatarImage
                src={source.avatarUrl || undefined}
                alt={source.name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle
                className="text-lg cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleViewContent}
              >
                {source.name}
              </CardTitle>
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
          </div>
          {showFollowButton && (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={handleFollowToggle}
              disabled={isLoading}
            >
              <Heart
                className={`mr-1 h-4 w-4 ${isFollowing ? "fill-current" : ""}`}
              />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </CardHeader>
      {(source.description || source.followerCount !== undefined) && (
        <CardContent>
          {source.description && (
            <CardDescription className="mb-3">
              {source.description}
            </CardDescription>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {source.followerCount !== undefined && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-1 h-4 w-4" />
                  {source.followerCount}{" "}
                  {source.followerCount === 1 ? "follower" : "followers"}
                </div>
              )}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Visit Source
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/${sourceSlug}`)}
            >
              View Content
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
