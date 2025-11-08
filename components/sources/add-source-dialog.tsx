"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().max(100).optional(),
  type: z.enum(["youtube", "substack"]),
  handle: z.string().min(1, "Handle/username is required"),
  description: z.string().max(500).optional(),
  isGlobal: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSourceDialogProps {
  isAdmin: boolean;
}

export function AddSourceDialog({ isAdmin }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "youtube",
      handle: "",
      description: "",
      isGlobal: false,
    },
  });

  const watchedType = form.watch("type");
  const watchedHandle = form.watch("handle");

  // Build full URL from handle
  const getFullUrl = (type: string, handle: string): string => {
    if (!handle) return "";

    const cleanHandle = handle.trim().replace(/^@/, "");

    if (type === "youtube") {
      return `https://youtube.com/@${cleanHandle}`;
    } else {
      // Remove .substack.com if user included it
      const subdomain = cleanHandle.replace(/\.substack\.com$/, "");
      return `https://${subdomain}.substack.com`;
    }
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    try {
      const url = getFullUrl(values.type, values.handle);

      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          url,
          fetchMetadata: true, // Tell the API to fetch channel info
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add source");
      }

      const { source } = await response.json();

      toast.success(
        values.isGlobal && isAdmin
          ? "Global source added successfully"
          : "Personal source added successfully"
      );

      form.reset();
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to add source");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Source</DialogTitle>
          <DialogDescription>
            Add a YouTube channel or Substack author. We'll automatically fetch
            the channel info and avatar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube Channel</SelectItem>
                      <SelectItem value="substack">Substack Author</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Leave empty to auto-fetch from channel"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    We'll automatically use the channel's official name if left
                    empty
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedType === "youtube"
                      ? "Channel Handle"
                      : "Substack Username"}
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center flex-1">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-sm">
                        {watchedType === "youtube"
                          ? "youtube.com/@"
                          : ".substack.com"}
                      </span>
                      <FormControl>
                        <Input
                          placeholder={
                            watchedType === "youtube"
                              ? "channelname"
                              : "username"
                          }
                          {...field}
                          className="rounded-l-none"
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/^@/, "")
                              .replace(/\.substack\.com$/, "");
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormDescription>
                    {watchedType === "youtube"
                      ? 'Just the handle without @ symbol (e.g., "mkbhd")'
                      : 'Just the username (e.g., "platformer")'}
                  </FormDescription>
                  {watchedHandle && (
                    <p className="text-xs text-slate-500 mt-1">
                      Full URL: {getFullUrl(watchedType, watchedHandle)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the source..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAdmin && (
              <FormField
                control={form.control}
                name="isGlobal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Global Source</FormLabel>
                      <FormDescription>
                        Make this source available to all users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Source"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
