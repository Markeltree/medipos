"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ClipboardCheck, FileText, PackageCheck, ShieldX, Pill } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Textarea, Badge } from "@/components/ui/primitives";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { PageHeader, StatCard } from "@/components/shared/misc";
import { DataTable } from "@/components/shared/data-table";
import { PrescriptionBadge } from "@/components/shared/status-badge";
import { useDataStore } from "@/store/data-store";
import { formatDate, formatNumber, cn } from "@/lib/utils";
import type { Prescription, PrescriptionStatus } from "@/types";

const CHECKS = [
  "Prescription is legible and complete",
  "Prescriber name and contact are recorded",
  "Patient name matches the prescription",
  "Quantities match the prescribed dosage on the form",
  "Medicine availability has been confirmed",
] as const;

export function PrescriptionsView() {
  const prescriptions = useDataStore((s) => s.prescriptions);
  const [viewing, setViewing] = React.useState<Prescription | null>(null);
  const [status, setStatus] = React.useState<"all" | PrescriptionStatus>("all");

  const counts = (st: PrescriptionStatus) => prescriptions.filter((p) => p.status === st).length;
  const filtered = prescriptions.filter((p) => status === "all" || p.status === status);

  const columns = React.useMemo<ColumnDef<Prescription, unknown>[]>(
    () => [
      { accessorKey: "id", header: "Prescription", cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{String(getValue())}</span> },
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.patientName}</p>
            <p className="font-mono text-xs text-muted">{row.original.patientPhone}</p>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Prescriber",
        cell: ({ row }) => (
          <div>
            <p className="text-[13px]">{row.original.doctorName}</p>
            <p className="font-mono text-xs text-muted">{row.original.doctorContact}</p>
          </div>
        ),
      },
      { accessorKey: "date", header: "Date", cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDate(String(getValue()))}</span> },
      { id: "count", accessorFn: (p) => p.medicines.length, header: "Items", cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <PrescriptionBadge status={getValue() as PrescriptionStatus} /> },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Prescriptions" description="Verify prescriptions before dispensing restricted medicines" />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Pending" value={formatNumber(counts("Pending"))} icon={<FileText className="size-4" />} tone="warning" />
        <StatCard label="Verified" value={formatNumber(counts("Verified"))} icon={<ClipboardCheck className="size-4" />} tone="primary" />
        <StatCard label="Dispensed" value={formatNumber(counts("Dispensed"))} icon={<PackageCheck className="size-4" />} tone="success" />
        <StatCard label="Rejected" value={formatNumber(counts("Rejected"))} icon={<ShieldX className="size-4" />} tone="danger" />
      </section>

      <Card className="overflow-hidden">
        <DataTable<Prescription>
          data={filtered}
          columns={columns}
          searchPlaceholder="Search patient, prescriber or ID…"
          onRowClick={(p) => setViewing(p)}
          emptyTitle="No prescriptions in this status"
          toolbar={
            <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-1">
              {(["all", "Pending", "Verified", "Dispensed", "Rejected"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "h-8 cursor-pointer rounded-md px-2.5 text-[13px] font-medium",
                    status === s ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground",
                  )}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          }
        />
      </Card>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent side="right">
          {viewing && <PrescriptionDetail prescriptionId={viewing.id} onClose={() => setViewing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrescriptionDetail({ prescriptionId, onClose }: { prescriptionId: string; onClose: () => void }) {
  const rx = useDataStore((s) => s.prescriptions.find((p) => p.id === prescriptionId));
  const medicines = useDataStore((s) => s.medicines);
  const updateStatus = useDataStore((s) => s.updatePrescriptionStatus);
  // Mounted fresh each time the drawer opens, so checklist and notes start clean.
  const [checks, setChecks] = React.useState<boolean[]>(() => CHECKS.map(() => false));
  const [notes, setNotes] = React.useState(() => rx?.notes ?? "");

  if (!rx) return null;
  const lines = rx.medicines.map((l) => ({ ...l, med: medicines.find((m) => m.id === l.medicineId) }));
  const stockOk = lines.every((l) => l.med && l.med.stock >= l.quantity);
  const allChecked = checks.every(Boolean);

  return (
    <>
      <DialogHeader title={rx.id} description={`${rx.patientName} · ${formatDate(rx.date)}`} />
      <DialogBody className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <PrescriptionBadge status={rx.status} />
          {rx.status === "Pending" && <Badge tone="neutral">Awaiting verification</Badge>}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Patient" value={rx.patientName} sub={rx.patientPhone} />
          <Info label="Prescriber" value={rx.doctorName} sub={rx.doctorContact} />
        </dl>

        <div>
          <p className="mb-2 text-sm font-semibold">Prescribed medicines</p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {lines.map((l) => (
              <li key={l.medicineId} className="flex items-start gap-3 px-3 py-2.5 text-[13px]">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Pill className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.med?.name ?? "Unknown medicine"} <span className="font-normal text-muted">{l.med?.strength}</span></p>
                  <p className="text-xs text-muted">{l.dosageNote}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">Qty {l.quantity}</p>
                  <p className={cn("text-xs", l.med && l.med.stock >= l.quantity ? "text-success" : "text-danger")}>
                    {l.med ? `${l.med.stock} in stock` : "Not in catalogue"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {!stockOk && rx.status !== "Dispensed" && (
            <p className="mt-2 text-xs text-danger">Stock is short for at least one line. Restock or contact the prescriber before dispensing.</p>
          )}
        </div>

        {rx.status === "Pending" && (
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold">Verification checklist</p>
            <ul className="flex flex-col gap-2">
              {CHECKS.map((c, i) => (
                <li key={c}>
                  <label className="flex cursor-pointer items-start gap-2.5 text-[13px]">
                    <input
                      type="checkbox"
                      checked={checks[i]}
                      onChange={(e) => setChecks((arr) => arr.map((v, j) => (j === i ? e.target.checked : v)))}
                      className="mt-0.5 size-4 cursor-pointer accent-primary"
                    />
                    <span>{c}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div>
          <label htmlFor="rx-notes" className="mb-1.5 block text-[13px] font-medium">Verification notes</label>
          <Textarea id="rx-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Record what was checked or why it was rejected" disabled={rx.status === "Dispensed"} />
        </div>
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {rx.status === "Pending" && (
            <>
              <Button
                disabled={!allChecked}
                onClick={() => {
                  updateStatus(rx.id, "Verified", notes);
                  toast.success("Prescription verified");
                }}
              >
                <CheckCircle2 /> Verify
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!notes.trim()) {
                    toast.error("Add a reason in the notes before rejecting");
                    return;
                  }
                  updateStatus(rx.id, "Rejected", notes);
                  toast.success("Prescription rejected");
                }}
              >
                <ShieldX /> Reject
              </Button>
            </>
          )}
          {rx.status === "Verified" && (
            <Button
              disabled={!stockOk}
              onClick={() => {
                updateStatus(rx.id, "Dispensed", notes);
                toast.success("Medicines dispensed and stock updated");
              }}
            >
              <PackageCheck /> Mark dispensed
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
      <dd className="font-mono text-xs text-muted">{sub}</dd>
    </div>
  );
}
