"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pill, Search, Users, Compass } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { allNavItems } from "@/lib/nav";
import { useDataStore } from "@/store/data-store";
import { formatPKR } from "@/lib/utils";

interface Result {
  key: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  href: string;
}

/** Global search (Ctrl/⌘ + K): jumps to pages, medicines and customers. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="top-[18vh] translate-y-0 overflow-hidden p-0">
        {/* Body is unmounted when closed, so the query resets on every open. */}
        <PaletteBody onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const medicines = useDataStore((s) => s.medicines);
  const customers = useDataStore((s) => s.customers);

  const q = query.trim().toLowerCase();
  const results = React.useMemo<Result[]>(() => {
    if (!q) return [];
    const pages: Result[] = allNavItems
      .filter((i) => i.label.toLowerCase().includes(q))
      .map((i) => ({ key: `p-${i.href}`, label: i.label, hint: "Page", icon: <Compass className="size-4" />, href: i.href }));
    const meds: Result[] = medicines
      .filter((m) => `${m.name} ${m.genericName} ${m.barcode} ${m.sku}`.toLowerCase().includes(q))
      .slice(0, 6)
      .map((m) => ({
        key: `m-${m.id}`,
        label: `${m.name} ${m.strength}`,
        hint: `${m.genericName} · ${formatPKR(m.sellingPrice)}`,
        icon: <Pill className="size-4" />,
        href: `/products?q=${encodeURIComponent(m.name)}`,
      }));
    const custs: Result[] = customers
      .filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({ key: `c-${c.id}`, label: c.name, hint: c.phone, icon: <Users className="size-4" />, href: `/customers?q=${encodeURIComponent(c.name)}` }));
    return [...pages, ...meds, ...custs].slice(0, 12);
  }, [q, medicines, customers]);

  const go = (r: Result) => {
    onDone();
    router.push(r.href);
  };

  return (
    <>
      <DialogPrimitive.Title className="sr-only">Global search</DialogPrimitive.Title>
      <DialogPrimitive.Description className="sr-only">Search pages, medicines and customers</DialogPrimitive.Description>
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="size-4 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              go(results[active]);
            }
          }}
          placeholder="Search medicines, customers or pages…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
          aria-label="Global search"
        />
      </div>
      <ul className="thin-scroll max-h-80 overflow-y-auto p-2">
        {!q && <li className="px-3 py-6 text-center text-sm text-muted">Type to search across MediPOS</li>}
        {q && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{query}”</li>}
        {results.map((r, i) => (
          <li key={r.key}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                i === active ? "bg-surface-muted" : ""
              }`}
            >
              <span className="text-muted">{r.icon}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
              <span className="truncate text-xs text-muted">{r.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
