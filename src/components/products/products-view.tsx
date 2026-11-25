"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, History, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, Badge } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, MedicineThumb } from "@/components/shared/misc";
import { StockBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MedicineFormDialog } from "@/components/products/medicine-form-dialog";
import { MedicineDetailDrawer } from "@/components/products/medicine-detail-drawer";
import { useDataStore } from "@/store/data-store";
import { formatDate, formatPKR, stockStatus, daysUntil, cn } from "@/lib/utils";
import type { BatchStatus, Medicine } from "@/types";

const STATUS_FILTERS: ("all" | BatchStatus)[] = ["all", "In Stock", "Low Stock", "Out of Stock", "Near Expiry", "Expired"];

export function ProductsView() {
  const medicines = useDataStore((s) => s.medicines);
  const categories = useDataStore((s) => s.categories);
  const deleteMedicine = useDataStore((s) => s.deleteMedicine);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [categoryId, setCategoryId] = React.useState("all");
  const [status, setStatus] = React.useState<"all" | BatchStatus>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Medicine | null>(null);
  const [detail, setDetail] = React.useState<{ medicine: Medicine; tab: "details" | "history" } | null>(null);
  const [toDelete, setToDelete] = React.useState<Medicine | null>(null);

  const initialQuery = params.get("q") ?? "";

  // Syncs the ?new=1 deep link (from the quick-action menu) into dialog state, then clears it from the URL.
  React.useEffect(() => {
    if (params.get("new")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormOpen(true);
      router.replace(pathname);
    }
  }, [params, pathname, router]);

  const categoryName = React.useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const filtered = React.useMemo(
    () =>
      medicines.filter(
        (m) =>
          (categoryId === "all" || m.categoryId === categoryId) &&
          (status === "all" || stockStatus(m) === status),
      ),
    [medicines, categoryId, status],
  );

  const columns = React.useMemo<ColumnDef<Medicine, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (m) => `${m.name} ${m.brand}`,
        header: "Medicine",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-3">
              <MedicineThumb name={m.name} className="size-9" />
              <div className="min-w-0">
                <p className="truncate font-medium">{m.name} <span className="font-normal text-muted">{m.strength}</span></p>
                <p className="truncate text-xs text-muted">{m.brand || m.manufacturer}</p>
              </div>
            </div>
          );
        },
      },
      { accessorKey: "genericName", header: "Generic", cell: ({ getValue }) => <span className="text-muted">{String(getValue())}</span> },
      {
        id: "sku",
        accessorFn: (m) => `${m.sku} ${m.barcode}`,
        header: "SKU / Barcode",
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p>{row.original.sku}</p>
            <p className="text-muted">{row.original.barcode}</p>
          </div>
        ),
      },
      {
        id: "category",
        accessorFn: (m) => categoryName.get(m.categoryId) ?? "",
        header: "Category",
        cell: ({ getValue }) => <Badge>{String(getValue()) || "—"}</Badge>,
      },
      { accessorKey: "batchNumber", header: "Batch", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
      { accessorKey: "purchasePrice", header: "Cost", cell: ({ getValue }) => <span className="tabular-nums text-muted">{formatPKR(Number(getValue()))}</span> },
      { accessorKey: "sellingPrice", header: "Price", cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatPKR(Number(getValue()))}</span> },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <span className={cn("tabular-nums", row.original.stock <= row.original.minStock && "font-medium text-warning")}>
            {row.original.stock}
            <span className="text-muted"> / min {row.original.minStock}</span>
          </span>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => {
          const d = daysUntil(row.original.expiryDate);
          return (
            <div>
              <p className="whitespace-nowrap">{formatDate(row.original.expiryDate)}</p>
              <p className={cn("text-xs", d < 0 ? "text-danger" : d <= 90 ? "text-orange-600 dark:text-orange-400" : "text-muted")}>
                {d < 0 ? "Expired" : `${d} days left`}
              </p>
            </div>
          );
        },
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
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setDetail({ medicine: m, tab: "details" })}>
                    <Eye /> View medicine
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { setEditing(m); setFormOpen(true); }}>
                    <Pencil /> Edit medicine
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDetail({ medicine: m, tab: "history" })}>
                    <History /> Stock history
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => setToDelete(m)}>
                    <Trash2 /> Delete medicine
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [categoryName],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Medicines"
        description={`${medicines.length} products in catalogue`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add medicine
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-surface">
        <DataTable<Medicine>
          data={filtered}
          columns={columns}
          initialQuery={initialQuery}
          searchPlaceholder="Search name, generic, SKU, barcode…"
          onRowClick={(m) => setDetail({ medicine: m, tab: "details" })}
          emptyTitle="No medicines match these filters"
          emptyDescription="Try a different category or status, or add a new medicine."
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => { setCategoryId("all"); setStatus("all"); }}>
              Reset filters
            </Button>
          }
          toolbar={
            <>
              <Select aria-label="Filter by category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-8 w-44 text-[13px]">
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as "all" | BatchStatus)} className="h-8 w-40 text-[13px]">
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </option>
                ))}
              </Select>
            </>
          }
        />
      </div>

      <MedicineFormDialog open={formOpen} onOpenChange={setFormOpen} medicine={editing} />

      <MedicineDetailDrawer
        key={detail ? `${detail.medicine.id}:${detail.tab}` : "closed"}
        detail={detail}
        onClose={() => setDetail(null)}
        onEdit={(m) => {
          setDetail(null);
          setEditing(m);
          setFormOpen(true);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this medicine?"
        description={`${toDelete?.name ?? ""} will be removed from the catalogue. Past sales and purchase records stay on file.`}
        onConfirm={() => {
          if (toDelete) {
            deleteMedicine(toDelete.id);
            toast.success(`${toDelete.name} deleted`);
          }
        }}
      />
    </div>
  );
}
