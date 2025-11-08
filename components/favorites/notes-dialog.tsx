"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateFavoriteNotes } from "@/actions/favorites.actions";
import { toast } from "sonner";
import type { ContentItem, Source } from "@prisma/client";

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteId: string;
  contentItem: ContentItem & { source: Source };
  initialNotes: string;
  onNotesUpdate: (notes: string) => void;
}

export function NotesDialog({
  isOpen,
  onClose,
  favoriteId,
  contentItem,
  initialNotes,
  onNotesUpdate,
}: NotesDialogProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    const result = await updateFavoriteNotes(favoriteId, notes);

    if (result.success) {
      toast.success("Notes saved");
      onNotesUpdate(notes);
      onClose();
    } else {
      toast.error(result.error || "Failed to save notes");
    }

    setSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notes for {contentItem.title}</DialogTitle>
          <DialogDescription>
            Add your personal notes about this {contentItem.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Your Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add your thoughts, key points, or anything you want to remember about this content..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {notes.length} characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
