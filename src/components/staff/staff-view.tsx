"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Mail, MoreHorizontal, Pencil, Phone, Plus, Trash2, UserCog, Users, ShieldCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, Card, Field, Input, Select } from "@/components/ui/primitives";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, StatCard } from "@/components/shared/misc";
import { StaffStatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDataStore } from "@/store/data-store";
import { staffFormSchema, type StaffFormInput } from "@/lib/validators";
import { formatDate, formatNumber } from "@/lib/utils";
import type { StaffMember, StaffRole } from "@/types";

const ROLE_NOTES: Record<StaffRole, string> = {
  Admin: "Full access, including settings and staff.",
  Pharmacist: "Verifies and dispenses prescriptions, manages POS.",
  Cashier: "Runs the POS and processes payments.",
  "Inventory Manager": "Purchases, stock adjustments and expiry write-offs.",
};

export function StaffView() {
  const staff = useDataStore((s) => s.staff);
  const sales = useDataStore((s) => s.sales);
  const deleteStaff = useDataStore((s) => s.deleteStaff);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StaffMember | null>(null);
  const [viewing, setViewing] = React.useState<StaffMember | null>(null);
  const [toDelete, setToDelete] = React.useState<StaffMember | null>(null);

  const salesBy = React.useMemo(() => {
    const m = new Map<string, number>();
    sales.forEach((s) => m.set(s.cashier, (m.get(s.cashier) ?? 0) + 1));
    return m;
  }, [sales]);

  const columns = React.useMemo<ColumnDef<StaffMember, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Employee",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
              {row.original.name.replace(/^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => <span className="font-mono text-[13px]">{String(getValue())}</span> },
      { accessorKey: "role", header: "Role", cell: ({ getValue }) => <Badge tone="primary">{String(getValue())}</Badge> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StaffStatusBadge status={getValue() as StaffMember["status"]} /> },
      { accessorKey: "joiningDate", header: "Joined", cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDate(String(getValue()))}</span> },
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
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setToDelete(row.original)}>
                  <Trash2 /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  const active = staff.filter((s) => s.status === "Active").length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Staff management"
        description="Team members, roles and status"
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add staff member
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Team size" value={formatNumber(staff.length)} icon={<Users className="size-4" />} tone="primary" />
        <StatCard label="Active today" value={formatNumber(active)} icon={<UserCog className="size-4" />} tone="success" />
        <StatCard label="Pharmacists" value={formatNumber(staff.filter((s) => s.role === "Pharmacist").length)} icon={<ShieldCheck className="size-4" />} tone="accent" />
        <StatCard label="On leave" value={formatNumber(staff.filter((s) => s.status === "On Leave").length)} icon={<Users className="size-4" />} tone="warning" />
      </section>

      <Card className="overflow-hidden">
        <DataTable<StaffMember>
          data={staff}
          columns={columns}
          searchPlaceholder="Search name, email, role…"
          onRowClick={(s) => setViewing(s)}
          emptyTitle="No staff members yet"
          emptyAction={<Button size="sm" onClick={() => setFormOpen(true)}><Plus /> Add staff member</Button>}
        />
      </Card>

      <StaffFormDialog open={formOpen} onOpenChange={setFormOpen} member={editing} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent side="right">
          {viewing && (
            <>
              <DialogHeader title={viewing.name} description={viewing.role} />
              <DialogBody className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <StaffStatusBadge status={viewing.status} />
                  <Badge tone="primary">{viewing.role}</Badge>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <span className="inline-flex items-center gap-2"><Mail className="size-3.5 text-muted" />{viewing.email}</span>
                  <span className="inline-flex items-center gap-2"><Phone className="size-3.5 text-muted" />{viewing.phone}</span>
                  <span className="text-muted">Joined {formatDate(viewing.joiningDate)}</span>
                </div>
                <Card className="p-4">
                  <p className="text-sm font-semibold">Role access</p>
                  <p className="mt-1 text-[13px] text-muted">{ROLE_NOTES[viewing.role]}</p>
                  <p className="mt-3 text-xs text-muted">Front-end preview only. Access control is not enforced in this build.</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-semibold">Transactions processed</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{formatNumber(salesBy.get(viewing.name) ?? 0)}</p>
                  <p className="text-xs text-muted">Across the last 180 days</p>
                </Card>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                <Button onClick={() => { setEditing(viewing); setViewing(null); setFormOpen(true); }}>
                  <Pencil /> Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Remove staff member?"
        description={`${toDelete?.name ?? ""} will be removed from the roster. Their past transactions stay on record.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (toDelete) {
            deleteStaff(toDelete.id);
            toast.success("Staff member removed");
          }
        }}
      />
    </div>
  );
}

function StaffFormDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (v: boolean) => void; member: StaffMember | null }) {
  const addStaff = useDataStore((s) => s.addStaff);
  const updateStaff = useDataStore((s) => s.updateStaff);
  const blank: StaffFormInput = { name: "", email: "", phone: "", role: "Cashier", status: "Active", joiningDate: new Date().toISOString().slice(0, 10), password: "" };
  const form = useForm<StaffFormInput>({ resolver: zodResolver(staffFormSchema), defaultValues: blank });
  const errors = form.formState.errors;
  const role = form.watch("role");

  React.useEffect(() => {
    if (open) {
      form.reset(member ? { name: member.name, email: member.email, phone: member.phone, role: member.role, status: member.status, joiningDate: member.joiningDate, password: "" } : blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  const submit = (v: StaffFormInput) => {
    const { password, ...profile } = v;
    if (member) {
      // A blank password leaves the current one unchanged.
      void updateStaff(member.id, password ? { ...profile, password } : profile);
      toast.success("Staff profile updated");
    } else {
      if (!password) {
        form.setError("password", { message: "Set a password for the new account" });
        return;
      }
      void addStaff({ ...profile, password });
      toast.success(`${v.name} added to the team`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader title={member ? "Edit staff member" : "Add staff member"} description={ROLE_NOTES[role]} />
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name?.message} className="sm:col-span-2">
              <Input aria-invalid={!!errors.name} {...form.register("name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" aria-invalid={!!errors.email} {...form.register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input inputMode="tel" aria-invalid={!!errors.phone} {...form.register("phone")} />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <Select {...form.register("role")}>
                <option value="Admin">Admin</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Cashier">Cashier</option>
                <option value="Inventory Manager">Inventory Manager</option>
              </Select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select {...form.register("status")}>
                <option value="Active">Active</option>
                <option value="On Leave">On leave</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </Field>
            <Field label="Joining date" error={errors.joiningDate?.message}>
              <Input type="date" aria-invalid={!!errors.joiningDate} {...form.register("joiningDate")} />
            </Field>
            <Field
              label={member ? "New password" : "Password"}
              hint={member ? "Leave blank to keep the current password" : "At least 8 characters. Share it with the staff member."}
              error={errors.password?.message}
            >
              <Input type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{member ? "Save changes" : "Add staff member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
