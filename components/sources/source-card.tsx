"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Youtube,
  FileText,
  ExternalLink,
  Heart,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SourceWithFollowStatus } from "@/lib/prisma-follows";
import { EditSourceDialog } from "@/components/sources/edit-source-dialog";
import { DeleteSourceDialog } from "@/components/sources/delete-source-dialog";
import { toast } from "sonner";

interface SourceCardProps {
  source: SourceWithFollowStatus;
  showFollowButton?: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  viewMode?: "grid" | "list";
}

export function SourceCard({
  source,
  showFollowButton = true,
  currentUserId = null,
  isAdmin = false,
  viewMode = "grid",
}: SourceCardProps) {
  const [isFollowing, setIsFollowing] = useState(source.isFollowed);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const canEdit =
    isAdmin || (currentUserId && source.createdByUserId === currentUserId);
  const showActions = canEdit && !showFollowButton;

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

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
          <Avatar
            className="h-16 w-16 sm:h-16 sm:w-16 flex-shrink-0 cursor-pointer mx-auto sm:mx-0"
            onClick={handleViewContent}
          >
            <AvatarImage
              src={source.avatarUrl || undefined}
              alt={source.name}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle
                  className="text-base sm:text-lg cursor-pointer hover:text-blue-600 transition-colors mb-2 text-center sm:text-left"
                  onClick={handleViewContent}
                >
                  {source.name}
                </CardTitle>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    <TypeIcon className="mr-1 h-3 w-3" />
                    {source.type}
                  </Badge>
                  {source.isGlobal && (
                    <Badge variant="secondary" className="text-xs">
                      Global
                    </Badge>
                  )}
                  {!source.isActive && (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  {source.categories?.map((sc) => (
                    <Badge
                      key={sc.id}
                      className="text-xs"
                      style={{
                        backgroundColor: sc.color || "#6366f1",
                        color: "white",
                      }}
                    >
                      {sc.name}
                    </Badge>
                  ))}
                </div>
                {source.description && (
                  <CardDescription className="line-clamp-2 mb-2 text-center sm:text-left text-xs sm:text-sm">
                    {source.description}
                  </CardDescription>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {source.followerCount !== undefined && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <Users className="mr-1 h-3 sm:h-4 w-3 sm:w-4" />
                      <span className="whitespace-nowrap">
                        {source.followerCount}{" "}
                        {source.followerCount === 1 ? "follower" : "followers"}
                      </span>
                    </div>
                  )}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center sm:justify-start text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span className="whitespace-nowrap">Visit Source</span>
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-shrink-0">
                {showFollowButton && (
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    <Heart
                      className={`mr-1 h-3 sm:h-4 w-3 sm:w-4 ${
                        isFollowing ? "fill-current" : ""
                      }`}
                    />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EditSourceDialog
                        source={source}
                        isAdmin={isAdmin}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DeleteSourceDialog
                        sourceId={source.id}
                        sourceName={source.name}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <TypeIcon className="mr-1 h-3 w-3" />
                  {source.type}
                </Badge>
                {source.isGlobal && (
                  <Badge variant="secondary" className="text-xs">
                    Global
                  </Badge>
                )}
                {!source.isActive && (
                  <Badge variant="destructive" className="text-xs">
                    Inactive
                  </Badge>
                )}
                {source.categories?.map((sc) => (
                  <Badge
                    key={sc.id}
                    className="text-xs"
                    style={{
                      backgroundColor: sc.color || "#6366f1",
                      color: "white",
                    }}
                  >
                    {sc.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showFollowButton && (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={isLoading}
              >
                <Heart
                  className={`mr-1 h-4 w-4 ${
                    isFollowing ? "fill-current" : ""
                  }`}
                />
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <EditSourceDialog
                    source={source}
                    isAdmin={isAdmin}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                  <DeleteSourceDialog
                    sourceId={source.id}
                    sourceName={source.name}
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
