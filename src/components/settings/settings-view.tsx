"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard, Bell, Store, Palette, Receipt, Percent, SlidersHorizontal, Save, RotateCcw, Moon, Sun, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Field, Input, Select, Switch, Textarea, Label } from "@/components/ui/primitives";
import { PageHeader } from "@/components/shared/misc";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { profileSchema, type ProfileInput } from "@/lib/validators";
import { useDataStore } from "@/store/data-store";
import { useUiStore } from "@/store/ui-store";
import type { PaymentMethod, StoreProfile } from "@/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "pharmacy", label: "Pharmacy information", icon: Building2 },
  { id: "store", label: "Store details", icon: Store },
  { id: "invoice", label: "Invoice settings", icon: Receipt },
  { id: "tax", label: "Tax settings", icon: Percent },
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "notifications", label: "Notification preferences", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

type TabId = (typeof TABS)[number]["id"];

const METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "JazzCash", "EasyPaisa"];

export function SettingsView() {
  const [tab, setTab] = React.useState<TabId>("general");
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" description="Store profile, billing, tax and preferences" />
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
                  tab === t.id ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <Card className="min-w-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">{current.label}</h2>
          </div>
          <div className="p-5">
            {tab === "general" && <GeneralSection />}
            {tab === "pharmacy" && <PharmacySection />}
            {tab === "store" && <StoreSection />}
            {tab === "invoice" && <InvoiceSection />}
            {tab === "tax" && <TaxSection />}
            {tab === "payments" && <PaymentsSection />}
            {tab === "notifications" && <NotificationsSection />}
            {tab === "appearance" && <AppearanceSection />}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- shared section helpers ---------- */

/** Each settings tab edits a subset of the profile, validated by the matching slice of profileSchema. */
function useProfileForm(keys: (keyof ProfileInput)[]) {
  const profile = useDataStore((s) => s.profile);
  const updateProfile = useDataStore((s) => s.updateProfile);
  const keyList = keys.join("|");
  const schema = React.useMemo(() => {
    const shape: Partial<Record<keyof ProfileInput, true>> = {};
    keys.forEach((k) => {
      shape[k] = true;
    });
    return profileSchema.pick(shape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyList]);

  // Every section shares one form shape; only the keys it owns are validated and saved.
  const defaults = {} as ProfileInput;
  keys.forEach((k) => {
    Object.assign(defaults, { [k]: profile[k as keyof StoreProfile] });
  });
  const form = useForm<ProfileInput>({
    resolver: zodResolver(schema) as unknown as Resolver<ProfileInput>,
    defaultValues: defaults,
  });
  const save = (values: ProfileInput) => {
    const patch: Partial<ProfileInput> = {};
    keys.forEach((k) => {
      Object.assign(patch, { [k]: values[k] });
    });
    updateProfile(patch as Partial<StoreProfile>);
    toast.success("Settings saved");
    form.reset(values);
  };
  return { form, save, errors: form.formState.errors };
}

function SectionActions({ dirty, onReset }: { dirty: boolean; onReset: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
      {dirty && <span className="mr-auto text-xs text-warning">Unsaved changes</span>}
      <Button type="button" variant="outline" onClick={onReset} disabled={!dirty}>
        Discard
      </Button>
      <Button type="submit" disabled={!dirty}>
        <Save /> Save changes
      </Button>
    </div>
  );
}

/* ---------- sections ---------- */

function GeneralSection() {
  const { form, save, errors } = useProfileForm(["pharmacyName", "city"]);
  const timezone = useDataStore((s) => s.profile.timezone);
  const { formState } = form;
  return (
    <form onSubmit={form.handleSubmit(save)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pharmacy name" error={errors.pharmacyName?.message} hint="Shown on receipts and the sidebar">
          <Input aria-invalid={!!errors.pharmacyName} {...form.register("pharmacyName")} />
        </Field>
        <Field label="City" error={errors.city?.message}>
          <Input aria-invalid={!!errors.city} {...form.register("city")} />
        </Field>
        <Field label="Currency" hint="Prices are fixed to Pakistani rupees for this build">
          <Select disabled defaultValue="PKR"><option value="PKR">PKR — Pakistani Rupee</option></Select>
        </Field>
        <Field label="Time zone">
          <Select defaultValue={timezone} disabled>
            <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
          </Select>
        </Field>
      </div>
      <SectionActions dirty={formState.isDirty} onReset={() => form.reset()} />
    </form>
  );
}

function PharmacySection() {
  const { form, save, errors } = useProfileForm(["legalName", "licenseNumber", "ntn"]);
  return (
    <form onSubmit={form.handleSubmit(save)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Legal name" error={errors.legalName?.message} className="sm:col-span-2">
          <Input aria-invalid={!!errors.legalName} {...form.register("legalName")} />
        </Field>
        <Field label="DRAP licence number" error={errors.licenseNumber?.message}>
          <Input aria-invalid={!!errors.licenseNumber} className="font-mono text-[13px]" {...form.register("licenseNumber")} />
        </Field>
        <Field label="NTN" error={errors.ntn?.message} hint="Format 1234567-8">
          <Input aria-invalid={!!errors.ntn} className="font-mono text-[13px]" {...form.register("ntn")} />
        </Field>
      </div>
      <SectionActions dirty={form.formState.isDirty} onReset={() => form.reset()} />
    </form>
  );
}

function StoreSection() {
  const { form, save, errors } = useProfileForm(["phone", "email", "address"]);
  return (
    <form onSubmit={form.handleSubmit(save)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" error={errors.phone?.message}>
          <Input inputMode="tel" aria-invalid={!!errors.phone} {...form.register("phone")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </Field>
        <Field label="Store address" error={errors.address?.message} className="sm:col-span-2">
          <Textarea rows={2} aria-invalid={!!errors.address} {...form.register("address")} />
        </Field>
      </div>
      <SectionActions dirty={form.formState.isDirty} onReset={() => form.reset()} />
    </form>
  );
}

function InvoiceSection() {
  const { form, save, errors } = useProfileForm(["invoicePrefix", "invoiceFooter"]);
  const width = useDataStore((s) => s.profile.receiptPaperWidth);
  const updateProfile = useDataStore((s) => s.updateProfile);
  return (
    <form onSubmit={form.handleSubmit(save)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice prefix" error={errors.invoicePrefix?.message} hint="Letters only, e.g. MP">
          <Input aria-invalid={!!errors.invoicePrefix} className="uppercase" {...form.register("invoicePrefix")} />
        </Field>
        <Field label="Receipt paper width">
          <Select value={width} onChange={(e) => { updateProfile({ receiptPaperWidth: e.target.value as "58mm" | "80mm" }); toast.success("Receipt width saved"); }}>
            <option value="80mm">80 mm (standard)</option>
            <option value="58mm">58 mm (compact)</option>
          </Select>
        </Field>
        <Field label="Receipt footer" error={errors.invoiceFooter?.message} className="sm:col-span-2">
          <Textarea rows={2} aria-invalid={!!errors.invoiceFooter} {...form.register("invoiceFooter")} />
        </Field>
      </div>
      <SectionActions dirty={form.formState.isDirty} onReset={() => form.reset()} />
    </form>
  );
}

function TaxSection() {
  const { form, save, errors } = useProfileForm(["taxRate"]);
  const inclusive = useDataStore((s) => s.profile.taxInclusive);
  const updateProfile = useDataStore((s) => s.updateProfile);
  return (
    <form onSubmit={form.handleSubmit(save)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sales tax rate (%)" error={errors.taxRate?.message} hint="Standard GST for retail medicines is applied by default">
          <Input type="number" step="0.5" min={0} max={100} aria-invalid={!!errors.taxRate} {...form.register("taxRate", { valueAsNumber: true })} />
        </Field>
        <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
          <div>
            <Label>Prices include tax</Label>
            <p className="mt-0.5 text-xs text-muted">When off, tax is added on top of the shelf price.</p>
          </div>
          <Switch
            label="Prices include tax"
            checked={inclusive}
            onCheckedChange={(v) => {
              updateProfile({ taxInclusive: v });
              toast.success(v ? "Tax is now included in prices" : "Tax is now added at checkout");
            }}
          />
        </div>
      </div>
      <SectionActions dirty={form.formState.isDirty} onReset={() => form.reset()} />
    </form>
  );
}

function PaymentsSection() {
  const enabled = useDataStore((s) => s.profile.paymentsEnabled);
  const updateProfile = useDataStore((s) => s.updateProfile);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-muted">Methods switched off here will not appear at checkout.</p>
      {METHODS.map((m) => (
        <div key={m} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div>
            <p className="text-[13px] font-medium">{m}</p>
            <p className="text-xs text-muted">{m === "Cash" ? "Change is calculated automatically" : m.includes("Cash") || m === "JazzCash" || m === "EasyPaisa" ? "Mobile wallet, reference number recorded" : "Card terminal or bank transfer reference"}</p>
          </div>
          <Switch
            label={`Enable ${m}`}
            checked={enabled[m]}
            onCheckedChange={(v) => {
              updateProfile({ paymentsEnabled: { ...enabled, [m]: v } });
              toast.success(`${m} ${v ? "enabled" : "disabled"}`);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function NotificationsSection() {
  const profile = useDataStore((s) => s.profile);
  const updateProfile = useDataStore((s) => s.updateProfile);
  const items: { key: "lowStockAlerts" | "expiryAlerts" | "dailySummaryEmail"; label: string; hint: string }[] = [
    { key: "lowStockAlerts", label: "Low stock alerts", hint: "Notify when a medicine reaches its minimum level" },
    { key: "expiryAlerts", label: "Expiry alerts", hint: "Notify 30, 60 and 90 days before expiry" },
    { key: "dailySummaryEmail", label: "Daily summary email", hint: "End-of-day sales summary to the store email" },
  ];
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.key} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div>
            <p className="text-[13px] font-medium">{it.label}</p>
            <p className="text-xs text-muted">{it.hint}</p>
          </div>
          <Switch
            label={it.label}
            checked={profile[it.key]}
            onCheckedChange={(v) => {
              updateProfile({ [it.key]: v });
              toast.success("Preference saved");
            }}
          />
        </div>
      ))}
    </div>
  );
}

function AppearanceSection() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const resetDemoData = useDataStore((s) => s.resetDemoData);
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[13px] font-medium">Theme</p>
        <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-2 gap-2">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              onClick={() => setTheme(t.id as "light" | "dark")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-3 text-[13px] font-medium",
                theme === t.id ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-foreground",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium"><PanelLeft className="size-4" /> Collapse sidebar by default</p>
          <p className="text-xs text-muted">Keeps more room for the POS grid on smaller screens.</p>
        </div>
        <Switch label="Collapse sidebar" checked={collapsed} onCheckedChange={setCollapsed} />
      </div>

      <div className="rounded-md border border-danger/30 bg-danger-soft/40 p-4">
        <p className="text-[13px] font-medium text-danger">Reset demo data</p>
        <p className="mt-1 text-xs text-muted">
          Restores the sample medicines, customers, sales and purchases, and clears anything you added. Your cart and held orders are kept.
        </p>
        <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
          <RotateCcw /> Reset demo data
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all demo data?"
        description="Every medicine, customer, sale, purchase and staff record will return to the sample set. This cannot be undone."
        confirmLabel="Reset data"
        onConfirm={() => {
          resetDemoData();
          toast.success("Demo data restored");
        }}
      />
    </div>
  );
}
