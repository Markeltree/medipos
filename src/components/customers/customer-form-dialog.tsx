"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { customerSchema, type CustomerInput } from "@/lib/validators";
import { useDataStore } from "@/store/data-store";
import type { Customer } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer?: Customer | null;
  /** Called with the new or updated customer id, e.g. to select it in the POS. */
  onSaved?: (id: string) => void;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSaved }: Props) {
  const addCustomer = useDataStore((s) => s.addCustomer);
  const updateCustomer = useDataStore((s) => s.updateCustomer);
  const editing = Boolean(customer);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", address: "", dateOfBirth: "" },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
        address: customer?.address ?? "",
        dateOfBirth: customer?.dateOfBirth ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  const onSubmit = (values: CustomerInput) => {
    if (editing && customer) {
      updateCustomer(customer.id, values);
      toast.success(`${values.name} updated`);
      onSaved?.(customer.id);
    } else {
      const id = addCustomer(values);
      toast.success(`Customer ${values.name} added`);
      onSaved?.(id);
    }
    onOpenChange(false);
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader title={editing ? "Edit customer" : "Add customer"} description="Used for receipts, loyalty points and purchase history." />
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name?.message} className="sm:col-span-2">
              <Input aria-invalid={!!errors.name} placeholder="e.g. Ayesha Siddiqui" {...form.register("name")} />
            </Field>
            <Field label="Phone number" error={errors.phone?.message}>
              <Input aria-invalid={!!errors.phone} placeholder="0300-1234567" inputMode="tel" {...form.register("phone")} />
            </Field>
            <Field label="Email" error={errors.email?.message} hint="Optional">
              <Input aria-invalid={!!errors.email} type="email" placeholder="name@example.com" {...form.register("email")} />
            </Field>
            <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
              <Textarea aria-invalid={!!errors.address} rows={2} placeholder="House, street, area, city" {...form.register("address")} />
            </Field>
            <Field label="Date of birth" error={errors.dateOfBirth?.message} hint="Optional">
              <Input type="date" aria-invalid={!!errors.dateOfBirth} {...form.register("dateOfBirth")} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editing ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
