"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAdminAuth } from "@/auth/AdminAuth";
import { env } from "@/lib/env";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/approvals", label: "Pending approvals" },
  { href: "/users", label: "Users" },
] as const;

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 220 230" aria-hidden="true">
      <rect x="55" y="26" width="95" height="75" rx="11" fill="#7DB892" transform="rotate(-4 100 60)" />
      <rect x="48" y="40" width="105" height="75" rx="11" fill="#F6B88A" transform="rotate(2 100 75)" />
      <rect x="25" y="80" width="170" height="132" rx="20" fill="#3A8A66" />
      <path d="M25 100 a20 20 0 0 1 20 -20 H175 a20 20 0 0 1 20 20 V112 H25 Z" fill="#4C9A76" />
      <path d="M130 130 H182 a15 15 0 0 1 15 15 v26 a15 15 0 0 1 -15 15 H130 a28 28 0 0 1 -28 -28 a28 28 0 0 1 28 -28 Z" fill="#245C47" />
      <circle cx="160" cy="158" r="13" fill="#F2C14E" />
    </svg>
  );
}

export function AdminShell({
  pendingCount,
  children,
}: {
  pendingCount: number | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { state, signOut } = useAdminAuth();
  const profile = state.status === "ready" ? state.profile : null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col justify-between bg-text p-5 text-background">
        <div>
          <div className="mb-8 flex items-center gap-3 px-2">
            <Logo />
            <span className="text-2xl font-bold">Finny</span>
          </div>
          <nav className="space-y-1" aria-label="Main">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    active ? "bg-primary text-on-primary" : "hover:bg-primary/40"
                  }`}
                >
                  {item.label}
                  {item.href === "/approvals" && !!pendingCount && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="space-y-3 px-2">
          <div>
            <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
            <p className="truncate text-xs opacity-70">{profile?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end px-8 pt-6">
          <span
            className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
              env.appEnv === "production"
                ? "border-success text-success"
                : "border-accent text-on-accent"
            }`}
          >
            {env.appEnv === "production" ? "Production" : "Development"}
          </span>
        </div>
        <main className="flex-1 px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}
