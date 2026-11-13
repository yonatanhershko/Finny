/**
 * Public runtime config for the admin dashboard.
 * Local: .env.development. Vercel: Preview -> dev project, Production -> prod project.
 * NEXT_PUBLIC_* reaches the browser: no secrets here.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Copy apps/web/.env.example to .env.development.`);
  }
  return value;
}

export type AppEnv = "development" | "production";

export const env = {
  appEnv: (process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? "production"
    : "development") as AppEnv,
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;
