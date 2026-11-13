import { colors } from "@finny/tokens";

import { env } from "@/lib/env";

/** Phase 1 placeholder: proves env and shared tokens work. Replaced by the dashboard in Phase 2. */
export default function Home() {
  const theme = colors.light;
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-2"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <h1 className="text-4xl font-bold" style={{ color: theme.primary }}>
        Finny Admin
      </h1>
      <p>Environment: {env.appEnv}</p>
      <p className="text-sm" style={{ color: theme.textMuted }}>
        Supabase: {new URL(env.supabaseUrl).host}
      </p>
    </main>
  );
}
