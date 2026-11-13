import { env } from "@/lib/env";

/** Placeholder until Phase 2 builds the dashboard. Proves env and shared tokens work. */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-text">
      <h1 className="text-4xl font-bold text-primary">Finny Admin</h1>
      <p>Environment: {env.appEnv}</p>
      <p className="text-sm text-text-muted">
        Supabase: {new URL(env.supabaseUrl).host}
      </p>
    </main>
  );
}
