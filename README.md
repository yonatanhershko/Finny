# Finny

Personal-finance app (Expo) + admin dashboard (Next.js) on Supabase. Product decisions: [docs/spec.md](docs/spec.md).

## Layout

```
apps/mobile      Expo React Native app (iOS + Android)
apps/web         Next.js admin dashboard (Vercel)
packages/tokens  Global style shared by both apps
supabase/        Migrations, edge functions, seed
evals/           Prod readiness checklist
```

## Setup

```bash
npm install
```

```bash
npm run mobile
```

```bash
npm run web
```

Checks:

```bash
npm run typecheck
```

```bash
npm run lint
```

## Environments

Dev and prod are fully separate. Nothing is shared between them.

| | Development | Production |
| --- | --- | --- |
| Supabase project | dev project | separate clean project (not created yet) |
| App name | Finny Dev | Finny |
| Deep link scheme | `finny-dev://` | `finny://` |
| Bundle id / package | `com.finny.app.dev` | `com.finny.app` |
| Mobile env file | `apps/mobile/.env.development` | `apps/mobile/.env.production` + EAS `production` environment |
| Web env | `apps/web/.env.development`, Vercel Preview | Vercel Production |

Env files are gitignored. Copy each `.env.example` and fill it in.

- **Mobile:** `expo start` loads `.env.development`. EAS builds do not upload gitignored files, so set the same `EXPO_PUBLIC_*` variables in the matching EAS environment (`development`, `preview`, `production`). `APP_VARIANT` in [apps/mobile/eas.json](apps/mobile/eas.json) picks name, scheme and bundle id in [apps/mobile/app.config.ts](apps/mobile/app.config.ts).
- **Web:** on Vercel set the project root to `apps/web`, then add the three `NEXT_PUBLIC_*` variables twice: Preview → dev project, Production → prod project. A production build with missing variables fails on purpose.
- **Root `.env`:** only for local scripts that need the secret key (seeding dev users). The apps never read it.

Keys: the apps use the publishable key only. The secret key bypasses Row Level Security and must never be in `apps/` or in any `EXPO_PUBLIC_` / `NEXT_PUBLIC_` variable.

## Going to prod

Pass [evals/prod-readiness.md](evals/prod-readiness.md) first.
