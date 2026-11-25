"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Toaster } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";

/**
 * App frame for every dashboard route. The session is read from localStorage on
 * the client only, so we render a skeleton until mounted (avoiding server/client
 * markup mismatches) and until the pharmacy data has loaded from the API.
 */
const noopSubscribe = () => () => {};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  // False during SSR and the first client render, true after hydration, without an effect.
  const ready = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const theme = useUiStore((s) => s.theme);
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen);
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const token = useAuthStore((s) => s.token);
  const status = useDataStore((s) => s.status);
  const loadError = useDataStore((s) => s.error);
  const load = useDataStore((s) => s.load);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Signed out: go to the login page. Signed in: fetch the pharmacy data once.
  React.useEffect(() => {
    if (!ready) return;
    if (!token) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "idle") void load();
  }, [ready, token, status, load, router, pathname]);

  if (ready && token && status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <p className="text-base font-semibold">Could not load your pharmacy data</p>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
          <Button className="mt-4" onClick={() => void load()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (!ready || !token || status !== "ready") {
    return (
      <div className="flex min-h-dvh">
        <div className="hidden w-62 border-r border-border p-4 md:block">
          <Skeleton className="mb-6 h-8 w-32" />
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-9 w-full" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="mb-6 h-14 w-full" />
          <Skeleton className="mb-4 h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-dvh bg-background">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={pathname}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="min-w-0 flex-1 p-4 sm:p-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent side="right" className="p-0">
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Main navigation</DialogPrimitive.Description>
          <AppSidebar variant="mobile" onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" closeButton />
    </TooltipProvider>
  );
}
