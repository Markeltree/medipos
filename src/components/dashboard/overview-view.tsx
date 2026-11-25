"use client";

import Link from "next/link";
import * as React from "react";
import { isSameDay, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  CalendarClock,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard, EmptyState, MedicineThumb } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { useDataStore } from "@/store/data-store";
import { previousPeriodBaseline } from "@/data/seed";
import { categoryShare, dailySeries, monthlySeries, percentChange, salesBetween, saleRevenue, topSellers, expiryGroups } from "@/lib/analytics";
import { daysUntil, formatCompact, formatDate, formatDateTime, formatNumber, formatPKR, stockStatus, statusStyles, cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Sale, ActivityItem } from "@/types";

const CHART_COLORS = ["#2563EB", "#0D9488", "#60A5FA", "#5EEAD4", "#94A3B8", "#A5B4FC", "#F59E0B", "#CBD5E1"];

export function OverviewView() {
  const sales = useDataStore((s) => s.sales);
  const medicines = useDataStore((s) => s.medicines);
  const categories = useDataStore((s) => s.categories);
  const activity = useDataStore((s) => s.activity);

  const now = new Date();
  const kpis = React.useMemo(() => {
    const today = sales.filter((s) => isSameDay(new Date(s.date), now) && s.paymentStatus === "Paid");
    const yesterday = sales.filter((s) => isSameDay(new Date(s.date), subDays(now, 1)) && s.paymentStatus === "Paid");
    const last30 = salesBetween(sales, startOfDay(subDays(now, 29)), endOfDay(now));
    const prev30 = salesBetween(sales, startOfDay(subDays(now, 59)), endOfDay(subDays(now, 30)));
    const expiring = expiryGroups(medicines);
    const expiringSoon = expiring.d30.length + expiring.d60.length + expiring.d90.length;
    const lowStock = medicines.filter((m) => stockStatus(m) === "Low Stock" || stockStatus(m) === "Out of Stock").length;
    return {
      todayRevenue: saleRevenue(today),
      todayRevenueChange: percentChange(saleRevenue(today), saleRevenue(yesterday)),
      todayOrders: today.length,
      todayOrdersChange: percentChange(today.length, yesterday.length),
      products: medicines.length,
      productsChange: percentChange(medicines.length, previousPeriodBaseline.products),
      lowStock,
      lowStockChange: percentChange(lowStock, previousPeriodBaseline.lowStock),
      expiringSoon,
      expiringChange: percentChange(expiringSoon, previousPeriodBaseline.expiringSoon),
      totalRevenue: saleRevenue(last30),
      totalRevenueChange: percentChange(saleRevenue(last30), saleRevenue(prev30)),
    };
  }, [sales, medicines]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekly = React.useMemo(() => dailySeries(sales, 7, now), [sales]); // eslint-disable-line react-hooks/exhaustive-deps
  const monthly = React.useMemo(() => monthlySeries(sales, 6, now), [sales]); // eslint-disable-line react-hooks/exhaustive-deps
  const donut = categoryShare(sales, medicines, categories);
  const top = React.useMemo(() => topSellers(sales, 5), [sales]);
  const recent = React.useMemo(
    () => [...sales].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6),
    [sales],
  );
  const lowStockItems = medicines
    .filter((m) => ["Low Stock", "Out of Stock"].includes(stockStatus(m)))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);
  const expiringItems = medicines
    .filter((m) => daysUntil(m.expiryDate) <= 90)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description={`Counter performance for ${formatDate(now, "EEEE, dd MMMM yyyy")}`}
        actions={
          <Link href="/pos">
            <Button>
              <Receipt /> Open POS
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's sales" value={formatPKR(kpis.todayRevenue)} icon={<Wallet className="size-4" />} change={kpis.todayRevenueChange} changeLabel="vs yesterday" />
        <StatCard label="Total orders" value={formatNumber(kpis.todayOrders)} icon={<Receipt className="size-4" />} tone="accent" change={kpis.todayOrdersChange} changeLabel="vs yesterday" />
        <StatCard label="Total products" value={formatNumber(kpis.products)} icon={<Package className="size-4" />} tone="primary" change={kpis.productsChange} changeLabel="vs last month" />
        <StatCard label="Low stock" value={formatNumber(kpis.lowStock)} icon={<AlertTriangle className="size-4" />} tone="warning" change={kpis.lowStockChange} changeLabel="vs last month" invertTrend />
        <StatCard label="Expiring soon" value={formatNumber(kpis.expiringSoon)} icon={<CalendarClock className="size-4" />} tone="orange" change={kpis.expiringChange} changeLabel="vs last month" invertTrend />
        <StatCard label="Total revenue" value={formatCompact(kpis.totalRevenue) + " PKR"} icon={<BadgeIndianRupee className="size-4" />} tone="success" change={kpis.totalRevenueChange} changeLabel="vs prev. 30d" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <ChartHeader title="Weekly sales" subtitle="Revenue over the last 7 days" />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="short" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatCompact(v)} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <RTooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={2} fill="url(#weeklyFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <ChartHeader title="Sales by category" subtitle="Share of revenue, all time" />
          {donut.length === 0 ? (
            <EmptyState compact title="No sales yet" />
          ) : (
            <div className="grid items-center gap-3">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                      {donut.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v) => formatPKR(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {donut.slice(0, 5).map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                    <span className="flex-1 truncate text-muted">{d.name}</span>
                    <span className="tabular-nums">{formatCompact(d.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <ChartHeader title="Monthly revenue" subtitle="Last six months" />
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => formatCompact(v)} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-muted)" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <ChartHeader title="Recent sales activity" subtitle="Latest counter transactions" />
          <ul className="flex flex-col divide-y divide-border">
            {recent.map((s) => (
              <SaleRow key={s.id} sale={s} />
            ))}
          </ul>
          <Link href="/sales" className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-medium text-primary hover:underline">
            View all sales <ArrowRight className="size-3.5" />
          </Link>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Recent transactions" action={{ href: "/sales", label: "Sales history" }} />
          <DataTable<Sale>
            data={recent}
            searchable={false}
            pageSize={6}
            columns={transactionColumns}
            emptyTitle="No transactions yet"
          />
        </Card>

        <Card className="p-4">
          <SectionTitle title="Top selling medicines" action={{ href: "/reports", label: "Reports" }} inline />
          {top.length === 0 ? (
            <EmptyState compact title="No sales to rank yet" />
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              {top.map((t, i) => {
                const max = top[0].qty;
                return (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs tabular-nums text-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="truncate font-medium">{t.name} <span className="font-normal text-muted">{t.strength}</span></span>
                        <span className="tabular-nums text-muted">{formatNumber(t.qty)} units</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(t.qty / max) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-1">
          <SectionTitle title="Low stock alerts" action={{ href: "/inventory", label: "Inventory" }} inline />
          {lowStockItems.length === 0 ? (
            <EmptyState compact title="Stock levels look healthy" />
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {lowStockItems.map((m) => {
                const st = stockStatus(m);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <MedicineThumb name={m.name} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{m.name} <span className="font-normal text-muted">{m.strength}</span></p>
                      <p className="text-xs text-muted">Min {m.minStock} · {m.stock} on hand</p>
                    </div>
                    <Badge className={statusStyles[st]}>{st}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4 xl:col-span-1">
          <SectionTitle title="Medicines near expiry" action={{ href: "/expiry", label: "Expiry" }} inline />
          {expiringItems.length === 0 ? (
            <EmptyState compact title="No batches expiring in 90 days" />
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {expiringItems.map((m) => {
                const d = daysUntil(m.expiryDate);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <MedicineThumb name={m.name} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{m.name} <span className="font-normal text-muted">{m.batchNumber}</span></p>
                      <p className="text-xs text-muted">Expires {formatDate(m.expiryDate)}</p>
                    </div>
                    <Badge tone={d < 0 ? "danger" : d <= 30 ? "orange" : "warning"}>{d < 0 ? "Expired" : `${d} days`}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4 xl:col-span-1">
          <SectionTitle title="Recent activity" inline />
          <ActivityTimeline items={activity.slice(0, 6)} />
        </Card>
      </section>
    </div>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted">{subtitle}</p>
    </div>
  );
}

function SectionTitle({
  title,
  action,
  inline,
}: {
  title: string;
  action?: { href: string; label: string };
  inline?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between", inline ? "" : "px-4 pt-4")}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {action && (
        <Link href={action.href} className="text-xs font-medium text-primary hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function SaleRow({ sale }: { sale: Sale }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
        <Receipt className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{sale.customerName}</p>
        <p className="text-xs text-muted">
          {sale.id} · {formatDateTime(sale.date)}
        </p>
      </div>
      <span className="text-[13px] font-medium tabular-nums">{formatPKR(sale.total)}</span>
    </li>
  );
}

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <EmptyState compact title="No activity yet" />;
  const icon = { sale: Receipt, stock: Package, purchase: Activity, prescription: CalendarClock, system: AlertTriangle };
  return (
    <ol className="relative mt-3 flex flex-col gap-4 pl-5 before:absolute before:inset-y-1 before:left-[7px] before:w-px before:bg-border">
      {items.map((it) => {
        const Icon = icon[it.kind];
        return (
          <li key={it.id} className="relative">
            <span className="absolute -left-5 top-0.5 flex size-4 items-center justify-center rounded-full bg-surface ring-2 ring-surface">
              <span className="size-2 rounded-full bg-primary" />
            </span>
            <p className="flex items-start gap-1.5 text-[13px] leading-snug">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted" />
              {it.message}
            </p>
            <p className="mt-0.5 text-xs text-muted">{formatDateTime(it.time)}</p>
          </li>
        );
      })}
    </ol>
  );
}

const transactionColumns: ColumnDef<Sale, unknown>[] = [
  {
    accessorKey: "id",
    header: "Transaction",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
  },
  { accessorKey: "customerName", header: "Customer" },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="whitespace-nowrap text-muted">{formatDateTime(row.original.date)}</span>,
  },
  {
    accessorKey: "total",
    header: "Amount",
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatPKR(row.original.total)}</span>,
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment",
    cell: ({ row }) => <Badge>{row.original.paymentMethod}</Badge>,
  },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted">{label}</p>
      <p className="font-medium tabular-nums">{formatPKR(Number(payload[0].value ?? 0))}</p>
    </div>
  );
}

