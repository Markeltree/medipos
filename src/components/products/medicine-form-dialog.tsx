"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/primitives";
import { dosageForms, medicineSchema, type MedicineInput } from "@/lib/validators";
import { useDataStore } from "@/store/data-store";
import type { Medicine } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  medicine?: Medicine | null;
}

const blank: MedicineInput = {
  name: "",
  genericName: "",
  brand: "",
  sku: "",
  barcode: "",
  categoryId: "",
  dosageForm: "Tablet",
  strength: "",
  manufacturer: "",
  batchNumber: "",
  purchasePrice: 0,
  sellingPrice: 0,
  stock: 0,
  minStock: 10,
  expiryDate: "",
  prescriptionRequired: false,
  description: "",
  supplierId: "",
};

function randomDigits(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

export function MedicineFormDialog({ open, onOpenChange, medicine }: Props) {
  const categories = useDataStore((s) => s.categories);
  const suppliers = useDataStore((s) => s.suppliers);
  const addMedicine = useDataStore((s) => s.addMedicine);
  const updateMedicine = useDataStore((s) => s.updateMedicine);
  const editing = Boolean(medicine);

  const form = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: blank,
    mode: "onTouched",
  });
  const errors = form.formState.errors;

  React.useEffect(() => {
    if (!open) return;
    if (medicine) {
      // Spread keeps only form fields in use; id and image are not part of the form.
      form.reset({ ...medicine, brand: medicine.brand ?? "", description: medicine.description ?? "" });
    } else {
      form.reset({
        ...blank,
        categoryId: categories[0]?.id ?? "",
        supplierId: suppliers.find((s) => s.status === "Active")?.id ?? "",
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
        batchNumber: `B${randomDigits(5)}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, medicine]);

  const onSubmit = (values: MedicineInput) => {
    if (editing && medicine) {
      updateMedicine(medicine.id, values);
      toast.success(`${values.name} updated`);
    } else {
      addMedicine(values);
      toast.success(`${values.name} ${values.strength} added to catalogue`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader
          title={editing ? "Edit medicine" : "Add medicine"}
          description="Catalogue details, pricing and the first batch on the shelf."
        />
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Medicine name" error={errors.name?.message}>
              <Input aria-invalid={!!errors.name} placeholder="e.g. Panadol Extra" {...form.register("name")} />
            </Field>
            <Field label="Generic name" error={errors.genericName?.message}>
              <Input aria-invalid={!!errors.genericName} placeholder="e.g. Paracetamol + Caffeine" {...form.register("genericName")} />
            </Field>
            <Field label="Brand name" error={errors.brand?.message} hint="Optional">
              <Input aria-invalid={!!errors.brand} {...form.register("brand")} />
            </Field>

            <Field label="SKU" error={errors.sku?.message}>
              <div className="flex gap-1.5">
                <Input aria-invalid={!!errors.sku} className="font-mono text-[13px]" {...form.register("sku")} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generate SKU"
                  onClick={() => form.setValue("sku", `PHM-${randomDigits(4)}`, { shouldValidate: true })}
                >
                  <RefreshCw />
                </Button>
              </div>
            </Field>
            <Field label="Barcode" error={errors.barcode?.message}>
              <div className="flex gap-1.5">
                <Input aria-invalid={!!errors.barcode} inputMode="numeric" className="font-mono text-[13px]" {...form.register("barcode")} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Generate barcode"
                  onClick={() => form.setValue("barcode", `622${randomDigits(10)}`, { shouldValidate: true })}
                >
                  <RefreshCw />
                </Button>
              </div>
            </Field>
            <Field label="Category" error={errors.categoryId?.message}>
              <Select aria-invalid={!!errors.categoryId} {...form.register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Dosage form" error={errors.dosageForm?.message}>
              <Select aria-invalid={!!errors.dosageForm} {...form.register("dosageForm")}>
                {dosageForms.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Strength" error={errors.strength?.message} hint="e.g. 500mg, 100IU/ml">
              <Input aria-invalid={!!errors.strength} {...form.register("strength")} />
            </Field>
            <Field label="Manufacturer" error={errors.manufacturer?.message}>
              <Input aria-invalid={!!errors.manufacturer} {...form.register("manufacturer")} />
            </Field>

            <Field label="Supplier" error={errors.supplierId?.message}>
              <Select aria-invalid={!!errors.supplierId} {...form.register("supplierId")}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Batch number" error={errors.batchNumber?.message}>
              <Input aria-invalid={!!errors.batchNumber} className="font-mono text-[13px]" {...form.register("batchNumber")} />
            </Field>
            <Field label="Expiry date" error={errors.expiryDate?.message}>
              <Input type="date" aria-invalid={!!errors.expiryDate} {...form.register("expiryDate")} />
            </Field>

            <Field label="Purchase price (Rs)" error={errors.purchasePrice?.message}>
              <Input type="number" step="1" min={0} aria-invalid={!!errors.purchasePrice} {...form.register("purchasePrice", { valueAsNumber: true })} />
            </Field>
            <Field label="Selling price (Rs)" error={errors.sellingPrice?.message}>
              <Input type="number" step="1" min={0} aria-invalid={!!errors.sellingPrice} {...form.register("sellingPrice", { valueAsNumber: true })} />
            </Field>
            <Field label="Stock quantity" error={errors.stock?.message}>
              <Input type="number" step="1" min={0} aria-invalid={!!errors.stock} {...form.register("stock", { valueAsNumber: true })} />
            </Field>

            <Field label="Minimum stock level" error={errors.minStock?.message} hint="Triggers low-stock alerts">
              <Input type="number" step="1" min={0} aria-invalid={!!errors.minStock} {...form.register("minStock", { valueAsNumber: true })} />
            </Field>
            <Field label="Description" error={errors.description?.message} className="sm:col-span-2 lg:col-span-2">
              <Textarea rows={2} aria-invalid={!!errors.description} placeholder="Storage conditions, notes for counter staff" {...form.register("description")} />
            </Field>
            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3 sm:col-span-2 lg:col-span-1">
              <div>
                <p className="text-[13px] font-medium">Prescription required</p>
                <p className="text-xs text-muted">Sale is blocked until a prescription is verified.</p>
              </div>
              <Controller
                control={form.control}
                name="prescriptionRequired"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Prescription required" />}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editing ? "Save changes" : "Add medicine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
