"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard, MedicineThumb } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDataStore } from "@/store/data-store";
import { expiryBucket, daysUntil, formatDate, formatPKR, cn } from "@/lib/utils";
import type { Medicine } from "@/types";

type Bucket = "all" | "expired" | "30" | "60" | "90";

const BUCKETS: { id: Bucket; label: string }[] = [
  { id: "all", label: "All batches" },
  { id: "expired", label: "Expired" },
  { id: "30", label: "Within 30 days" },
  { id: "60", label: "Within 60 days" },
  { id: "90", label: "Within 90 days" },
];

export function ExpiryView() {
  const medicines = useDataStore((s) => s.medicines);
  const suppliers = useDataStore((s) => s.suppliers);
  const adjustStock = useDataStore((s) => s.adjustStock);
  const [bucket, setBucket] = React.useState<Bucket>("all");
  const [toWriteOff, setToWriteOff] = React.useState<Medicine | null>(null);

  const tracked = React.useMemo(
    () => medicines.filter((m) => expiryBucket(m.expiryDate) !== "safe").sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    [medicines],
  );

  const sumValue = (list: Medicine[]) => list.reduce((s, m) => s + m.purchasePrice * m.stock, 0);
  const byBucket = (k: string) => tracked.filter((m) => expiryBucket(m.expiryDate) === k);
  const shown = bucket === "all" ? tracked : tracked.filter((m) => expiryBucket(m.expiryDate) === bucket);

  const columns = React.useMemo<ColumnDef<Medicine, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Medicine",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <MedicineThumb name={row.original.name} className="size-8" />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name} <span className="font-normal text-muted">{row.original.strength}</span></p>
              <p className="truncate text-xs text-muted">{row.original.manufacturer}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "batchNumber", header: "Batch", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => {
          const d = daysUntil(row.original.expiryDate);
          const tone = d < 0 ? "danger" : d <= 30 ? "orange" : d <= 60 ? "warning" : "primary";
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="whitespace-nowrap">{formatDate(row.original.expiryDate)}</span>
              <Badge tone={tone}>{d < 0 ? `Expired ${Math.abs(d)}d ago` : `${d} days left`}</Badge>
            </div>
          );
        },
      },
      { accessorKey: "stock", header: "Qty", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
      {
        id: "supplier",
        accessorFn: (m) => suppliers.find((s) => s.id === m.supplierId)?.name ?? "—",
        header: "Supplier",
        cell: ({ getValue }) => <span className="text-muted">{String(getValue())}</span>,
      },
      {
        id: "value",
        accessorFn: (m) => m.purchasePrice * m.stock,
        header: "Est. value",
        cell: ({ getValue }) => <span className="tabular-nums">{formatPKR(Number(getValue()))}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const m = row.original;
          const expired = expiryBucket(m.expiryDate) === "expired";
          return (
            <div className="flex justify-end">
              <Button variant={expired ? "danger" : "outline"} size="sm" disabled={m.stock === 0} onClick={() => setToWriteOff(m)}>
                <Trash2 /> {expired ? "Write off" : "Return / write off"}
              </Button>
            </div>
          );
        },
      },
    ],
    [suppliers],
  );

  const cards: { id: Bucket; label: string; list: Medicine[]; tone: "danger" | "orange" | "warning" | "primary" }[] = [
    { id: "expired", label: "Expired", list: byBucket("expired"), tone: "danger" },
    { id: "30", label: "Within 30 days", list: byBucket("30"), tone: "orange" },
    { id: "60", label: "Within 60 days", list: byBucket("60"), tone: "warning" },
    { id: "90", label: "Within 90 days", list: byBucket("90"), tone: "primary" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Expiry management" description="Batches that have expired or will expire within 90 days" />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <button key={c.id} type="button" onClick={() => setBucket(c.id)} className="text-left">
            <StatCard
              label={c.label}
              value={`${c.list.length} batches`}
              icon={<CalendarClock className="size-4" />}
              tone={c.tone === "primary" ? "primary" : c.tone}
            />
            <p className="mt-1.5 px-1 text-xs text-muted">Est. {formatPKR(sumValue(c.list))} at cost</p>
          </button>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Expiry filter">
        {BUCKETS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={bucket === b.id}
            onClick={() => setBucket(b.id)}
            className={cn(
              "h-8 cursor-pointer rounded-full border px-3 text-[13px] font-medium transition-colors",
              bucket === b.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <DataTable<Medicine>
          data={shown}
          columns={columns}
          searchPlaceholder="Search batch or medicine…"
          emptyTitle="No batches in this window"
          emptyDescription="Every batch on the shelf has more than 90 days of shelf life."
        />
      </Card>

      <ConfirmDialog
        open={!!toWriteOff}
        onOpenChange={(v) => !v && setToWriteOff(null)}
        title="Write off this batch?"
        description={`${toWriteOff?.stock ?? 0} units of ${toWriteOff?.name ?? ""} (batch ${toWriteOff?.batchNumber ?? ""}) will be removed from stock and logged as an expiry write-off.`}
        confirmLabel="Write off"
        onConfirm={() => {
          if (!toWriteOff) return;
          adjustStock(toWriteOff.id, -toWriteOff.stock, "Adjustment", `Expiry write-off · ${toWriteOff.batchNumber}`);
          toast.success(`${toWriteOff.name} batch written off`);
        }}
      />
    </div>
  );
}
