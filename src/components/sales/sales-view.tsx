"use client";

import * as React from "react";
import { subDays, startOfDay } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Printer, Undo2, Receipt as ReceiptIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Select } from "@/components/ui/primitives";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, StatCard } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PaymentBadge } from "@/components/shared/status-badge";
import { Receipt } from "@/components/sales/receipt";
import { useDataStore } from "@/store/data-store";
import { saleRevenue, percentChange, salesBetween } from "@/lib/analytics";
import { formatDateTime, formatNumber, formatPKR } from "@/lib/utils";
import type { PaymentMethod, Sale } from "@/types";
import { Banknote } from "lucide-react";

const RANGES = [
  { id: "today", label: "Today", days: 0 },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "all", label: "All time", days: -1 },
] as const;

const METHODS: ("all" | PaymentMethod)[] = ["all", "Cash", "Card", "Bank Transfer", "JazzCash", "EasyPaisa"];

export function SalesView() {
  const sales = useDataStore((s) => s.sales);
  const refundSale = useDataStore((s) => s.refundSale);
  const [range, setRange] = React.useState<(typeof RANGES)[number]["id"]>("30");
  const [method, setMethod] = React.useState<"all" | PaymentMethod>("all");
  const [viewing, setViewing] = React.useState<Sale | null>(null);
  const [printing, setPrinting] = React.useState<Sale | null>(null);
  const [refunding, setRefunding] = React.useState<Sale | null>(null);

  const now = new Date();
  const filtered = React.useMemo(() => {
    const r = RANGES.find((x) => x.id === range)!;
    const from = r.days === -1 ? new Date(0) : r.days === 0 ? startOfDay(now) : startOfDay(subDays(now, r.days - 1));
    return salesBetween(sales, from, now).filter((s) => method === "all" || s.paymentMethod === method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, range, method]);

  const revenue = saleRevenue(filtered);
  const prevRevenue = (() => {
    const r = RANGES.find((x) => x.id === range)!;
    if (r.days <= 0) return 0;
    const from = startOfDay(subDays(now, r.days * 2 - 1));
    const to = startOfDay(subDays(now, r.days));
    return saleRevenue(salesBetween(sales, from, to));
  })();

  const columns = React.useMemo<ColumnDef<Sale, unknown>[]>(
    () => [
      { accessorKey: "id", header: "Transaction", cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{String(getValue())}</span> },
      { accessorKey: "date", header: "Date & time", cell: ({ getValue }) => <span className="whitespace-nowrap text-[13px]">{formatDateTime(String(getValue()))}</span> },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ getValue }) => <span className={String(getValue()) === "Walk-in Customer" ? "text-muted" : "font-medium"}>{String(getValue())}</span>,
      },
      {
        id: "items",
        accessorFn: (s) => s.items.reduce((n, i) => n + i.quantity, 0),
        header: "Items",
        cell: ({ row }) => <span className="tabular-nums text-muted">{row.original.items.length} lines · {formatNumber(row.original.items.reduce((n, i) => n + i.quantity, 0))} units</span>,
      },
      { accessorKey: "total", header: "Amount", cell: ({ getValue }) => <span className="font-semibold tabular-nums">{formatPKR(Number(getValue()))}</span> },
      { accessorKey: "paymentMethod", header: "Method", cell: ({ getValue }) => <Badge>{String(getValue())}</Badge> },
      { accessorKey: "cashier", header: "Cashier", cell: ({ getValue }) => <span className="text-muted">{String(getValue())}</span> },
      { accessorKey: "paymentStatus", header: "Status", cell: ({ getValue }) => <PaymentBadge status={getValue() as Sale["paymentStatus"]} /> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.id}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setViewing(s)}>
                    <Eye /> View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setPrinting(s)}>
                    <Printer /> Print receipt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive disabled={s.paymentStatus !== "Paid"} onSelect={() => setRefunding(s)}>
                    <Undo2 /> Process refund
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Sales history" description="Every counter transaction, refunds and receipts" />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Transactions" value={formatNumber(filtered.length)} icon={<ReceiptIcon className="size-4" />} tone="primary" />
        <StatCard
          label="Revenue"
          value={formatPKR(revenue)}
          icon={<Banknote className="size-4" />}
          tone="success"
          change={range === "today" ? undefined : percentChange(revenue, prevRevenue)}
          changeLabel="vs prev. period"
        />
        <StatCard label="Average basket" value={formatPKR(filtered.length ? revenue / filtered.length : 0)} icon={<Banknote className="size-4" />} tone="accent" />
        <StatCard label="Refunded" value={formatNumber(filtered.filter((s) => s.paymentStatus === "Refunded").length)} icon={<Undo2 className="size-4" />} tone="danger" />
      </section>

      <Card className="overflow-hidden">
        <DataTable<Sale>
          data={filtered}
          columns={columns}
          searchPlaceholder="Search transaction ID or customer…"
          onRowClick={(s) => setViewing(s)}
          emptyTitle="No transactions match these filters"
          emptyDescription="Widen the date range or clear the payment method filter."
          toolbar={
            <>
              <Select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="h-8 w-40 text-[13px]">
                {RANGES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </Select>
              <Select aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as "all" | PaymentMethod)} className="h-8 w-40 text-[13px]">
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m === "all" ? "All methods" : m}</option>
                ))}
              </Select>
            </>
          }
        />
      </Card>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent size="lg">
          {viewing && (
            <>
              <DialogHeader title={viewing.id} description={`${formatDateTime(viewing.date)} · ${viewing.cashier}`} />
              <DialogBody className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Field label="Customer" value={viewing.customerName} />
                  <Field label="Payment" value={viewing.paymentMethod} />
                  <Field label="Received" value={formatPKR(viewing.amountReceived)} />
                  <Field label="Change" value={formatPKR(viewing.change)} />
                </div>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-muted/60 text-xs text-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Unit</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewing.items.map((i) => (
                        <tr key={i.medicineId} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{i.name} <span className="font-normal text-muted">{i.strength}</span></td>
                          <td className="px-3 py-2 text-right tabular-nums">{i.quantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatPKR(i.unitPrice)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatPKR(i.unitPrice * i.quantity - i.discount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ml-auto grid w-full max-w-xs gap-1 text-[13px]">
                  <Line label="Subtotal" value={formatPKR(viewing.subtotal)} />
                  <Line label="Discount" value={`- ${formatPKR(viewing.discount)}`} />
                  <Line label="Tax" value={formatPKR(viewing.tax)} />
                  <Line label="Total" value={formatPKR(viewing.total)} strong />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                <Button variant="outline" onClick={() => { setPrinting(viewing); setViewing(null); }}>
                  <Printer /> Print receipt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!printing} onOpenChange={(v) => !v && setPrinting(null)}>
        <DialogContent size="sm">
          {printing && (
            <>
              <DialogHeader title="Receipt" description={printing.id} />
              <DialogBody className="thin-scroll max-h-[60vh] bg-surface-muted/40">
                <Receipt sale={printing} />
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrinting(null)}>Close</Button>
                <Button onClick={() => window.print()}>
                  <Printer /> Print
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!refunding}
        onOpenChange={(v) => !v && setRefunding(null)}
        title="Process refund?"
        description={`Refund ${formatPKR(refunding?.total ?? 0)} for ${refunding?.id ?? ""}. Items return to stock. This is recorded for the audit trail.`}
        confirmLabel="Refund"
        onConfirm={() => {
          if (refunding) {
            refundSale(refunding.id);
            toast.success(`Refund processed for ${refunding.id}`);
          }
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate font-medium">{value}</p>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-border pt-2 text-sm font-semibold" : "text-muted"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
