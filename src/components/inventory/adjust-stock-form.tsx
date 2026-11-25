"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { adjustmentSchema, type AdjustmentInput } from "@/lib/validators";
import { useDataStore } from "@/store/data-store";
import type { Medicine } from "@/types";

/** Stock in / out / correction for one medicine. Writes an audit movement. */
export function AdjustStockForm({ medicine, onDone }: { medicine: Medicine; onDone?: () => void }) {
  const adjustStock = useDataStore((s) => s.adjustStock);
  const form = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { type: "Stock In", quantity: 1, reason: "" },
  });
  const errors = form.formState.errors;
  const type = form.watch("type");

  const submit = (v: AdjustmentInput) => {
    const magnitude = Math.abs(v.quantity);
    let delta: number;
    if (v.type === "Stock In") delta = magnitude;
    else if (v.type === "Stock Out") delta = -magnitude;
    else delta = v.quantity; // corrections keep their sign

    if (medicine.stock + delta < 0) {
      toast.error(`Stock cannot go below zero. ${medicine.name} has ${medicine.stock} on hand.`);
      return;
    }
    adjustStock(medicine.id, delta, v.type, v.reason);
    toast.success(`${v.type} recorded for ${medicine.name}`);
    form.reset({ type: v.type, quantity: 1, reason: "" });
    onDone?.();
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="grid gap-3 sm:grid-cols-2">
      <Field label="Movement type" error={errors.type?.message}>
        <Select {...form.register("type")}>
          <option value="Stock In">Stock in</option>
          <option value="Stock Out">Stock out</option>
          <option value="Adjustment">Adjustment (±)</option>
        </Select>
      </Field>
      <Field
        label={type === "Adjustment" ? "Quantity (use − to reduce)" : "Quantity"}
        error={errors.quantity?.message}
      >
        <Input type="number" step="1" aria-invalid={!!errors.quantity} {...form.register("quantity", { valueAsNumber: true })} />
      </Field>
      <Field label="Reason" error={errors.reason?.message} className="sm:col-span-2">
        <Textarea rows={2} aria-invalid={!!errors.reason} placeholder="e.g. Damaged bottle, counted shelf, returned by customer" {...form.register("reason")} />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
          Record movement
        </Button>
      </div>
    </form>
  );
}
