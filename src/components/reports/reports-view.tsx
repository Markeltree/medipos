"use client";

import * as React from "react";
import { startOfWeek, format, subWeeks, startOfDay, subDays } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Select } from "@/components/ui/primitives";
import { PageHeader, StatCard } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { useDataStore } from "@/store/data-store";
import type { Category, Medicine, Purchase, Sale, Supplier } from "@/types";
import {
  categoryShare,
  dailySeries,
  expiryGroups,
  inventoryValuation,
  monthlySeries,
  salesBetween,
  saleRevenue,
  topSellers,
} from "@/lib/analytics";
import { cn, daysUntil, formatCompact, formatDate, formatNumber, formatPKR, expiryBucket } from "@/lib/utils";

const REPORTS = [
  { id: "daily", label: "Daily sales" },
  { id: "weekly", label: "Weekly sales" },
  { id: "monthly", label: "Monthly sales" },
  { id: "pnl", label: "Profit & loss" },
  { id: "best", label: "Best selling medicines" },
  { id: "category", label: "Category-wise sales" },
  { id: "valuation", label: "Inventory valuation" },
  { id: "purchases", label: "Purchase report" },
  { id: "expiry", label: "Expiry report" },
] as const;

type ReportId = (typeof REPORTS)[number]["id"];

const RANGES = [
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "180", label: "Last 180 days", days: 180 },
] as const;

const PIE_COLORS = ["#2563EB", "#0D9488", "#60A5FA", "#5EEAD4", "#94A3B8", "#A5B4FC", "#F59E0B", "#CBD5E1"];

export function ReportsView() {
  const sales = useDataStore((s) => s.sales);
  const medicines = useDataStore((s) => s.medicines);
  const categories = useDataStore((s) => s.categories);
  const purchases = useDataStore((s) => s.purchases);
  const suppliers = useDataStore((s) => s.suppliers);
  const [report, setReport] = React.useState<ReportId>("daily");
  const [range, setRange] = React.useState<(typeof RANGES)[number]["id"]>("30");
  const now = React.useMemo(() => new Date(), []);

  const days = RANGES.find((r) => r.id === range)!.days;
  const windowSales = React.useMemo(
    () => salesBetween(sales, startOfDay(subDays(now, days - 1)), now).filter((s) => s.paymentStatus === "Paid"),
    [sales, days, now],
  );

  const revenue = saleRevenue(windowSales);
  const cogs = windowSales.reduce((sum, s) => sum + s.items.reduce((c, i) => c + (medicines.find((m) => m.id === i.medicineId)?.purchasePrice ?? 0) * i.quantity, 0), 0);
  const gross = revenue - cogs;
  const tax = windowSales.reduce((s, x) => s + x.tax, 0);

  const cfg = useReportData({ report, sales: windowSales, allSales: sales, medicines, categories, purchases, suppliers, now, days });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reports & analytics"
        description="Sales, profitability, stock and compliance reports"
        actions={
          <>
            <Select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="h-9 w-40">
              {RANGES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => downloadCsv(`medipos-${report}-${range}d.csv`, cfg.csv)} disabled={cfg.csv.length === 0}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> Print report
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatPKR(revenue)} icon={<span className="text-xs font-bold">Rs</span>} tone="primary" />
        <StatCard label="Gross profit" value={formatPKR(gross)} icon={<span className="text-xs font-bold">%</span>} tone="success" />
        <StatCard label="Gross margin" value={`${revenue ? ((gross / revenue) * 100).toFixed(1) : "0.0"}%`} icon={<span className="text-xs font-bold">%</span>} tone="accent" />
        <StatCard label="Tax collected" value={formatPKR(tax)} icon={<span className="text-xs font-bold">GST</span>} tone="warning" />
      </section>

      <div role="tablist" aria-label="Report type" className="thin-scroll flex gap-1 overflow-x-auto border-b border-border">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={report === r.id}
            type="button"
            onClick={() => setReport(r.id)}
            className={cn(
              "-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-[13.5px] font-medium transition-colors",
              report === r.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="print-area flex flex-col gap-4">
        <div className="hidden print:block">
          <p className="text-lg font-semibold">{REPORTS.find((r) => r.id === report)?.label}</p>
          <p className="text-sm">Generated {format(now, "dd MMM yyyy, HH:mm")}</p>
        </div>
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">{cfg.title}</h3>
            <p className="text-xs text-muted">{cfg.subtitle}</p>
          </div>
          {cfg.chart && (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {cfg.chart.kind === "pie" ? (
                  <PieChart>
                    <Pie data={cfg.chart.data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2} stroke="none">
                      {cfg.chart.data.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v) => formatPKR(Number(v))} />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={cfg.chart.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v) => formatCompact(Number(v))} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <RTooltip formatter={(v) => formatPKR(Number(v))} cursor={{ fill: "var(--surface-muted)" }} />
                    {cfg.chart.series.length > 1 && <Legend />}
                    {cfg.chart.series.map((s) => (
                      <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card className="overflow-hidden">
          <DataTable<Record<string, unknown>> data={cfg.rows} columns={cfg.columns as ColumnDef<Record<string, unknown>, unknown>[]} searchable={false} pageSize={8} emptyTitle="No data for this period" />
        </Card>
      </div>
    </div>
  );
}

/* ---------- report builders ---------- */

interface Built {
  title: string;
  subtitle: string;
  chart?: { kind: "bar" | "pie"; data: Record<string, string | number>[]; series: { key: string; name: string; color: string }[] };
  rows: Record<string, unknown>[];
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  csv: Record<string, string | number>[];
}

function useReportData(args: {
  report: ReportId;
  sales: Sale[];
  allSales: Sale[];
  medicines: Medicine[];
  categories: Category[];
  purchases: Purchase[];
  suppliers: Supplier[];
  now: Date;
  days: number;
}): Built {
  const { report, sales, allSales, medicines, categories, purchases, suppliers, now, days } = args;

  return React.useMemo<Built>(() => {
    const money = (k: string) => ({ accessorKey: k, header: k, cell: ({ getValue }: { getValue: () => unknown }) => <span className="tabular-nums">{formatPKR(Number(getValue()))}</span> });
    const txt = (k: string, h = k) => ({ accessorKey: k, header: h, cell: ({ getValue }: { getValue: () => unknown }) => <span>{String(getValue())}</span> });
    const num = (k: string, h = k) => ({ accessorKey: k, header: h, cell: ({ getValue }: { getValue: () => unknown }) => <span className="tabular-nums">{formatNumber(Number(getValue()))}</span> });

    switch (report) {
      case "daily": {
        const data = dailySeries(sales, Math.min(days, 60), now);
        return {
          title: "Daily sales",
          subtitle: "Revenue and transaction count per day",
          chart: { kind: "bar", data: data.map((d) => ({ label: d.label, revenue: d.revenue })), series: [{ key: "revenue", name: "Revenue", color: "#2563EB" }] },
          rows: data.map((d) => ({ date: d.label, orders: d.orders, revenue: d.revenue, avg: d.orders ? Math.round(d.revenue / d.orders) : 0 })).reverse(),
          columns: [txt("date", "Date"), num("orders", "Orders"), money("revenue"), money("avg")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: data.map((d) => ({ date: d.label, orders: d.orders, revenue: d.revenue })),
        };
      }
      case "weekly": {
        const weeks = Array.from({ length: Math.max(4, Math.ceil(days / 7)) }, (_, i) => startOfWeek(subWeeks(now, Math.ceil(days / 7) - 1 - i), { weekStartsOn: 1 }));
        const data = weeks.map((ws) => {
          const we = new Date(ws.getTime() + 7 * 86400000);
          const inW = sales.filter((s) => new Date(s.date) >= ws && new Date(s.date) < we);
          return { label: `Wk of ${format(ws, "dd MMM")}`, revenue: saleRevenue(inW), orders: inW.length };
        });
        return {
          title: "Weekly sales",
          subtitle: "Revenue by week, Monday to Sunday",
          chart: { kind: "bar", data, series: [{ key: "revenue", name: "Revenue", color: "#0D9488" }] },
          rows: data.slice().reverse().map((d) => ({ week: d.label, orders: d.orders, revenue: d.revenue })),
          columns: [txt("week", "Week"), num("orders", "Orders"), money("revenue")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: data.map((d) => ({ week: d.label, orders: d.orders, revenue: d.revenue })),
        };
      }
      case "monthly": {
        const data = monthlySeries(allSales, 12, now);
        return {
          title: "Monthly sales",
          subtitle: "Revenue and orders, last 12 months",
          chart: { kind: "bar", data: data.map((d) => ({ label: d.label, revenue: d.revenue })), series: [{ key: "revenue", name: "Revenue", color: "#2563EB" }] },
          rows: data.slice().reverse().map((d) => ({ month: d.label, orders: d.orders, revenue: d.revenue })),
          columns: [txt("month", "Month"), num("orders", "Orders"), money("revenue")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: data.map((d) => ({ month: d.label, orders: d.orders, revenue: d.revenue })),
        };
      }
      case "pnl": {
        const data = monthlySeries(allSales, 6, now).map((m, i) => {
          const monthIdx = i;
          const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - (5 - monthIdx), 1));
          const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
          const inM = allSales.filter((s) => s.paymentStatus === "Paid" && new Date(s.date) >= start && new Date(s.date) <= end);
          const revenue = saleRevenue(inM);
          const cost = inM.reduce((s, x) => s + x.items.reduce((c, it) => c + (medicines.find((md) => md.id === it.medicineId)?.purchasePrice ?? 0) * it.quantity, 0), 0);
          return { label: m.label, revenue, cost, profit: revenue - cost, margin: revenue ? Math.round(((revenue - cost) / revenue) * 100) : 0 };
        });
        return {
          title: "Profit & loss",
          subtitle: "Revenue against cost of goods sold, last 6 months",
          chart: {
            kind: "bar",
            data,
            series: [
              { key: "revenue", name: "Revenue", color: "#2563EB" },
              { key: "cost", name: "Cost of goods", color: "#CBD5E1" },
              { key: "profit", name: "Gross profit", color: "#0D9488" },
            ],
          },
          rows: data.slice().reverse().map((d) => ({ month: d.label, revenue: d.revenue, cost: d.cost, profit: d.profit, margin: `${d.margin}%` })),
          columns: [txt("month", "Month"), money("revenue"), money("cost"), money("profit"), txt("margin", "Margin")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: data.map((d) => ({ month: d.label, revenue: d.revenue, cost: d.cost, profit: d.profit, margin_pct: d.margin })),
        };
      }
      case "best": {
        const top = topSellers(sales, 15);
        return {
          title: "Best selling medicines",
          subtitle: "Ranked by units sold in the selected period",
          chart: { kind: "bar", data: top.slice(0, 8).map((t) => ({ label: t.name, revenue: t.revenue })), series: [{ key: "revenue", name: "Revenue", color: "#2563EB" }] },
          rows: top.map((t, i) => ({ rank: i + 1, name: `${t.name} ${t.strength}`, units: t.qty, revenue: t.revenue })),
          columns: [num("rank", "#"), txt("name", "Medicine"), num("units", "Units"), money("revenue")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: top.map((t, i) => ({ rank: i + 1, medicine: `${t.name} ${t.strength}`, units: t.qty, revenue: t.revenue })),
        };
      }
      case "category": {
        const data = categoryShare(sales, medicines, categories).map((c) => ({ name: c.name, value: c.value }));
        return {
          title: "Category-wise sales",
          subtitle: "Share of revenue by therapeutic category",
          chart: { kind: "pie", data, series: [] },
          rows: data.map((d) => ({ category: d.name, revenue: d.value, share: `${((d.value / Math.max(1, data.reduce((s, x) => s + x.value, 0))) * 100).toFixed(1)}%` })),
          columns: [txt("category", "Category"), money("revenue"), txt("share", "Share")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: data.map((d) => ({ category: d.name, revenue: d.value })),
        };
      }
      case "valuation": {
        const rows = categories.map((c) => {
          const items = medicines.filter((m) => m.categoryId === c.id);
          const v = inventoryValuation(items);
          return { category: c.name, skus: items.length, units: items.reduce((s, m) => s + m.stock, 0), cost: v.cost, retail: v.retail };
        });
        const total = inventoryValuation(medicines);
        return {
          title: "Inventory valuation",
          subtitle: `Total cost ${formatPKR(total.cost)} · retail ${formatPKR(total.retail)} as of today`,
          chart: { kind: "bar", data: rows.map((r) => ({ label: r.category, cost: r.cost, retail: r.retail })), series: [{ key: "cost", name: "Cost", color: "#94A3B8" }, { key: "retail", name: "Retail", color: "#2563EB" }] },
          rows,
          columns: [txt("category", "Category"), num("skus", "SKUs"), num("units", "Units"), money("cost"), money("retail")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: rows,
        };
      }
      case "purchases": {
        const byMonth = new Map<string, { total: number; orders: number }>();
        purchases
          .filter((p) => p.status !== "Cancelled" && p.status !== "Draft")
          .forEach((p) => {
            const k = format(new Date(p.purchaseDate), "MMM yy");
            const cur = byMonth.get(k) ?? { total: 0, orders: 0 };
            cur.total += p.total;
            cur.orders += 1;
            byMonth.set(k, cur);
          });
        const data = [...byMonth.entries()].map(([label, v]) => ({ label, total: v.total, orders: v.orders }));
        const bySup = suppliers.map((s) => {
          const list = purchases.filter((p) => p.supplierId === s.id && p.status !== "Cancelled");
          return { supplier: s.name, orders: list.length, total: list.reduce((x, p) => x + p.total, 0), open: list.filter((p) => p.paymentStatus !== "Paid").reduce((x, p) => x + p.total, 0) };
        });
        return {
          title: "Purchase report",
          subtitle: "Purchase value by month, with supplier totals in the table",
          chart: { kind: "bar", data, series: [{ key: "total", name: "Purchases", color: "#0D9488" }] },
          rows: bySup,
          columns: [txt("supplier", "Supplier"), num("orders", "Orders"), money("total"), money("open")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: bySup,
        };
      }
      case "expiry": {
        const g = expiryGroups(medicines);
        const val = (l: Medicine[]) => l.reduce((s, m) => s + m.purchasePrice * m.stock, 0);
        const data = [
          { label: "Expired", value: val(g.expired), count: g.expired.length },
          { label: "≤30 days", value: val(g.d30), count: g.d30.length },
          { label: "≤60 days", value: val(g.d60), count: g.d60.length },
          { label: "≤90 days", value: val(g.d90), count: g.d90.length },
        ];
        const rows = medicines
          .filter((m) => expiryBucket(m.expiryDate) !== "safe")
          .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
          .map((m) => ({ medicine: `${m.name} ${m.strength}`, batch: m.batchNumber, expiry: formatDate(m.expiryDate), days: daysUntil(m.expiryDate), stock: m.stock, value: m.purchasePrice * m.stock }));
        return {
          title: "Expiry report",
          subtitle: "Estimated cost value at risk by expiry window",
          chart: { kind: "bar", data: data.map((d) => ({ label: d.label, value: d.value })), series: [{ key: "value", name: "Value at cost", color: "#EA580C" }] },
          rows,
          columns: [txt("medicine", "Medicine"), txt("batch", "Batch"), txt("expiry", "Expiry"), num("days", "Days left"), num("stock", "Qty"), money("value")] as ColumnDef<Record<string, unknown>, unknown>[],
          csv: rows,
        };
      }
    }
  }, [report, sales, allSales, medicines, categories, purchases, suppliers, now, days]);
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
  const blob = new Blob([`${headers.join(",")}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
