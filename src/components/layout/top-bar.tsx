"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  Menu,
  Moon,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  User,
  Settings,
  LogOut,
  Users,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import { initials, useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { findNav } from "@/lib/nav";
import { expiryGroups } from "@/lib/analytics";
import { useDataStore } from "@/store/data-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/layout/command-palette";

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = findNav(pathname);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The POS screen uses Ctrl/⌘ + K for its own product search.
      if (pathname.startsWith("/pos")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur sm:px-5">
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs text-muted sm:flex">
          <Link href="/dashboard" className="hover:text-foreground">MediPOS</Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-foreground">{current?.crumb ?? "Page"}</span>
        </nav>
        <h2 className="truncate text-[15px] font-semibold leading-tight sm:text-sm">{current?.crumb ?? "MediPOS"}</h2>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="hidden h-8 w-64 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-muted/60 px-2.5 text-[13px] text-muted transition-colors hover:border-primary/40 lg:flex"
        aria-label="Open global search"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search medicines, customers…</span>
        <Kbd>Ctrl K</Kbd>
      </button>
      <Tooltip content="Search" side="bottom">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setPaletteOpen(true)} aria-label="Search">
          <Search />
        </Button>
      </Tooltip>

      <DateTimeClock />

      <NotificationsMenu />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="ml-1 px-2 sm:px-3" aria-label="Quick actions">
            <Plus />
            <span className="hidden sm:inline">Quick action</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56">
          <DropdownMenuLabel>Create</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => router.push("/pos")}>
            <ShoppingCart /> New sale
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/products?new=1")}>
            <Pill /> Add medicine
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/purchases?new=1")}>
            <ClipboardList /> New purchase order
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/customers?new=1")}>
            <Users /> Add customer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip content={theme === "light" ? "Dark theme" : "Light theme"} side="bottom">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon /> : <Sun />}
        </Button>
      </Tooltip>

      <ProfileMenu />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

/** Live clock. Rendered only after the shell mounts, so it never mismatches on the server. */
function DateTimeClock() {
  const [now, setNow] = React.useState<Date>(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden whitespace-nowrap px-2 text-xs tabular-nums text-muted xl:inline">
      {format(now, "EEE, dd MMM yyyy · HH:mm")}
    </span>
  );
}

function NotificationsMenu() {
  const router = useRouter();
  const medicines = useDataStore((s) => s.medicines);
  const purchases = useDataStore((s) => s.purchases);
  const prescriptions = useDataStore((s) => s.prescriptions);
  const groups = expiryGroups(medicines);
  const lowStock = medicines.filter((m) => m.stock <= m.minStock);
  const pendingRx = prescriptions.filter((p) => p.status === "Pending").length;
  const openPo = purchases.filter((p) => p.status === "Pending" || p.status === "Partially Received").length;
  const expiring = groups.expired.length + groups.d30.length;
  const total = lowStock.length + expiring + pendingRx;

  const items = [
    { icon: AlertTriangle, tone: "text-warning", label: `${lowStock.length} medicines at or below minimum stock`, href: "/inventory" },
    { icon: CalendarClock, tone: "text-orange-500", label: `${expiring} batches expired or expiring within 30 days`, href: "/expiry" },
    { icon: FileText, tone: "text-primary", label: `${pendingRx} prescriptions awaiting verification`, href: "/prescriptions" },
    { icon: ClipboardList, tone: "text-accent", label: `${openPo} purchase orders awaiting delivery`, href: "/purchases" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={`Notifications, ${total} unread`}>
          <Bell />
          {total > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {items.map((it) => (
          <DropdownMenuItem key={it.label} onSelect={() => router.push(it.href)} className="items-start">
            <it.icon className={cn("mt-0.5", it.tone)} />
            <span className="text-[13px] leading-snug">{it.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ml-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none" aria-label="Account menu">
          {initials(user?.name ?? "")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <span className="block text-[13px] font-medium text-foreground">{user?.name}</span>
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/staff")}>
          <User /> Staff profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            logout();
            toast.success("Signed out");
            router.replace("/login");
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
