# Supabase

- `migrations/` — schema changes, one file per change, named `YYYYMMDDHHMMSS_what.sql`. Applied to dev first. Never edit an applied file; add a new one.
- `functions/` — edge functions (daily expiry job, account deletion).
- `seed/` — dev-only seed scripts. `dev-users.local.md` holds dev test credentials and is gitignored.

Prod gets the same migrations, in order, on its own clean project.
