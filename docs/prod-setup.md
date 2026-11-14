# Where the prod keys go

Dev and prod never share a key. The prod Supabase project is "Finny Prod". Get its values from the Supabase dashboard → Project Settings → API keys.

You need two values for the apps:

- **Project URL** — `https://<prod-ref>.supabase.co`
- **Publishable key** — starts with `sb_publishable_`

The **secret key** (`sb_secret_…`) is not used by either app. Keep it out of both.

## 1. Mobile app

For store builds, EAS does not read local env files. Put the values in the EAS **production** environment:

```bash
cd apps/mobile
```

```bash
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<prod-ref>.supabase.co --visibility plaintext
```

```bash
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_xxx --visibility plaintext
```

```bash
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_APP_ENV --value production --visibility plaintext
```

To run the prod setup locally, also create `apps/mobile/.env.production` (gitignored) from `apps/mobile/.env.example` with the same three values.

## 2. Admin web (Vercel)

Vercel → the project → Settings → Environment Variables. Add, for the **Production** environment only:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<prod-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_xxx` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

Add the same three names for **Preview** with the dev project's values. Project root directory in Vercel: `apps/web`.

## 3. Database

Apply every file in `supabase/migrations/`, in name order, to the prod project. Then create the first admin by hand: sign up in the app, then in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin', status = 'active', plan = 'family', approved_at = now(), expires_at = null
where email = 'your-email@example.com';
```

In Supabase Auth settings for prod: turn "Confirm email" off (the app does not send confirmation emails), and add `finny://` to the allowed redirect URLs.

## 4. Before going live

Run through `evals/prod-readiness.md`. Rotate the dev secret key that was pasted in chat.
