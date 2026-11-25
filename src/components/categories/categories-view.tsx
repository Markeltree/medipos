"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Field, Input, Textarea, Badge } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/shared/misc";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { categorySchema, type CategoryInput } from "@/lib/validators";
import { useDataStore } from "@/store/data-store";
import type { Category } from "@/types";

export function CategoriesView() {
  const categories = useDataStore((s) => s.categories);
  const medicines = useDataStore((s) => s.medicines);
  const deleteCategory = useDataStore((s) => s.deleteCategory);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Category | null>(null);

  const countFor = (id: string) => medicines.filter((m) => m.categoryId === id).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Categories"
        description="Group medicines by therapeutic class. Used for POS filters and reports."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState title="No categories yet" description="Create one to start grouping your catalogue." action={<Button onClick={() => setFormOpen(true)}><Plus /> Add category</Button>} />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id} className="flex items-start gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Tags className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{c.description || "No description"}</p>
                <Badge className="mt-3">{countFor(c.id)} medicines</Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => { setEditing(c); setFormOpen(true); }}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => setToDelete(c)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <CategoryDialog open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete category?"
        description={
          toDelete && countFor(toDelete.id) > 0
            ? `${countFor(toDelete.id)} medicines still use “${toDelete.name}”. Move them to another category first.`
            : `“${toDelete?.name ?? ""}” will be removed.`
        }
        onConfirm={() => {
          if (!toDelete) return;
          if (countFor(toDelete.id) > 0) {
            toast.error("Reassign medicines before deleting this category");
            return;
          }
          deleteCategory(toDelete.id);
          toast.success("Category deleted");
        }}
      />
    </div>
  );
}

function CategoryDialog({ open, onOpenChange, category }: { open: boolean; onOpenChange: (v: boolean) => void; category: Category | null }) {
  const addCategory = useDataStore((s) => s.addCategory);
  const updateCategory = useDataStore((s) => s.updateCategory);
  const form = useForm<CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: { name: "", description: "" } });
  const errors = form.formState.errors;

  React.useEffect(() => {
    if (open) form.reset({ name: category?.name ?? "", description: category?.description ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const submit = (v: CategoryInput) => {
    if (category) {
      updateCategory(category.id, v);
      toast.success("Category updated");
    } else {
      addCategory(v.name, v.description);
      toast.success(`${v.name} added`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader title={category ? "Edit category" : "Add category"} />
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <Field label="Name" error={errors.name?.message}>
              <Input aria-invalid={!!errors.name} placeholder="e.g. Dermatology" {...form.register("name")} />
            </Field>
            <Field label="Description" error={errors.description?.message} hint="Optional">
              <Textarea rows={3} aria-invalid={!!errors.description} {...form.register("description")} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{category ? "Save changes" : "Add category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
