"use client";

import * as React from "react";
import { Clock, Minus, Plus, ShoppingBag, Trash2, UserPlus, X, PauseCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Input, Kbd, Select } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, MedicineThumb } from "@/components/shared/misc";
import { useCart } from "@/hooks/use-cart";
import { usePosStore } from "@/store/pos-store";
import { useDataStore } from "@/store/data-store";
import { cn, formatDateTime, formatNumber, formatPKR } from "@/lib/utils";

export function CartPanel({ onCheckout, onNewCustomer }: { onCheckout: () => void; onNewCustomer: () => void }) {
  const { lines, totals, customers } = useCart();
  const profile = useDataStore((s) => s.profile);
  const customerId = usePosStore((s) => s.customerId);
  const setCustomer = usePosStore((s) => s.setCustomer);
  const orderDiscount = usePosStore((s) => s.orderDiscount);
  const setOrderDiscount = usePosStore((s) => s.setOrderDiscount);
  const setQuantity = usePosStore((s) => s.setQuantity);
  const setLineDiscount = usePosStore((s) => s.setLineDiscount);
  const removeLine = usePosStore((s) => s.removeLine);
  const clearCart = usePosStore((s) => s.clearCart);
  const holdOrder = usePosStore((s) => s.holdOrder);
  const restoreHeld = usePosStore((s) => s.restoreHeld);
  const heldOrders = usePosStore((s) => s.heldOrders);
  const [confirmClear, setConfirmClear] = React.useState(false);

  const sortedCustomers = React.useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  const changeQty = (medicineId: string, stock: number, next: number) => {
    if (next > stock) {
      toast.warning(`Only ${stock} in stock for this medicine`);
    }
    setQuantity(medicineId, next, stock);
  };

  const hold = () => {
    if (lines.length === 0) return;
    holdOrder();
    toast.success("Order held. Restore it from the Held orders menu.");
  };

  const restore = (id: string) => {
    if (lines.length > 0) holdOrder(); // never lose the current cart
    restoreHeld(id);
    toast.success("Held order restored");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Current sale</h3>
          <p className="text-xs text-muted">
            {formatNumber(totals.itemCount)} {totals.itemCount === 1 ? "item" : "items"} · {lines.length} {lines.length === 1 ? "line" : "lines"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative" aria-label="Held orders">
                <Clock /> Held
                {heldOrders.length > 0 && <Badge tone="primary" className="ml-0.5 px-1.5">{heldOrders.length}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              <DropdownMenuLabel>Held orders</DropdownMenuLabel>
              {heldOrders.length === 0 && <div className="px-2.5 pb-2 text-[13px] text-muted">No orders on hold.</div>}
              {heldOrders.map((h) => {
                const count = h.cart.reduce((s, l) => s + l.quantity, 0);
                return (
                  <DropdownMenuItem key={h.id} onSelect={() => restore(h.id)} className="items-start">
                    <ShoppingBag className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">{h.label}</span>
                      <span className="block text-xs text-muted">
                        {count} items · held {formatDateTime(h.heldAt)}
                      </span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear cart"
            disabled={lines.length === 0}
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Select
          aria-label="Customer"
          value={customerId ?? ""}
          onChange={(e) => setCustomer(e.target.value || null)}
          className="h-9"
        >
          <option value="">Walk-in customer</option>
          {sortedCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.phone}
            </option>
          ))}
        </Select>
        <Button variant="outline" size="icon" onClick={onNewCustomer} aria-label="Add new customer" className="shrink-0">
          <UserPlus />
        </Button>
      </div>

      {/* Lines */}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-5" />}
            title="Cart is empty"
            description="Select medicines on the left to add them to this sale."
            compact
          />
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((l) => {
              const max = l.medicine.stock;
              return (
                <li key={l.medicineId} className="flex gap-3 px-4 py-3">
                  <MedicineThumb name={l.medicine.name} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{l.medicine.name} <span className="font-normal text-muted">{l.medicine.strength}</span></p>
                        <p className="text-xs text-muted">{formatPKR(l.medicine.sellingPrice)} each</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(l.medicineId)}
                        className="-mr-1 -mt-0.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
                        aria-label={`Remove ${l.medicine.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-md border border-border">
                        <button
                          type="button"
                          onClick={() => changeQty(l.medicineId, max, l.quantity - 1)}
                          className="inline-flex size-7 cursor-pointer items-center justify-center text-muted hover:text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-[13px] font-medium tabular-nums">{l.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(l.medicineId, max, l.quantity + 1)}
                          disabled={l.quantity >= max}
                          className="inline-flex size-7 cursor-pointer items-center justify-center text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-muted">
                          Disc
                          <Input
                            type="number"
                            min={0}
                            aria-label={`Discount for ${l.medicine.name}`}
                            value={l.discount || ""}
                            placeholder="0"
                            onChange={(e) => setLineDiscount(l.medicineId, Number(e.target.value) || 0)}
                            className="h-7 w-16 px-2 text-right text-xs tabular-nums"
                          />
                        </label>
                        <span className="w-20 text-right text-[13px] font-semibold tabular-nums">{formatPKR(l.lineTotal)}</span>
                      </div>
                    </div>
                    {l.quantity >= max && (
                      <p className="mt-1.5 text-[11px] text-warning">Maximum on hand: {max}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-border px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <div role="radiogroup" aria-label="Discount type" className="inline-flex shrink-0 rounded-md border border-border p-0.5 text-xs">
            {(["percent", "fixed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={orderDiscount.type === t}
                onClick={() => setOrderDiscount({ ...orderDiscount, type: t })}
                className={cn(
                  "h-7 cursor-pointer rounded px-2.5 font-medium",
                  orderDiscount.type === t ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {t === "percent" ? "%" : "Rs"}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={0}
            aria-label="Order discount"
            placeholder="Order discount"
            value={orderDiscount.value || ""}
            onChange={(e) => setOrderDiscount({ ...orderDiscount, value: Math.max(0, Number(e.target.value) || 0) })}
            className="h-8 text-sm"
          />
        </div>

        <dl className="flex flex-col gap-1.5 text-[13px]">
          <Row label="Subtotal" value={formatPKR(totals.subtotal)} />
          {totals.lineDiscount > 0 && <Row label="Line discounts" value={`- ${formatPKR(totals.lineDiscount)}`} />}
          {totals.orderDiscount > 0 && <Row label="Order discount" value={`- ${formatPKR(totals.orderDiscount)}`} />}
          <Row label={`Tax (${profile.taxRate}% ${profile.taxInclusive ? "incl." : "excl."})`} value={formatPKR(totals.tax)} />
        </dl>
        <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
          <span className="text-sm font-medium">Grand total</span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight">{formatPKR(totals.total)}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={hold} disabled={lines.length === 0}>
            <PauseCircle /> Hold order
          </Button>
          <Button onClick={onCheckout} disabled={lines.length === 0} className="justify-between">
            <span className="flex items-center gap-2">
              <CreditCard /> Complete sale
            </span>
            <Kbd>Ctrl ↵</Kbd>
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear this sale?"
        description="All items, the customer selection and order discount will be removed. This cannot be undone."
        confirmLabel="Clear cart"
        onConfirm={() => {
          clearCart();
          toast.success("Cart cleared");
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
