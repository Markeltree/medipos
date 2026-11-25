"use client";

import * as React from "react";
import { Plus, Search, ShoppingBag, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Kbd } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn, formatNumber, formatPKR, stockStatus } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { usePosStore } from "@/store/pos-store";
import { useCart } from "@/hooks/use-cart";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { MedicineThumb } from "@/components/shared/misc";
import type { Medicine } from "@/types";

export function PosView() {
  const medicines = useDataStore((s) => s.medicines);
  const categories = useDataStore((s) => s.categories);
  const addToCart = usePosStore((s) => s.addToCart);
  const setCustomer = usePosStore((s) => s.setCustomer);
  const cart = usePosStore((s) => s.cart);
  const { lines, totals, customer, saleItems, overStock } = useCart();

  const [query, setQuery] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("all");
  const [payOpen, setPayOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const inCart = React.useMemo(() => new Map(cart.map((l) => [l.medicineId, l.quantity])), [cart]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return medicines
      .filter((m) => categoryId === "all" || m.categoryId === categoryId)
      .filter(
        (m) =>
          !q ||
          `${m.name} ${m.genericName} ${m.brand} ${m.barcode} ${m.sku}`.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.name.localeCompare(b.name));
  }, [medicines, query, categoryId]);

  // Keep cart quantities within stock if another sale or a dispense reduced it.
  React.useEffect(() => {
    usePosStore.getState().cart.forEach((l) => {
      const med = medicines.find((m) => m.id === l.medicineId);
      if (med && l.quantity > med.stock) {
        usePosStore.getState().setQuantity(l.medicineId, med.stock, med.stock);
      }
    });
  }, [medicines]);

  const add = React.useCallback(
    (m: Medicine) => {
      if (stockStatus(m) === "Expired") {
        toast.error(`${m.name} expired on ${m.expiryDate}. It cannot be sold.`);
        return;
      }
      const result = addToCart(m.id, m.stock);
      if (result === "out") toast.error(`${m.name} is out of stock`);
      if (result === "limit") toast.warning(`Only ${m.stock} of ${m.name} available`);
    },
    [addToCart],
  );

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = query.trim();
    if (!code) return;
    const byBarcode = medicines.find((m) => m.barcode === code || m.sku.toLowerCase() === code.toLowerCase());
    if (byBarcode) {
      add(byBarcode);
      setQuery("");
    }
  };

  const checkout = React.useCallback(() => {
    if (lines.length === 0) {
      toast.info("Add a medicine to the cart first");
      return;
    }
    if (overStock.length > 0) {
      toast.error(`Reduce quantity of ${overStock[0].medicine.name}. Only ${overStock[0].medicine.stock} in stock.`);
      return;
    }
    setDrawerOpen(false);
    setPayOpen(true);
  }, [lines.length, overStock]);

  // Ctrl/⌘ + K focuses POS search (overrides the global palette here); Ctrl/⌘ + Enter opens checkout.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (mod && e.key === "Enter") {
        e.preventDefault();
        checkout();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [checkout]);

  const cartPanel = <CartPanel onCheckout={checkout} onNewCustomer={() => setNewCustomerOpen(true)} />;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-0">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        {/* Product catalogue */}
        <section className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Search by name, generic, brand or scan barcode…"
                aria-label="Search medicines"
                className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-24 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </span>
            </div>
          </div>

          <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categories">
            {[{ id: "all", name: "All medicines" }, ...categories].map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span>{formatNumber(visible.length)} medicines</span>
            <span className="hidden sm:inline">Enter on a scanned barcode adds it to the cart</span>
          </div>

          <div className="thin-scroll grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pb-24 pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:pb-1">
            {visible.length === 0 && (
              <div className="col-span-full flex flex-col items-center py-16 text-center">
                <p className="text-sm font-medium">No medicines match “{query || "this filter"}”</p>
                <p className="mt-1 text-[13px] text-muted">Check the spelling, try the generic name or clear the category.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(""); setCategoryId("all"); }}>
                  Clear filters
                </Button>
              </div>
            )}
            {visible.map((m) => (
              <ProductCard key={m.id} medicine={m} qtyInCart={inCart.get(m.id) ?? 0} onAdd={() => add(m)} />
            ))}
          </div>
        </section>

        {/* Cart: desktop */}
        <aside className="hidden min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface lg:flex">
          {cartPanel}
        </aside>
      </div>

      {/* Cart: tablet and mobile drawer */}
      <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <Button size="lg" className="w-full justify-between shadow-lg" onClick={() => setDrawerOpen(true)}>
          <span className="flex items-center gap-2">
            <ShoppingBag />
            View cart
            <Badge tone="neutral" className="border-transparent bg-white/20 text-white">{totals.itemCount}</Badge>
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            {formatPKR(totals.total)} <ChevronRight className="size-4" />
          </span>
        </Button>
      </div>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent side="right" className="p-0">
          <DialogPrimitive.Title className="sr-only">Cart</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Current sale</DialogPrimitive.Description>
          <div className="flex min-h-0 flex-1 flex-col">{cartPanel}</div>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        items={saleItems}
        totals={totals}
        customer={customer}
        onCompleted={() => {
          usePosStore.getState().clearCart();
        }}
      />

      <CustomerFormDialog
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onSaved={(id) => {
          setCustomer(id);
          toast.success("Customer selected for this sale");
        }}
      />
    </div>
  );
}

const ProductCard = React.memo(function ProductCard({
  medicine: m,
  qtyInCart,
  onAdd,
}: {
  medicine: Medicine;
  qtyInCart: number;
  onAdd: () => void;
}) {
  const status = stockStatus(m);
  const outOfStock = m.stock === 0;
  const expired = status === "Expired";
  const low = status === "Low Stock";
  const disabled = outOfStock || expired || qtyInCart >= m.stock;

  return (
    <Card className={cn("group relative flex flex-col gap-3 p-3.5 transition-colors hover:border-primary/40", (outOfStock || expired) && "opacity-70")}>
      {qtyInCart > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
          {qtyInCart}
        </span>
      )}
      <div className="flex items-start gap-3">
        <MedicineThumb name={m.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{m.name}</p>
          <p className="truncate text-xs text-muted">{m.genericName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            <span>{m.strength}</span>
            <span className="text-border">•</span>
            <span>{m.dosageForm}</span>
            {m.prescriptionRequired && <Badge tone="primary" className="px-1.5 py-0 text-[10px]">Rx</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold tabular-nums">{formatPKR(m.sellingPrice)}</p>
          <p className={cn("mt-0.5 flex items-center gap-1 text-xs", outOfStock || expired ? "text-danger" : low ? "text-warning" : "text-muted")}>
            {(low || expired || outOfStock) && <AlertTriangle className="size-3" />}
            {expired ? "Expired" : outOfStock ? "Out of stock" : `${m.stock} in stock`}
            {low && <span className="hidden text-[10px] sm:inline">· low</span>}
          </p>
        </div>
        <Button size="sm" onClick={onAdd} disabled={disabled} aria-label={`Add ${m.name} to cart`} className="shrink-0">
          <Plus /> Add
        </Button>
      </div>
    </Card>
  );
});
