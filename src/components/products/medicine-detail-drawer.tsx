"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { MedicineThumb, EmptyState } from "@/components/shared/misc";
import { StockBadge } from "@/components/shared/status-badge";
import { AdjustStockForm } from "@/components/inventory/adjust-stock-form";
import { useDataStore } from "@/store/data-store";
import { stockHistory } from "@/lib/analytics";
import { cn, daysUntil, formatDate, formatDateTime, formatPKR, stockStatus } from "@/lib/utils";
import type { Medicine } from "@/types";

interface Detail {
  medicine: Medicine;
  tab: "details" | "history";
}

export function MedicineDetailDrawer({
  detail,
  onClose,
  onEdit,
}: {
  detail: Detail | null;
  onClose: () => void;
  onEdit: (m: Medicine) => void;
}) {
  // The parent keys this component per medicine and tab, so the initial tab is taken on each open.
  const [tab, setTab] = React.useState<"details" | "history">(detail?.tab ?? "details");

  const m = detail?.medicine;
  return (
    <Dialog open={!!detail} onOpenChange={(v) => !v && onClose()}>
      <DialogContent side="right">
        {m && (
          <>
            <DialogHeader title={m.name} description={`${m.genericName} · ${m.strength} ${m.dosageForm.toLowerCase()}`} />
            <DialogBody className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <MedicineThumb name={m.name} className="size-12" />
                <div className="flex flex-wrap gap-1.5">
                  <StockBadge status={stockStatus(m)} />
                  {m.prescriptionRequired && <Badge tone="primary">Prescription</Badge>}
                </div>
              </div>

              <div role="tablist" className="inline-flex w-fit rounded-md border border-border p-0.5 text-[13px]">
                {(["details", "history"] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "h-7 cursor-pointer rounded px-3 font-medium capitalize",
                      tab === t ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
                    )}
                  >
                    {t === "details" ? "Details" : "Stock history"}
                  </button>
                ))}
              </div>

              {tab === "details" ? <DetailsTab medicine={m} /> : <HistoryTab medicine={m} />}
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onEdit(m)}>
                <Pencil /> Edit medicine
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailsTab({ medicine: m }: { medicine: Medicine }) {
  const categories = useDataStore((s) => s.categories);
  const suppliers = useDataStore((s) => s.suppliers);
  const cat = categories.find((c) => c.id === m.categoryId)?.name ?? "—";
  const sup = suppliers.find((s) => s.id === m.supplierId)?.name ?? "—";
  const margin = m.sellingPrice > 0 ? ((m.sellingPrice - m.purchasePrice) / m.sellingPrice) * 100 : 0;
  const d = daysUntil(m.expiryDate);
  const rows: [string, React.ReactNode][] = [
    ["SKU", <span key="sku" className="font-mono">{m.sku}</span>],
    ["Barcode", <span key="bc" className="font-mono">{m.barcode}</span>],
    ["Category", cat],
    ["Brand", m.brand || "—"],
    ["Manufacturer", m.manufacturer],
    ["Supplier", sup],
    ["Batch", <span key="b" className="font-mono">{m.batchNumber}</span>],
    ["Expiry", `${formatDate(m.expiryDate)} (${d < 0 ? "expired" : `${d} days`})`],
    ["Cost price", formatPKR(m.purchasePrice)],
    ["Selling price", `${formatPKR(m.sellingPrice)} · ${margin.toFixed(0)}% margin`],
    ["Stock on hand", `${m.stock} (min ${m.minStock})`],
  ];
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="truncate font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {m.description && <p className="rounded-md bg-surface-muted p-3 text-[13px] text-muted">{m.description}</p>}
      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">Adjust stock</p>
        <AdjustStockForm medicine={m} />
      </Card>
    </div>
  );
}

function HistoryTab({ medicine: m }: { medicine: Medicine }) {
  const purchases = useDataStore((s) => s.purchases);
  const sales = useDataStore((s) => s.sales);
  const movements = useDataStore((s) => s.movements);
  const rows = React.useMemo(() => stockHistory(m.id, purchases, sales, movements).slice(0, 60), [m.id, purchases, sales, movements]);
  if (rows.length === 0) return <EmptyState compact title="No stock movements yet" description="Purchases, sales and adjustments will appear here." />;
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
          <span className={cn("w-14 text-right font-semibold tabular-nums", r.quantity >= 0 ? "text-success" : "text-danger")}>
            {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{r.type}</p>
            <p className="truncate font-mono text-xs text-muted">{r.reference}</p>
          </div>
          <span className="shrink-0 text-xs text-muted">{formatDateTime(r.date)}</span>
        </li>
      ))}
    </ul>
  );
}
