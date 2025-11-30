"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Video,
  Users,
} from "lucide-react";
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
import { format } from "date-fns";

interface SyncLog {
  id: string;
  userId: string;
  sourceId: string | null;
  sourceName: string | null;
  syncType: string;
  status: string;
  videosAdded: number;
  videosFailed: number;
  totalProcessed: number;
  errorMessage: string | null;
  failedVideos: any;
  metadata: any;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

export function SyncLogsList() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/admin/sync-logs");
      if (!response.ok) throw new Error("Failed to fetch sync logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Success
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Partial
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getUserName = (log: SyncLog) => {
    if (log.user.firstName && log.user.lastName) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    return log.user.firstName || log.user.lastName || log.user.email;
  };

  const getInitials = (log: SyncLog) => {
    if (log.user.firstName && log.user.lastName) {
      return `${log.user.firstName[0]}${log.user.lastName[0]}`.toUpperCase();
    }
    return log.user.email[0].toUpperCase();
  };

  const getDuration = (log: SyncLog) => {
    if (!log.completedAt) return "In progress";
    const start = new Date(log.startedAt);
    const end = new Date(log.completedAt);
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Sync History</h2>
          <p className="text-sm text-muted-foreground">
            {logs.length} {logs.length === 1 ? "sync" : "syncs"} recorded
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const isExpanded = expandedLogId === log.id;

          return (
            <Card key={log.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getStatusIcon(log.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="text-base">
                          {log.syncType === "bulk_sync"
                            ? "Bulk Sync"
                            : log.sourceName || "Source Sync"}
                        </CardTitle>
                        {getStatusBadge(log.status)}
                        <Badge variant="outline" className="text-xs">
                          {log.syncType === "bulk_sync" ? (
                            <Users className="mr-1 h-3 w-3" />
                          ) : (
                            <Video className="mr-1 h-3 w-3" />
                          )}
                          {log.syncType === "bulk_sync"
                            ? `${log.totalProcessed} sources`
                            : "Single source"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={log.user.imageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(log)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {getUserName(log)}
                        </span>
                      </div>

                      <CardDescription className="text-xs">
                        {format(new Date(log.startedAt), "PPpp")} •{" "}
                        {getDuration(log)} •{" "}
                        <span className="text-green-600 font-medium">
                          {log.videosAdded} added
                        </span>
                        {log.videosFailed > 0 && (
                          <>
                            {" "}
                            •{" "}
                            <span className="text-red-600 font-medium">
                              {log.videosFailed} failed
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  {(log.errorMessage ||
                    (log.failedVideos && log.failedVideos.length > 0) ||
                    log.metadata) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(log.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  {log.errorMessage && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-red-600">
                        Error Message
                      </h4>
                      <p className="text-sm text-muted-foreground bg-red-50 p-3 rounded-md border border-red-200">
                        {log.errorMessage}
                      </p>
                    </div>
                  )}

                  {log.failedVideos && log.failedVideos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Failed Items ({log.failedVideos.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {log.failedVideos.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm bg-muted p-2 rounded-md"
                          >
                            <div className="font-medium truncate">
                              {item.title || item.sourceName}
                            </div>
                            {item.url && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.url}
                              </div>
                            )}
                            {item.error && (
                              <div className="text-xs text-red-600 mt-1">
                                {item.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {log.metadata && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Additional Details
                      </h4>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {logs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No sync logs found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
