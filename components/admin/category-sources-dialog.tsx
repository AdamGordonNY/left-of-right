"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@prisma/client";

interface Source {
  id: string;
  name: string;
  type: string;
  avatarUrl: string | null;
  isGlobal: boolean;
}

interface CategorySourcesDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function CategorySourcesDialog({
  category,
  open,
  onOpenChange,
  onUpdate,
}: CategorySourcesDialogProps) {
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [assignedSourceIds, setAssignedSourceIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && category) {
      loadSources();
      loadCategorySources();
    }
  }, [open, category]);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      if (res.ok) {
        const data = await res.json();
        setAllSources(data.sources || []);
      }
    } catch (error) {
      console.error("Failed to load sources:", error);
      toast({
        title: "Error",
        description: "Failed to load sources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategorySources = async () => {
    if (!category) return;

    try {
      const res = await fetch(
        `/api/categories/${category.id}?includeSources=true`
      );
      if (res.ok) {
        const data = await res.json();
        const sourceIds = new Set<string>(
          data.category.sources?.map((s: any) => s.source.id as string) || []
        );
        setAssignedSourceIds(sourceIds);
      }
    } catch (error) {
      console.error("Failed to load category sources:", error);
    }
  };

  const toggleSource = async (sourceId: string) => {
    if (!category || saving) return;

    const isCurrentlyAssigned = assignedSourceIds.has(sourceId);
    setSaving(sourceId);

    try {
      if (isCurrentlyAssigned) {
        // Remove from category
        const res = await fetch(
          `/api/sources/${sourceId}/categories/${category.id}`,
          {
            method: "DELETE",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to remove source from category");
        }

        setAssignedSourceIds((prev) => {
          const next = new Set(prev);
          next.delete(sourceId);
          return next;
        });

        toast({
          title: "Success",
          description: "Source removed from category",
        });
      } else {
        // Add to category
        const res = await fetch(`/api/sources/${sourceId}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: category.id }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to add source to category");
        }

        setAssignedSourceIds((prev) => {
          const next = new Set(prev);
          next.add(sourceId);
          return next;
        });

        toast({
          title: "Success",
          description: "Source added to category",
        });
      }

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const filteredSources = allSources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = assignedSourceIds.size;

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color || "#6366f1" }}
            />
            Manage Sources for "{category.name}"
          </DialogTitle>
          <DialogDescription>
            Select which sources belong to this category. {assignedCount}{" "}
            {assignedCount === 1 ? "source" : "sources"} currently assigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredSources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sources found
                </p>
              ) : (
                filteredSources.map((source) => {
                  const isAssigned = assignedSourceIds.has(source.id);
                  const isSaving = saving === source.id;

                  return (
                    <div
                      key={source.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isAssigned
                          ? "bg-primary/5 border-primary/20"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {source.avatarUrl && (
                          <img
                            src={source.avatarUrl}
                            alt={source.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{source.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground capitalize">
                              {source.type}
                            </span>
                            {source.isGlobal && (
                              <Badge variant="secondary" className="text-xs">
                                Global
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isAssigned ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSource(source.id)}
                        disabled={isSaving}
                        className="flex-shrink-0"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isAssigned ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Assigned
                          </>
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
