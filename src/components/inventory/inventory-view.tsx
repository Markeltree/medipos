"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Boxes, CalendarClock, PackageX, Wallet } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogBody } from "@/components/ui/dialog";
import { PageHeader, StatCard, MedicineThumb } from "@/components/shared/misc";
import { StockBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { AdjustStockForm } from "@/components/inventory/adjust-stock-form";
import { useDataStore } from "@/store/data-store";
import { expiryGroups, inventoryValuation, stockHistory } from "@/lib/analytics";
import { cn, daysUntil, formatDate, formatDateTime, formatNumber, formatPKR, stockStatus } from "@/lib/utils";
import type { Medicine } from "@/types";

type Tab = "stock" | "batches" | "low" | "movements" | "valuation";

const TABS: { id: Tab; label: string }[] = [
  { id: "stock", label: "Current stock" },
  { id: "batches", label: "Batch-wise" },
  { id: "low", label: "Low & out of stock" },
  { id: "movements", label: "Movement history" },
  { id: "valuation", label: "Valuation" },
];

export function InventoryView() {
  const medicines = useDataStore((s) => s.medicines);
  const categories = useDataStore((s) => s.categories);
  const suppliers = useDataStore((s) => s.suppliers);
  const purchases = useDataStore((s) => s.purchases);
  const sales = useDataStore((s) => s.sales);
  const movements = useDataStore((s) => s.movements);
  const [tab, setTab] = React.useState<Tab>("stock");
  const [adjusting, setAdjusting] = React.useState<Medicine | null>(null);

  const valuation = React.useMemo(() => inventoryValuation(medicines), [medicines]);
  const groups = React.useMemo(() => expiryGroups(medicines), [medicines]);
  const lowList = medicines.filter((m) => ["Low Stock", "Out of Stock"].includes(stockStatus(m)));
  const outCount = medicines.filter((m) => m.stock === 0).length;
  const unitsOnHand = medicines.reduce((s, m) => s + m.stock, 0);

  const supplierName = React.useCallback((id: string) => suppliers.find((s) => s.id === id)?.name ?? "—", [suppliers]);
  const categoryName = React.useCallback((id: string) => categories.find((c) => c.id === id)?.name ?? "—", [categories]);

  const stockColumns = React.useMemo<ColumnDef<Medicine, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Medicine",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <MedicineThumb name={row.original.name} className="size-8" />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name} <span className="font-normal text-muted">{row.original.strength}</span></p>
              <p className="truncate text-xs text-muted">{categoryName(row.original.categoryId)}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "stock", header: "On hand", cell: ({ getValue }) => <span className="font-semibold tabular-nums">{formatNumber(Number(getValue()))}</span> },
      { accessorKey: "minStock", header: "Minimum", cell: ({ getValue }) => <span className="tabular-nums text-muted">{String(getValue())}</span> },
      {
        id: "value",
        accessorFn: (m) => m.purchasePrice * m.stock,
        header: "Stock value (cost)",
        cell: ({ getValue }) => <span className="tabular-nums">{formatPKR(Number(getValue()))}</span>,
      },
      {
        id: "status",
        accessorFn: (m) => stockStatus(m),
        header: "Status",
        cell: ({ row }) => <StockBadge status={stockStatus(row.original)} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setAdjusting(row.original)}>
              Adjust
            </Button>
          </div>
        ),
      },
    ],
    [categoryName],
  );

  const batchColumns = React.useMemo<ColumnDef<Medicine, unknown>[]>(
    () => [
      { accessorKey: "batchNumber", header: "Batch", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
      {
        accessorKey: "name",
        header: "Medicine",
        cell: ({ row }) => <span className="font-medium">{row.original.name} <span className="font-normal text-muted">{row.original.strength}</span></span>,
      },
      { id: "supplier", accessorFn: (m) => supplierName(m.supplierId), header: "Supplier", cell: ({ getValue }) => <span className="text-muted">{String(getValue())}</span> },
      { accessorKey: "stock", header: "Qty", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => {
          const d = daysUntil(row.original.expiryDate);
          return (
            <span className={cn("whitespace-nowrap", d < 0 ? "text-danger" : d <= 90 ? "text-orange-600 dark:text-orange-400" : "")}>
              {formatDate(row.original.expiryDate)}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorFn: (m) => stockStatus(m),
        header: "Status",
        cell: ({ row }) => <StockBadge status={stockStatus(row.original)} />,
      },
    ],
    [supplierName],
  );

  const movementRows = React.useMemo(() => {
    const all = medicines.flatMap((m) =>
      stockHistory(m.id, purchases, sales, movements).map((r) => ({ ...r, medicine: `${m.name} ${m.strength}` })),
    );
    return all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 300);
  }, [medicines, purchases, sales, movements]);

  const movementColumns = React.useMemo<ColumnDef<(typeof movementRows)[number], unknown>[]>(
    () => [
      { accessorKey: "medicine", header: "Medicine" },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const t = String(getValue());
          return <Badge tone={t === "Stock In" ? "success" : t === "Adjustment" ? "warning" : t === "Return" ? "accent" : "neutral"}>{t}</Badge>;
        },
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ getValue }) => {
          const q = Number(getValue());
          return <span className={cn("font-semibold tabular-nums", q >= 0 ? "text-success" : "text-danger")}>{q > 0 ? `+${q}` : q}</span>;
        },
      },
      { accessorKey: "reference", header: "Reference", cell: ({ getValue }) => <span className="font-mono text-xs text-muted">{String(getValue())}</span> },
      { accessorKey: "date", header: "Date", cell: ({ getValue }) => <span className="whitespace-nowrap text-muted">{formatDateTime(String(getValue()))}</span> },
    ],
    [],
  );

  const valuationRows = React.useMemo(
    () =>
      categories.map((c) => {
        const items = medicines.filter((m) => m.categoryId === c.id);
        const v = inventoryValuation(items);
        return { id: c.id, name: c.name, skus: items.length, units: items.reduce((s, m) => s + m.stock, 0), ...v };
      }),
    [categories, medicines],
  );

  const valuationColumns = React.useMemo<ColumnDef<(typeof valuationRows)[number], unknown>[]>(
    () => [
      { accessorKey: "name", header: "Category", cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
      { accessorKey: "skus", header: "SKUs", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
      { accessorKey: "units", header: "Units", cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(Number(getValue()))}</span> },
      { accessorKey: "cost", header: "Cost value", cell: ({ getValue }) => <span className="tabular-nums">{formatPKR(Number(getValue()))}</span> },
      { accessorKey: "retail", header: "Retail value", cell: ({ getValue }) => <span className="tabular-nums">{formatPKR(Number(getValue()))}</span> },
      { accessorKey: "potentialMargin", header: "Potential margin", cell: ({ getValue }) => <span className="tabular-nums text-success">{formatPKR(Number(getValue()))}</span> },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Inventory"
        description="Stock on hand, batches and movements across all counters"
        actions={
          <Link href="/expiry">
            <Button variant="outline">
              <CalendarClock /> Expiry tracker
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Units on hand" value={formatNumber(unitsOnHand)} icon={<Boxes className="size-4" />} tone="primary" />
        <StatCard label="Stock value (cost)" value={formatPKR(valuation.cost)} icon={<Wallet className="size-4" />} tone="accent" />
        <StatCard label="Low / out of stock" value={`${lowList.length} · ${outCount} out`} icon={<PackageX className="size-4" />} tone="warning" />
        <StatCard
          label="Expired or near expiry"
          value={`${groups.expired.length + groups.d30.length + groups.d60.length + groups.d90.length}`}
          icon={<AlertTriangle className="size-4" />}
          tone="orange"
        />
      </section>

      <div role="tablist" aria-label="Inventory views" className="thin-scroll flex w-full gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-[13.5px] font-medium transition-colors",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {tab === "stock" && <DataTable<Medicine> data={medicines} columns={stockColumns} searchPlaceholder="Search stock…" initialSort={[{ id: "status", desc: false }]} />}
        {tab === "batches" && <DataTable<Medicine> data={medicines} columns={batchColumns} searchPlaceholder="Search batch, medicine…" />}
        {tab === "low" && (
          <DataTable<Medicine>
            data={lowList}
            columns={stockColumns}
            searchPlaceholder="Search low stock…"
            emptyTitle="All medicines are above minimum stock"
            emptyDescription="Alerts appear here when stock falls to the minimum level."
          />
        )}
        {tab === "movements" && (
          <DataTable<(typeof movementRows)[number]>
            data={movementRows}
            columns={movementColumns}
            searchPlaceholder="Search medicine or reference…"
            emptyTitle="No movements recorded"
          />
        )}
        {tab === "valuation" && (
          <div>
            <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
              <ValueTile label="Cost value" value={valuation.cost} />
              <ValueTile label="Retail value" value={valuation.retail} />
              <ValueTile label="Potential margin" value={valuation.potentialMargin} accent />
            </div>
            <DataTable data={valuationRows} columns={valuationColumns} searchable={false} />
          </div>
        )}
      </Card>

      <Dialog open={!!adjusting} onOpenChange={(v) => !v && setAdjusting(null)}>
        <DialogContent size="md">
          {adjusting && (
            <>
              <DialogHeader title="Adjust stock" description={`${adjusting.name} ${adjusting.strength} · on hand ${adjusting.stock}`} />
              <DialogBody>
                <AdjustStockForm medicine={adjusting} onDone={() => setAdjusting(null)} />
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValueTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", accent && "text-success")}>{formatPKR(value)}</p>
    </div>
  );
}
