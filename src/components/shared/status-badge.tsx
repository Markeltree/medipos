import { Badge } from "@/components/ui/primitives";
import type { BatchStatus, PaymentStatus, PrescriptionStatus, PurchaseStatus, SalePaymentStatus, StaffMember } from "@/types";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "orange" | "accent";

const stockTone: Record<BatchStatus, Tone> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "danger",
  "Near Expiry": "orange",
  Expired: "danger",
};

export function StockBadge({ status, className }: { status: BatchStatus; className?: string }) {
  return (
    <Badge tone={stockTone[status]} className={cn(className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </Badge>
  );
}

const purchaseTone: Record<PurchaseStatus, Tone> = {
  Draft: "neutral",
  Pending: "warning",
  Received: "success",
  "Partially Received": "primary",
  Cancelled: "danger",
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <Badge tone={purchaseTone[status]}>{status}</Badge>;
}

const paymentTone: Record<PaymentStatus | SalePaymentStatus, Tone> = {
  Paid: "success",
  Partial: "warning",
  Unpaid: "danger",
  Refunded: "neutral",
  "Partially Refunded": "warning",
};

export function PaymentBadge({ status }: { status: PaymentStatus | SalePaymentStatus }) {
  return <Badge tone={paymentTone[status]}>{status}</Badge>;
}

const rxTone: Record<PrescriptionStatus, Tone> = {
  Pending: "warning",
  Verified: "primary",
  Dispensed: "success",
  Rejected: "danger",
};

export function PrescriptionBadge({ status }: { status: PrescriptionStatus }) {
  return <Badge tone={rxTone[status]}>{status}</Badge>;
}

export function StaffStatusBadge({ status }: { status: StaffMember["status"] }) {
  const tone: Tone = status === "Active" ? "success" : status === "On Leave" ? "warning" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Inactive"}</Badge>;
}
