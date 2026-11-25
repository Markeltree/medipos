"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { format, addDays } from "date-fns";
import { CheckCheck, Eye, Plus, Trash2, XCircle, Send, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { PaymentBadge, PurchaseStatusBadge } from "@/components/shared/status-badge";
import { useDataStore } from "@/store/data-store";
import { purchaseSchema, type PurchaseInput } from "@/lib/validators";
import { formatDate, formatNumber, formatPKR, cn } from "@/lib/utils";
import type { Purchase, PurchaseStatus } from "@/types";

/** ISO date `days` from today, for form defaults. */
const isoPlus = (days: number) => format(addDays(new Date(), days), "yyyy-MM-dd");

export function PurchasesView() {
  const purchases = useDataStore((s) => s.purchases);
  const suppliers = useDataStore((s) => s.suppliers);
  const [formOpen, setFormOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<Purchase | null>(null);
  const [status, setStatus] = React.useState<"all" | PurchaseStatus>("all");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Syncs the ?new=1 deep link (from the quick-action menu) into dialog state, then clears it from the URL.
  React.useEffect(() => {
    if (params.get("new")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormOpen(true);
      router.replace(pathname);
    }
  }, [params, pathname, router]);

  const supplierName = React.useCallback((id: string) => suppliers.find((s) => s.id === id)?.name ?? "—", [suppliers]);
  const filtered = purchases.filter((p) => status === "all" || p.status === status);
  const open = purchases.filter((p) => ["Pending", "Partially Received"].includes(p.status));
  const openValue = open.reduce((s, p) => s + p.total, 0);
  const monthKey = format(new Date(), "yyyy-MM");
  const thisMonth = purchases.filter((p) => p.purchaseDate.startsWith(monthKey) && p.status !== "Cancelled");

  const columns = React.useMemo<ColumnDef<Purchase, unknown>[]>(
    () => [
      { accessorKey: "invoiceNumber", header: "Order", cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{String(getValue())}</span> },
      { id: "supplier", accessorFn: (p) => supplierName(p.supplierId), header: "Supplier", cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
      {
        accessorKey: "purchaseDate",
        header: "Ordered",
        cell: ({ row }) => (
          <div className="text-[13px]">
            <p>{formatDate(row.original.purchaseDate)}</p>
            <p className="text-xs text-muted">Due {formatDate(row.original.expectedDelivery, "dd MMM")}</p>
          </div>
        ),
      },
      { id: "lines", accessorFn: (p) => p.items.length, header: "Lines", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
      { accessorKey: "total", header: "Total", cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatPKR(Number(getValue()))}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <PurchaseStatusBadge status={getValue() as PurchaseStatus} /> },
      { accessorKey: "paymentStatus", header: "Payment", cell: ({ getValue }) => <PaymentBadge status={getValue() as Purchase["paymentStatus"]} /> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <Button variant="ghost" size="icon-sm" aria-label={`View ${row.original.invoiceNumber}`} onClick={() => setViewing(row.original)}>
              <Eye />
            </Button>
          </div>
        ),
      },
    ],
    [supplierName],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Purchases"
        description="Purchase orders to suppliers and stock received against them"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> New purchase order
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Orders this month" value={formatNumber(thisMonth.length)} icon={<PackageCheck className="size-4" />} tone="primary" />
        <StatCard label="Spend this month" value={formatPKR(thisMonth.reduce((s, p) => s + p.total, 0))} icon={<CheckCheck className="size-4" />} tone="accent" />
        <StatCard label="Open orders" value={formatNumber(open.length)} icon={<Send className="size-4" />} tone="warning" />
        <StatCard label="Open order value" value={formatPKR(openValue)} icon={<XCircle className="size-4" />} tone="orange" />
      </section>

      <Card className="overflow-hidden">
        <DataTable<Purchase>
          data={filtered}
          columns={columns}
          searchPlaceholder="Search order or supplier…"
          onRowClick={(p) => setViewing(p)}
          emptyTitle="No purchase orders in this status"
          toolbar={
            <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as "all" | PurchaseStatus)} className="h-8 w-44 text-[13px]">
              <option value="all">All statuses</option>
              {(["Draft", "Pending", "Partially Received", "Received", "Cancelled"] as PurchaseStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          }
        />
      </Card>

      <PurchaseFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent side="right">
          {viewing && <PurchaseDetail purchaseId={viewing.id} onClose={() => setViewing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PurchaseDetail({ purchaseId, onClose }: { purchaseId: string; onClose: () => void }) {
  const purchase = useDataStore((s) => s.purchases.find((p) => p.id === purchaseId));
  const suppliers = useDataStore((s) => s.suppliers);
  const medicines = useDataStore((s) => s.medicines);
  const receivePurchase = useDataStore((s) => s.receivePurchase);
  const updatePurchaseStatus = useDataStore((s) => s.updatePurchaseStatus);
  const [receiving, setReceiving] = React.useState<Record<string, number>>({});

  if (!purchase) return null;
  const supplier = suppliers.find((s) => s.id === purchase.supplierId)?.name ?? "—";
  const canReceive = ["Pending", "Partially Received"].includes(purchase.status);
  const canSubmit = purchase.status === "Draft";
  const canCancel = !["Received", "Cancelled"].includes(purchase.status);

  return (
    <>
      <DialogHeader title={purchase.invoiceNumber} description={`${supplier} · ${formatDate(purchase.purchaseDate)}`} />
      <DialogBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PurchaseStatusBadge status={purchase.status} />
          <PaymentBadge status={purchase.paymentStatus} />
          <span className="ml-auto text-sm text-muted">Expected {formatDate(purchase.expectedDelivery)}</span>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-muted/60 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Medicine</th>
                <th className="px-3 py-2 text-right font-medium">Ordered</th>
                <th className="px-3 py-2 text-right font-medium">Received</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((it) => {
                const med = medicines.find((m) => m.id === it.medicineId);
                const remaining = it.quantity - it.receivedQuantity;
                return (
                  <tr key={it.medicineId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <p className="font-medium">{med?.name ?? "Removed medicine"} <span className="text-muted">{med?.strength}</span></p>
                      <p className="text-xs text-muted">{formatPKR(it.unitPrice)} each</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={cn(remaining > 0 ? "text-warning" : "text-success")}>{it.receivedQuantity}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatPKR(it.unitPrice * it.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatPKR(purchase.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {purchase.notes && <p className="rounded-md bg-surface-muted p-3 text-[13px] text-muted">{purchase.notes}</p>}

        {canReceive && (
          <Card className="p-4">
            <p className="text-sm font-semibold">Receive stock</p>
            <p className="mb-3 text-xs text-muted">Enter the quantity that arrived. Stock is added to inventory immediately.</p>
            <div className="flex flex-col gap-2">
              {purchase.items
                .filter((it) => it.receivedQuantity < it.quantity)
                .map((it) => {
                  const med = medicines.find((m) => m.id === it.medicineId);
                  const remaining = it.quantity - it.receivedQuantity;
                  return (
                    <div key={it.medicineId} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="min-w-0 truncate">{med?.name} <span className="text-muted">· {remaining} outstanding</span></span>
                      <Input
                        type="number"
                        min={0}
                        max={remaining}
                        aria-label={`Quantity received for ${med?.name}`}
                        value={receiving[it.medicineId] ?? remaining}
                        onChange={(e) => setReceiving((r) => ({ ...r, [it.medicineId]: Math.min(remaining, Math.max(0, Number(e.target.value) || 0)) }))}
                        className="h-8 w-24 text-right tabular-nums"
                      />
                    </div>
                  );
                })}
            </div>
            <Button
              className="mt-3 w-full"
              size="sm"
              onClick={() => {
                const payload: Record<string, number> = {};
                purchase.items.forEach((it) => {
                  payload[it.medicineId] = receiving[it.medicineId] ?? it.quantity - it.receivedQuantity;
                });
                receivePurchase(purchase.id, payload);
                setReceiving({});
                toast.success("Stock received and inventory updated");
              }}
            >
              <PackageCheck /> Confirm receipt
            </Button>
          </Card>
        )}
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        <div className="flex gap-2">
          {canSubmit && (
            <Button variant="outline" onClick={() => { updatePurchaseStatus(purchase.id, "Pending"); toast.success("Order sent to supplier"); }}>
              <Send /> Send order
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={() => { updatePurchaseStatus(purchase.id, "Cancelled"); toast.success("Order cancelled"); }}>
              <XCircle /> Cancel order
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
  );
}

function PurchaseFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const suppliers = useDataStore((s) => s.suppliers);
  const medicines = useDataStore((s) => s.medicines);
  const addPurchase = useDataStore((s) => s.addPurchase);
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<PurchaseInput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      invoiceNumber: "",
      purchaseDate: today,
      expectedDelivery: isoPlus(3),
      paymentStatus: "Unpaid",
      status: "Pending",
      notes: "",
      items: [{ medicineId: "", quantity: 10, unitPrice: 0 }],
    },
  });
  const errors = form.formState.errors;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = form.watch("items");
  const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  React.useEffect(() => {
    if (open) {
      form.reset({
        supplierId: suppliers.find((s) => s.status === "Active")?.id ?? "",
        invoiceNumber: "",
        purchaseDate: today,
        expectedDelivery: isoPlus(3),
        paymentStatus: "Unpaid",
        status: "Pending",
        notes: "",
        items: [{ medicineId: "", quantity: 10, unitPrice: 0 }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (v: PurchaseInput) => {
    addPurchase({
      supplierId: v.supplierId,
      invoiceNumber: v.invoiceNumber || undefined,
      purchaseDate: v.purchaseDate,
      expectedDelivery: v.expectedDelivery,
      status: v.status,
      paymentStatus: v.paymentStatus,
      notes: v.notes,
      items: v.items.map((it) => ({ medicineId: it.medicineId, quantity: it.quantity, unitPrice: it.unitPrice, receivedQuantity: 0 })),
      total: v.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
    });
    toast.success(v.status === "Draft" ? "Draft saved" : "Purchase order created");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader title="New purchase order" description="Add the medicines and quantities you are ordering from a supplier." />
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Supplier" error={errors.supplierId?.message} className="lg:col-span-2">
                <Select aria-invalid={!!errors.supplierId} {...form.register("supplierId")}>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Supplier invoice #" error={errors.invoiceNumber?.message} hint="Leave blank to auto-number">
                <Input aria-invalid={!!errors.invoiceNumber} placeholder="Auto" {...form.register("invoiceNumber")} />
              </Field>
              <Field label="Payment status" error={errors.paymentStatus?.message}>
                <Select {...form.register("paymentStatus")}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </Select>
              </Field>
              <Field label="Purchase date" error={errors.purchaseDate?.message}>
                <Input type="date" aria-invalid={!!errors.purchaseDate} {...form.register("purchaseDate")} />
              </Field>
              <Field label="Expected delivery" error={errors.expectedDelivery?.message}>
                <Input type="date" aria-invalid={!!errors.expectedDelivery} {...form.register("expectedDelivery")} />
              </Field>
              <Field label="Save as" error={errors.status?.message}>
                <Select {...form.register("status")}>
                  <option value="Pending">Pending (send to supplier)</option>
                  <option value="Draft">Draft</option>
                </Select>
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Medicines</p>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ medicineId: "", quantity: 10, unitPrice: 0 })}>
                  <Plus /> Add line
                </Button>
              </div>
              {errors.items?.root?.message && <p className="mb-2 text-xs text-danger">{errors.items.root.message}</p>}
              <div className="flex flex-col gap-2">
                {fields.length === 0 && <EmptyState compact title="No lines yet" />}
                {fields.map((f, i) => (
                  <div key={f.id} className="grid grid-cols-[minmax(0,1fr)_88px_110px_110px_36px] items-start gap-2">
                    <div>
                      <Select
                        aria-label={`Medicine line ${i + 1}`}
                        aria-invalid={!!errors.items?.[i]?.medicineId}
                        {...form.register(`items.${i}.medicineId`, {
                          onChange: (e) => {
                            const med = medicines.find((m) => m.id === e.target.value);
                            if (med) form.setValue(`items.${i}.unitPrice`, med.purchasePrice);
                          },
                        })}
                      >
                        <option value="">Select medicine</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} {m.strength}</option>
                        ))}
                      </Select>
                      {errors.items?.[i]?.medicineId && <p className="mt-1 text-xs text-danger">{errors.items[i]?.medicineId?.message}</p>}
                    </div>
                    <div>
                      <Input type="number" min={1} aria-label="Quantity" aria-invalid={!!errors.items?.[i]?.quantity} {...form.register(`items.${i}.quantity`, { valueAsNumber: true })} />
                      {errors.items?.[i]?.quantity && <p className="mt-1 text-xs text-danger">{errors.items[i]?.quantity?.message}</p>}
                    </div>
                    <div>
                      <Input type="number" min={0} aria-label="Unit price (Rs)" aria-invalid={!!errors.items?.[i]?.unitPrice} {...form.register(`items.${i}.unitPrice`, { valueAsNumber: true })} />
                      {errors.items?.[i]?.unitPrice && <p className="mt-1 text-xs text-danger">{errors.items[i]?.unitPrice?.message}</p>}
                    </div>
                    <div className="flex h-9 items-center justify-end text-[13px] font-medium tabular-nums">
                      {formatPKR((Number(items[i]?.quantity) || 0) * (Number(items[i]?.unitPrice) || 0))}
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove line" onClick={() => remove(i)} disabled={fields.length === 1}>
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <Field label="Notes" error={errors.notes?.message} hint="Optional, visible to staff only">
                <Textarea rows={2} {...form.register("notes")} />
              </Field>
              <div className="rounded-md border border-border bg-surface-muted/60 px-4 py-3 text-right">
                <p className="text-xs text-muted">Order total</p>
                <p className="text-xl font-semibold tabular-nums">{formatPKR(total)}</p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>Create order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
