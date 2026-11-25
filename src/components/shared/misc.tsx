"use client";

import * as React from "react";
import { Inbox, Pill, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  compact,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-12" : "py-20")}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-surface-muted text-muted">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeLabel,
  tone = "primary",
  invertTrend = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  tone?: "primary" | "accent" | "success" | "warning" | "danger" | "orange";
  invertTrend?: boolean;
}) {
  const toneClass: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  const up = (change ?? 0) >= 0;
  const good = invertTrend ? !up : up;
  return (
    <Card className="flex flex-col gap-4 p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span className={cn("flex size-8 items-center justify-center rounded-md", toneClass[tone])}>{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        {change !== undefined && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", good ? "text-success" : "text-danger")}>
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {Math.abs(change).toFixed(1)}%
            <span className="font-normal text-muted">{changeLabel ?? "vs prev."}</span>
          </span>
        )}
      </div>
    </Card>
  );
}

export function MedicineThumb({ name, className }: { name: string; className?: string }) {
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 2 === 0 ? "text-primary" : "text-accent";
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted",
        className,
      )}
      aria-hidden
    >
      <Pill className={cn("size-4", hue)} />
    </div>
  );
}

export function ConfirmButtonRow({
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant={danger ? "danger" : "default"} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </>
  );
}
