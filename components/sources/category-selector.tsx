"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@prisma/client";

interface CategorySelectorProps {
  sourceId: string;
  selectedCategories?: Category[];
  onUpdate?: () => void;
}

export function CategorySelector({
  sourceId,
  selectedCategories = [],
  onUpdate,
}: CategorySelectorProps) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category[]>(selectedCategories);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSelected(selectedCategories);
  }, [selectedCategories]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setAllCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const addCategory = async (categoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sources/${sourceId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add category");
      }

      const category = allCategories.find((c) => c.id === categoryId);
      if (category) {
        setSelected([...selected, category]);
      }

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCategory = async (categoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sources/${sourceId}/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to remove category");
      }

      setSelected(selected.filter((c) => c.id !== categoryId));

      toast({
        title: "Success",
        description: "Category removed successfully",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (categoryId: string) =>
    selected.some((c) => c.id === categoryId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((category) => (
          <Badge
            key={category.id}
            variant="secondary"
            className="gap-1"
            style={{
              backgroundColor: `${category.color}20`,
              borderColor: category.color || undefined,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color || "#6366f1" }}
            />
            {category.name}
            <button
              type="button"
              onClick={() => removeCategory(category.id)}
              disabled={loading}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            + Add Category
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {allCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    if (isSelected(category.id)) {
                      removeCategory(category.id);
                    } else {
                      addCategory(category.id);
                    }
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color || "#6366f1" }}
                    />
                    {category.name}
                  </div>
                  {isSelected(category.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
