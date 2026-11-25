"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Mail, MoreHorizontal, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PurchaseStatusBadge, PaymentBadge } from "@/components/shared/status-badge";
import { useDataStore } from "@/store/data-store";
import { supplierSchema, type SupplierInput } from "@/lib/validators";
import { formatDate, formatNumber, formatPKR } from "@/lib/utils";
import type { Supplier } from "@/types";
import { Wallet, Truck } from "lucide-react";

export function SuppliersView() {
  const suppliers = useDataStore((s) => s.suppliers);
  const purchases = useDataStore((s) => s.purchases);
  const deleteSupplier = useDataStore((s) => s.deleteSupplier);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [viewing, setViewing] = React.useState<Supplier | null>(null);
  const [toDelete, setToDelete] = React.useState<Supplier | null>(null);

  const totals = React.useMemo(() => {
    const byId = new Map<string, number>();
    purchases
      .filter((p) => p.status !== "Cancelled" && p.status !== "Draft")
      .forEach((p) => byId.set(p.supplierId, (byId.get(p.supplierId) ?? 0) + p.total));
    return byId;
  }, [purchases]);

  const outstanding = suppliers.reduce((s, x) => s + x.outstandingBalance, 0);

  const columns = React.useMemo<ColumnDef<Supplier, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Supplier",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted">{row.original.address}</p>
          </div>
        ),
      },
      { accessorKey: "contactPerson", header: "Contact" },
      {
        accessorKey: "phone",
        header: "Phone / Email",
        cell: ({ row }) => (
          <div className="text-[13px]">
            <p>{row.original.phone}</p>
            <p className="text-xs text-muted">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: "total",
        accessorFn: (s) => totals.get(s.id) ?? 0,
        header: "Total purchases",
        cell: ({ getValue }) => <span className="tabular-nums">{formatPKR(Number(getValue()))}</span>,
      },
      {
        accessorKey: "outstandingBalance",
        header: "Outstanding",
        cell: ({ getValue }) => {
          const v = Number(getValue());
          return <span className={v > 0 ? "font-medium tabular-nums text-warning" : "tabular-nums text-muted"}>{formatPKR(v)}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <Badge tone={getValue() === "Active" ? "success" : "neutral"}>{String(getValue())}</Badge>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setViewing(row.original)}>
                  <Eye /> View details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { setEditing(row.original); setFormOpen(true); }}>
                  <Pencil /> Edit supplier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setToDelete(row.original)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [totals],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Suppliers"
        description="Distributors and wholesalers you buy stock from"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add supplier
          </Button>
        }
      />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <StatCard label="Active suppliers" value={formatNumber(suppliers.filter((s) => s.status === "Active").length)} icon={<Truck className="size-4" />} tone="primary" />
        <StatCard label="Outstanding balance" value={formatPKR(outstanding)} icon={<Wallet className="size-4" />} tone="warning" />
        <StatCard label="Lifetime purchases" value={formatPKR([...totals.values()].reduce((a, b) => a + b, 0))} icon={<Wallet className="size-4" />} tone="accent" />
      </section>

      <Card className="overflow-hidden">
        <DataTable<Supplier>
          data={suppliers}
          columns={columns}
          searchPlaceholder="Search supplier or contact…"
          onRowClick={(s) => setViewing(s)}
          emptyTitle="No suppliers yet"
          emptyAction={<Button size="sm" onClick={() => setFormOpen(true)}><Plus /> Add supplier</Button>}
        />
      </Card>

      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editing} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent side="right">
          {viewing && <SupplierDetail supplier={viewing} onEdit={() => { setEditing(viewing); setViewing(null); setFormOpen(true); }} onClose={() => setViewing(null)} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete supplier?"
        description={`${toDelete?.name ?? ""} will be removed. Existing purchase orders keep their supplier name on file.`}
        onConfirm={() => {
          if (toDelete) {
            deleteSupplier(toDelete.id);
            toast.success("Supplier deleted");
          }
        }}
      />
    </div>
  );
}

function SupplierDetail({ supplier: s, onEdit, onClose }: { supplier: Supplier; onEdit: () => void; onClose: () => void }) {
  const purchases = useDataStore((s2) => s2.purchases).filter((p) => p.supplierId === s.id);
  const medicines = useDataStore((s2) => s2.medicines);
  return (
    <>
      <DialogHeader title={s.name} description={s.address} />
      <DialogBody className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-muted" />{s.phone}</span>
          <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5 text-muted" />{s.email}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted">Contact person</p>
            <p className="mt-0.5 font-medium">{s.contactPerson}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted">Outstanding balance</p>
            <p className="mt-0.5 font-semibold tabular-nums text-warning">{formatPKR(s.outstandingBalance)}</p>
          </Card>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Purchase history</p>
          {purchases.length === 0 ? (
            <EmptyState compact title="No purchases from this supplier" />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs">{p.invoiceNumber}</p>
                    <p className="text-xs text-muted">
                      {formatDate(p.purchaseDate)} · {p.items.length} lines ·{" "}
                      {p.items.map((i) => medicines.find((m) => m.id === i.medicineId)?.name).filter(Boolean).slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium tabular-nums">{formatPKR(p.total)}</span>
                    <div className="flex gap-1"><PurchaseStatusBadge status={p.status} /><PaymentBadge status={p.paymentStatus} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={onEdit}><Pencil /> Edit supplier</Button>
      </DialogFooter>
    </>
  );
}

function SupplierFormDialog({ open, onOpenChange, supplier }: { open: boolean; onOpenChange: (v: boolean) => void; supplier: Supplier | null }) {
  const addSupplier = useDataStore((s) => s.addSupplier);
  const updateSupplier = useDataStore((s) => s.updateSupplier);
  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", contactPerson: "", phone: "", email: "", address: "", status: "Active" },
  });
  const errors = form.formState.errors;

  React.useEffect(() => {
    if (open) {
      form.reset(
        supplier
          ? { name: supplier.name, contactPerson: supplier.contactPerson, phone: supplier.phone, email: supplier.email, address: supplier.address, status: supplier.status }
          : { name: "", contactPerson: "", phone: "", email: "", address: "", status: "Active" },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supplier]);

  const submit = (v: SupplierInput) => {
    if (supplier) {
      updateSupplier(supplier.id, { ...v, outstandingBalance: supplier.outstandingBalance });
      toast.success("Supplier updated");
    } else {
      addSupplier({ ...v, outstandingBalance: 0 });
      toast.success(`${v.name} added`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader title={supplier ? "Edit supplier" : "Add supplier"} description="Used on purchase orders and payables." />
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Supplier name" error={errors.name?.message} className="sm:col-span-2">
              <Input aria-invalid={!!errors.name} {...form.register("name")} />
            </Field>
            <Field label="Contact person" error={errors.contactPerson?.message}>
              <Input aria-invalid={!!errors.contactPerson} {...form.register("contactPerson")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input aria-invalid={!!errors.phone} inputMode="tel" {...form.register("phone")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input aria-invalid={!!errors.email} type="email" {...form.register("email")} />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select {...form.register("status")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </Field>
            <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
              <Textarea rows={2} aria-invalid={!!errors.address} {...form.register("address")} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{supplier ? "Save changes" : "Add supplier"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
