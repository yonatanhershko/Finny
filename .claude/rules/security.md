# Security rules

- Every table has Row Level Security on. A client sees only rows where `user_id = auth.uid()`. Admin access goes through `security definer` functions that check `is_admin()` first.
- Subscription status, role, plan, `approved_at`, `expires_at` are written only by admin RPCs or the daily cron. A client can never update them. Enforce with RLS + column grants, not UI.
- The app lock screen is UX only. Real enforcement is RLS: financial tables require `has_access(auth.uid())`.
- Secret key (`sb_secret_…`) lives only in gitignored `.env*` files, Supabase function secrets, and Vercel server env. Never in `apps/mobile`, never in a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` variable, never in a commit.
- Client code uses the publishable key only.
- Never log tokens, passwords, or full emails.
- Destructive SQL (drop, truncate, delete without where) and irreversible migrations need the owner's explicit OK.
- Account deletion removes all the user's rows and the auth user, server-side.
