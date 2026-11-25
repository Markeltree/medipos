"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogBody, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmation step for destructive actions. Controlled by the parent:
 * open the dialog, and run onConfirm only after the user agrees.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader title={title} />
        <DialogBody className="flex gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
            <AlertTriangle className="size-4" />
          </span>
          <p className="text-sm text-muted">{description}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
