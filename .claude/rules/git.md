# Git rules

- Local repo, branch `main`. One commit per phase, made only after that phase's checks pass (typecheck, lint, tests that exist).
- Commit message: `phase N: short summary`, body lists what was done and what was verified.
- Never commit `.env*` (except `*.example`), keys, or the dev users file. The pre-commit hook in `.githooks/` scans for this; do not bypass with `--no-verify`.
- Package manager is npm only. Expo-managed packages are added with `npx expo install` inside `apps/mobile`. Then run `npm install` at the repo root: mobile uses Tailwind 3 (NativeWind) and web uses Tailwind 4, and the root install keeps the two apart. If the web build then fails inside `globals.css`, delete `apps/web/.next`.
- No force push, no history rewrite, without the owner's OK.
