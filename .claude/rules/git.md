# Git rules

- Local repo, branch `main`. One commit per phase, made only after that phase's checks pass (typecheck, lint, tests that exist).
- Commit message: `phase N: short summary`, body lists what was done and what was verified.
- Never commit `.env*` (except `*.example`), keys, or the dev users file. The pre-commit hook in `.githooks/` scans for this; do not bypass with `--no-verify`.
- Package manager is npm only. Expo-managed packages are added with `npx expo install` inside `apps/mobile`.
- No force push, no history rewrite, without the owner's OK.
