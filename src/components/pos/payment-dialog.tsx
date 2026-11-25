"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Building2, CheckCircle2, CreditCard, Printer, Smartphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, Field, Input } from "@/components/ui/primitives";
import { Receipt } from "@/components/sales/receipt";
import { paymentSchema } from "@/lib/validators";
import { cn, formatPKR, type CartTotals } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import type { PaymentMethod, Sale, SaleItem } from "@/types";

const METHODS: { value: PaymentMethod; icon: React.ReactNode; hint: string }[] = [
  { value: "Cash", icon: <Banknote className="size-4" />, hint: "Physical notes" },
  { value: "Card", icon: <CreditCard className="size-4" />, hint: "Debit / credit" },
  { value: "Bank Transfer", icon: <Building2 className="size-4" />, hint: "IBFT / cheque" },
  { value: "JazzCash", icon: <Smartphone className="size-4" />, hint: "Mobile wallet" },
  { value: "EasyPaisa", icon: <Smartphone className="size-4" />, hint: "Mobile wallet" },
];

interface PaymentFormValues {
  method: PaymentMethod;
  amountReceived: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: SaleItem[];
  totals: CartTotals;
  customer: { id: string; name: string } | null;
  onCompleted: () => void;
}

export function PaymentDialog({ open, onOpenChange, items, totals, customer, onCompleted }: Props) {
  const addSale = useDataStore((s) => s.addSale);
  const profile = useDataStore((s) => s.profile);
  const medicines = useDataStore((s) => s.medicines);
  const [receipt, setReceipt] = React.useState<Sale | null>(null);

  // The schema depends on the total; read it through a ref so the resolver is always current.
  const totalRef = React.useRef(totals.total);
  totalRef.current = totals.total;

  const form = useForm<PaymentFormValues>({
    resolver: (values, ctx, opts) => zodResolver(paymentSchema(totalRef.current))(values, ctx, opts),
    defaultValues: { method: "Cash", amountReceived: totals.total },
  });

  const method = form.watch("method");
  const received = form.watch("amountReceived") || 0;
  const isCash = method === "Cash";
  const change = Math.max(0, received - totals.total);
  const balanceDue = Math.max(0, totals.total - received);

  React.useEffect(() => {
    if (open) {
      setReceipt(null);
      form.reset({ method: "Cash", amountReceived: Math.ceil(totals.total / 100) * 100 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chooseMethod = (m: PaymentMethod) => {
    form.setValue("method", m, { shouldValidate: false });
    form.setValue("amountReceived", m === "Cash" ? Math.ceil(totals.total / 100) * 100 : totals.total, { shouldValidate: true });
  };

  const onSubmit = (values: PaymentFormValues) => {
    // Stock must still cover the cart: other tills may have sold stock meanwhile.
    const short = items.find((i) => {
      const med = medicines.find((m) => m.id === i.medicineId);
      return !med || med.stock < i.quantity;
    });
    if (short) {
      toast.error(`Not enough stock for ${short.name}. Reduce the quantity and try again.`);
      return;
    }
    const id = addSale({
      date: new Date().toISOString(),
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? "Walk-in Customer",
      items,
      subtotal: totals.subtotal,
      discount: totals.lineDiscount + totals.orderDiscount,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: values.method,
      amountReceived: values.method === "Cash" ? values.amountReceived : totals.total,
      change: values.method === "Cash" ? Math.max(0, values.amountReceived - totals.total) : 0,
      cashier: "Shahid Mehmood",
      paymentStatus: "Paid",
    });
    const saved = useDataStore.getState().sales.find((s) => s.id === id);
    if (saved) setReceipt(saved);
    toast.success(`Payment confirmed · ${id}`);
  };

  const errors = form.formState.errors;
  const enabled = METHODS.filter((m) => profile.paymentsEnabled[m.value]);

  return (
    <Dialog open={open} onOpenChange={(v) => !receipt && onOpenChange(v)}>
      <DialogContent size="lg">
        {!receipt ? (
          <>
            <DialogHeader title="Checkout" description={`${totals.itemCount} items${customer ? ` · ${customer.name}` : " · Walk-in customer"}`} />
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
              <DialogBody className="grid gap-5 md:grid-cols-[1fr_1fr]">
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border border-border bg-surface-muted/60 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Total payable</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{formatPKR(totals.total)}</p>
                    <p className="mt-1 text-xs text-muted">
                      Includes tax {formatPKR(totals.tax)} at {profile.taxRate}% {profile.taxInclusive ? "inclusive" : "exclusive"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-[13px] font-medium">Payment method</p>
                    <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2">
                      {enabled.map((m) => {
                        const selected = method === m.value;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => chooseMethod(m.value)}
                            className={cn(
                              "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
                              selected ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-muted",
                              m.value === "EasyPaisa" && "col-span-2 sm:col-span-1",
                            )}
                          >
                            {m.icon}
                            <span className="min-w-0">
                              <span className="block text-[13px] font-medium">{m.value}</span>
                              <span className="block text-[11px] text-muted">{m.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Field label="Amount received" error={errors.amountReceived?.message}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min={0}
                      disabled={!isCash}
                      aria-invalid={!!errors.amountReceived}
                      className="h-11 text-base tabular-nums"
                      {...form.register("amountReceived", { valueAsNumber: true })}
                    />
                  </Field>

                  {isCash && (
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Exact", value: totals.total },
                        { label: "Rs 500", value: 500 },
                        { label: "Rs 1,000", value: 1000 },
                        { label: "Rs 5,000", value: 5000 },
                      ].map((q) => (
                        <Button key={q.label} type="button" size="sm" variant="outline" onClick={() => form.setValue("amountReceived", q.value, { shouldValidate: true })}>
                          {q.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
                    <Row label="Total payable" value={formatPKR(totals.total)} />
                    <Row label="Amount received" value={formatPKR(isCash ? received : totals.total)} />
                    <div className="my-1 h-px bg-border" />
                    {balanceDue > 0 ? (
                      <Row label="Balance due" value={formatPKR(balanceDue)} tone="danger" />
                    ) : (
                      <Row label="Change to return" value={formatPKR(isCash ? change : 0)} tone="success" strong />
                    )}
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Back to cart
                </Button>
                <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                  <CheckCircle2 /> Confirm payment
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader title="Sale completed" description="Receipt generated. You can print it or start a new sale." />
            <DialogBody className="grid gap-5 md:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-soft p-4">
                  <CheckCircle2 className="size-8 shrink-0 text-success" />
                  <div>
                    <p className="font-semibold">Payment received</p>
                    <p className="text-sm text-muted">
                      Transaction <span className="font-mono text-foreground">{receipt.id}</span>
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Summary label="Amount" value={formatPKR(receipt.total)} />
                  <Summary label="Method" value={receipt.paymentMethod} />
                  <Summary label="Received" value={formatPKR(receipt.amountReceived)} />
                  <Summary label="Change" value={formatPKR(receipt.change)} />
                  <Summary label="Customer" value={receipt.customerName} />
                  <Summary label="Items" value={`${receipt.items.reduce((s, i) => s + i.quantity, 0)}`} />
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Stock updated</Badge>
                  {customer && <Badge tone="accent">Loyalty points added</Badge>}
                </div>
              </div>
              <div className="thin-scroll max-h-[52vh] overflow-y-auto rounded-md border border-dashed border-border bg-surface-muted/40 p-2 md:w-[300px]">
                <Receipt sale={receipt} />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer /> Print receipt
              </Button>
              <Button
                onClick={() => {
                  onCompleted();
                  onOpenChange(false);
                }}
              >
                <Plus /> New sale
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, tone, strong }: { label: string; value: string; tone?: "danger" | "success"; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold", tone === "danger" && "text-danger", tone === "success" && "text-success")}>{value}</span>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}
