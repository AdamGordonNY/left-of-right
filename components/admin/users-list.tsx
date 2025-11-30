"use client";

import { useEffect, useState } from "react";
import { Check, X, ChevronDown, ChevronUp, Loader2, Key } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserFollow {
  id: string;
  sourceId: string;
  source: {
    id: string;
    name: string;
    type: string;
    isGlobal: boolean;
  };
}

interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: string;
  hasApiKey: boolean;
  createdAt: string;
  follows: UserFollow[];
}

export function UsersList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const getFullName = (user: UserData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || "No name";
  };

  const getInitials = (user: UserData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.lastName) return user.lastName[0].toUpperCase();
    return user.email[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const globalFollows = (follows: UserFollow[]) =>
    follows.filter((f) => f.source.isGlobal);
  const localFollows = (follows: UserFollow[]) =>
    follows.filter((f) => !f.source.isGlobal);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">All Users</h2>
          <p className="text-sm text-muted-foreground">
            {users.length} {users.length === 1 ? "user" : "users"} registered
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const isExpanded = expandedUserId === user.id;
          const globalSources = globalFollows(user.follows);
          const localSources = localFollows(user.follows);

          return (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.imageUrl || undefined} />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">
                          {getFullName(user)}
                        </CardTitle>
                        {user.role === "admin" && (
                          <Badge variant="destructive" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {user.email}
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Key className="h-3.5 w-3.5" />
                          <span>API Key:</span>
                          {user.hasApiKey ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-3.5 w-3.5" />
                              <span className="font-medium">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <X className="h-3.5 w-3.5" />
                              <span className="font-medium">No</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Following: {user.follows.length} sources
                          {globalSources.length > 0 && (
                            <span className="ml-1">
                              ({globalSources.length} global,{" "}
                              {localSources.length} local)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {user.follows.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(user.id)}
                    >
                      {isExpanded ? (
                        <>
                          Hide Sources
                          <ChevronUp className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show Sources
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {isExpanded && user.follows.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {globalSources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          Global Sources
                          <Badge variant="secondary" className="text-xs">
                            {globalSources.length}
                          </Badge>
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {globalSources.map((follow) => (
                            <div
                              key={follow.id}
                              className="flex items-center gap-2 rounded-md border p-2 text-sm"
                            >
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {follow.source.type}
                              </Badge>
                              <span className="truncate">
                                {follow.source.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {localSources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          Local Sources
                          <Badge variant="secondary" className="text-xs">
                            {localSources.length}
                          </Badge>
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {localSources.map((follow) => (
                            <div
                              key={follow.id}
                              className="flex items-center gap-2 rounded-md border p-2 text-sm"
                            >
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {follow.source.type}
                              </Badge>
                              <span className="truncate">
                                {follow.source.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
