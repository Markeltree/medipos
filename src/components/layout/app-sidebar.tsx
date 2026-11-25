"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { navGroups } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { initials, useAuthStore } from "@/store/auth-store";
import { Tooltip } from "@/components/ui/tooltip";
import { MediPosLogo } from "@/components/layout/logo";

export function AppSidebar({ variant = "desktop", onNavigate }: { variant?: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const isMobile = variant === "mobile";
  const isCollapsed = !isMobile && collapsed;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobile ? "100%" : isCollapsed ? 68 : 248 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface",
        !isMobile && "sticky top-0 hidden h-dvh shrink-0 md:flex",
      )}
      aria-label="Primary"
    >
      <div className={cn("flex h-14 items-center border-b border-border px-4", isCollapsed && "justify-center px-0")}>
        <MediPosLogo collapsed={isCollapsed} />
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!isCollapsed && (
              <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted/80">{group.label}</p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13.5px] font-medium transition-colors",
                      isCollapsed && "justify-center px-0",
                      active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={isMobile ? "nav-indicator-m" : "nav-indicator"}
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className="size-[18px] shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {isCollapsed ? (
                      <Tooltip content={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2.5">
        {!isMobile && (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "mb-2 flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-[13px] text-muted hover:bg-surface-muted hover:text-foreground",
              isCollapsed && "justify-center px-0",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        )}

        <div className={cn("flex items-center gap-2.5 rounded-md p-1.5", isCollapsed && "justify-center")}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
            {initials(user?.name ?? "")}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.role}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success("Signed out");
                router.replace("/login");
              }}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <Tooltip content="Log out" side="right">
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success("Signed out");
                router.replace("/login");
              }}
              className="mt-1 flex h-8 w-full cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </Tooltip>
        )}
      </div>
    </motion.aside>
  );
}
