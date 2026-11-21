# CI/CD

Decided by the owner 2026-11-21: every push is checked; production changes only by hand, with approval.

## On every push and pull request (`.github/workflows/ci.yml`)

Branches `dev` and `main`. All jobs must be green before merging into `main`.

| Job | What it proves |
| --- | --- |
| Typecheck, lint, tests | `npm run typecheck`, `npm run lint`, `npm test`, Hebrew and English keys match (`scripts/ci/i18n-check.mjs`) |
| Secret scan | gitleaks over the whole history: no keys, tokens or passwords in git |
| Build mobile + web | `expo export` for iPhone and Android, and `next build` of the admin dashboard, with public placeholder values. Then the bundle size against `scripts/ci/bundle-budget.json`: fails when a part grows more than 10%. After an intended growth, raise the budget in the same change |
| Migrations on an empty database + DB tests | A fresh local Supabase applies every file in `supabase/migrations/` in file order (exactly what prod will get), `supabase db lint` checks the functions, four test users are seeded (`supabase/tests/ci-setup.mjs`), then `npm run test:db` (RLS, access, money) runs against it. Dev is never touched |
| Supabase advisors (dev) | Security and performance advisors of the dev project. Fails on ERROR; WARN and INFO are listed in the job summary |

Accepted advisor warnings (not errors): `security definer` functions callable by signed-in users — each one checks the caller first (`is_admin()`, `auth.uid()`); `track_event` callable without sign-in — analytics before sign-up, validated server-side; tables with RLS on and no policies — read only through `security definer` functions; leaked-password protection — to switch on (see the security review).

## Production (`.github/workflows/deploy.yml`)

Never automatic. Actions tab → "Deploy to production" → Run workflow, on `main`, type `prod`. CI runs again on that commit, then each job waits for the owner's approval in the `production` environment.

| Choice | What happens |
| --- | --- |
| migrations | `supabase db push` to the prod database: shows the pending files, then applies them in file order |
| store build | `eas build --profile production` for iPhone, Android or both. Runs in Expo's cloud; submit to the stores from expo.dev |
| migrations + store build | both, migrations first |
| update (JS only) | `eas update --channel production`: JS and asset fixes reach installed apps without a store review. Only builds with the same app version get it; any native change (new native package, permission, icon, config plugin) needs a store build |

Migration versions: dev was migrated through the Supabase MCP, which records each migration under the time it was applied, not the file name. So dev's history does not match the files, and the deploy workflow never pushes to dev. Prod starts empty and gets the files in order, under their own names.

## Dependencies (`.github/dependabot.yml`)

Weekly PRs into `dev`, minor and patch grouped, CI checks each. Expo, React and React Native packages are left out: they move with the Expo SDK (`npx expo install --fix`).

## One-time setup (owner)

GitHub repository → Settings:

1. **Secrets and variables → Actions → Secrets:**
   - `SUPABASE_ACCESS_TOKEN` — supabase.com → Account → Access Tokens → Generate. Used for the advisors and prod migrations.
   - `EXPO_TOKEN` — expo.dev → Account settings → Access tokens → Create (a robot token is best).
2. **Secrets and variables → Actions → Variables:** `DEV_PROJECT_REF` = the dev project ref (the part before `.supabase.co` in the dev URL).
3. **Environments → `production`:** required reviewer = the owner; deployment branches = `main` only. Its secret `PROD_DB_URL` = the prod database connection string (Supabase → prod project → Connect → Session pooler URI, with the database password). Add it only when the prod project exists.
4. **Expo (expo.dev → project kaspilo → Environment variables → production):** the prod `EXPO_PUBLIC_*` values and `GOOGLE_SERVICES_JSON` (file). Without them a production build cannot reach prod.
5. **Branch protection for `main`:** require a pull request and the CI jobs above.
