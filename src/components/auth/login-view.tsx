"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Field, Input } from "@/components/ui/primitives";
import { MediPosLogo } from "@/components/layout/logo";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { useUiStore } from "@/store/ui-store";
import type { StaffMember } from "@/types";

/** Only allow redirects to pages inside this app. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && next !== "/login" ? next : "/dashboard";
}

export function LoginView() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const theme = useUiStore((s) => s.theme);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Already signed in (or just signed in): continue into the app.
  React.useEffect(() => {
    if (token) router.replace(next);
  }, [token, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string; user: StaffMember }>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
        auth: false,
      });
      useDataStore.getState().clear();
      setSession(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <MediPosLogo />
        <h1 className="mt-6 text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Use the email and password your pharmacy admin gave you.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pharmacy.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !email || !password} className="w-full">
            {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
