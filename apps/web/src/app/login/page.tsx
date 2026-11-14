"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { useAdminAuth } from "@/auth/AdminAuth";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { state, signIn, signOut } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.status === "ready") router.replace("/");
  }, [state.status, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(await signIn(email, password));
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-primary">Finny Admin</h1>
          <p className="text-sm text-text-muted">Sign in with an admin account.</p>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-text-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 outline-none focus:border-primary"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-text-muted">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 outline-none focus:border-primary"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {state.status === "notAdmin" && (
          <div role="alert" className="space-y-2 text-sm text-danger">
            <p>This account is not an admin.</p>
            <button type="button" className="underline" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        )}
        <Button type="submit" disabled={busy} className="h-11 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
