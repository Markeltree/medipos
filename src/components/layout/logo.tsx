import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MediPosLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Plus className="size-4.5" strokeWidth={3} />
      </span>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight">
          Medi<span className="text-primary">POS</span>
        </span>
      )}
    </div>
  );
}
