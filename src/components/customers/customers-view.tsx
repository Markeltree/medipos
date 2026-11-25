"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Award, Eye, Gift, MoreHorizontal, Pencil, Plus, Receipt, Trash2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Skeleton } from "@/components/ui/primitives";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { useDataStore } from "@/store/data-store";
import { formatDate, formatDateTime, formatNumber, formatPKR } from "@/lib/utils";
import type { Customer } from "@/types";

const REDEEM_POINTS = 500;
const REDEEM_VALUE = 200;

export function CustomersView() {
  const customers = useDataStore((s) => s.customers);
  const deleteCustomer = useDataStore((s) => s.deleteCustomer);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [viewing, setViewing] = React.useState<Customer | null>(null);
  const [toDelete, setToDelete] = React.useState<Customer | null>(null);

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

  const [mountedAt] = React.useState(() => Date.now());
  const totalSpend = customers.reduce((s, c) => s + c.totalPurchases, 0);
  const points = customers.reduce((s, c) => s + c.loyaltyPoints, 0);
  const activeCount = customers.filter((c) => c.lastPurchase && mountedAt - new Date(c.lastPurchase).getTime() < 1000 * 60 * 60 * 24 * 30).length;

  const columns: ColumnDef<Customer, unknown>[] = [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
              {row.original.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted">{row.original.email || "No email"}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => <span className="font-mono text-[13px]">{String(getValue())}</span> },
      { accessorKey: "address", header: "Address", cell: ({ getValue }) => <span className="line-clamp-1 max-w-64 text-muted">{String(getValue())}</span> },
      { accessorKey: "totalPurchases", header: "Total purchases", cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatPKR(Number(getValue()))}</span> },
      {
        accessorKey: "loyaltyPoints",
        header: "Points",
        cell: ({ getValue }) => <Badge tone="accent">{formatNumber(Number(getValue()))} pts</Badge>,
      },
      {
        accessorKey: "lastPurchase",
        header: "Last purchase",
        cell: ({ getValue }) => <span className="whitespace-nowrap text-muted">{getValue() ? formatDate(String(getValue())) : "Never"}</span>,
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
                  <Eye /> View profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { setEditing(row.original); setFormOpen(true); }}>
                  <Pencil /> Edit customer
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
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Customers"
        description="Profiles, purchase history and loyalty points"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add customer
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Customers" value={formatNumber(customers.length)} icon={<Users className="size-4" />} tone="primary" />
        <StatCard label="Active (30 days)" value={formatNumber(activeCount)} icon={<Users className="size-4" />} tone="accent" />
        <StatCard label="Lifetime spend" value={formatPKR(totalSpend)} icon={<Wallet className="size-4" />} tone="success" />
        <StatCard label="Outstanding points" value={formatNumber(points)} icon={<Award className="size-4" />} tone="warning" />
      </section>

      <Card className="overflow-hidden">
        <DataTable<Customer>
          data={customers}
          columns={columns}
          initialQuery={params.get("q") ?? ""}
          searchPlaceholder="Search name, phone, email…"
          onRowClick={(c) => setViewing(c)}
          emptyTitle="No customers found"
          emptyAction={<Button size="sm" onClick={() => setFormOpen(true)}><Plus /> Add customer</Button>}
        />
      </Card>

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent side="right">
          {viewing && (
            <CustomerProfile
              customerId={viewing.id}
              onEdit={() => {
                setEditing(viewing);
                setViewing(null);
                setFormOpen(true);
              }}
              onClose={() => setViewing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete customer?"
        description={`${toDelete?.name ?? ""} will be removed. Past sales keep the name on the receipt record.`}
        onConfirm={() => {
          if (toDelete) {
            deleteCustomer(toDelete.id);
            toast.success("Customer deleted");
          }
        }}
      />
    </div>
  );
}

function CustomerProfile({ customerId, onEdit, onClose }: { customerId: string; onEdit: () => void; onClose: () => void }) {
  const customer = useDataStore((s) => s.customers.find((c) => c.id === customerId));
  const sales = useDataStore((s) => s.sales);
  const updateCustomer = useDataStore((s) => s.updateCustomer);
  if (!customer) return <Skeleton className="h-40" />;

  const history = sales.filter((s) => s.customerId === customer.id).slice(0, 25);
  const canRedeem = customer.loyaltyPoints >= REDEEM_POINTS;
  const nextTier = Math.ceil((customer.loyaltyPoints + 1) / REDEEM_POINTS) * REDEEM_POINTS;
  const progress = Math.min(100, (customer.loyaltyPoints / nextTier) * 100);

  return (
    <>
      <DialogHeader title={customer.name} description={`${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`} />
      <DialogBody className="flex flex-col gap-4">
        <p className="text-[13px] text-muted">{customer.address}</p>
        {customer.dateOfBirth && <p className="text-[13px] text-muted">Born {formatDate(customer.dateOfBirth)}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted">Total purchases</p>
            <p className="mt-0.5 font-semibold tabular-nums">{formatPKR(customer.totalPurchases)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted">Last purchase</p>
            <p className="mt-0.5 font-semibold">{customer.lastPurchase ? formatDate(customer.lastPurchase) : "Never"}</p>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold"><Award className="size-4 text-accent" /> Loyalty points</p>
            <span className="text-sm font-semibold tabular-nums">{formatNumber(customer.loyaltyPoints)} pts</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            Earn 1 point per Rs 100 spent. Redeem {REDEEM_POINTS} points for a {formatPKR(REDEEM_VALUE)} voucher.
          </p>
          <Button
            size="sm"
            variant="subtle"
            className="mt-3 w-full"
            disabled={!canRedeem}
            onClick={() => {
              updateCustomer(customer.id, { loyaltyPoints: customer.loyaltyPoints - REDEEM_POINTS });
              toast.success(`${formatPKR(REDEEM_VALUE)} voucher redeemed for ${customer.name}`);
            }}
          >
            <Gift /> {canRedeem ? "Redeem voucher" : `${REDEEM_POINTS - customer.loyaltyPoints} points to go`}
          </Button>
        </Card>

        <div>
          <p className="mb-2 text-sm font-semibold">Purchase history</p>
          {history.length === 0 ? (
            <EmptyState compact title="No purchases yet" />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {history.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs">{s.id}</p>
                    <p className="truncate text-xs text-muted">{s.items.map((i) => i.name).join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{formatPKR(s.total)}</p>
                    <p className="text-xs text-muted">{formatDateTime(s.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={onEdit}><Pencil /> Edit customer</Button>
      </DialogFooter>
    </>
  );
}
