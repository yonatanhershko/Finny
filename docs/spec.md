# Finny spec — approved decisions

Decided by the owner on 2026-11-13. Lines marked **(assumed)** were proposed by Claude and not yet confirmed; confirm or change them before the phase that uses them.

## Product

- Mobile app (Expo, iOS + Android) for tracking income, expenses, budgets, goals. Admin web dashboard (Next.js on Vercel free tier). One Supabase database per environment.
- Dev environment first. Prod gets a clean, separate Supabase project later.
- Languages: Hebrew and English. Phone language decides at first launch; anything else falls back to Hebrew. User can switch in More.
- Themes: light and dark, tokens in `.claude/rules/design.md`.

## Build order

Init → Phase 1 infra → Phase 5 tokens / theme / i18n / leaf art → Phase 2 auth, gate, admin → Phase 3 money features → Phase 4 tabs and settings. One local commit per phase.

## Subscription and access

- Yearly subscription paid by Bit, outside the app. No payment proof upload. Admin matches the payer by name.
- Phone number is not required at sign-up.
- Locked screen button "Contact your advisor" opens WhatsApp to 052-320-3902. A bot may replace this later.
- `profiles.status`: `pending_approval` | `active` | `expired` | `rejected`.
- `profiles.role`: `client` | `admin`.
- `profiles.plan`: `paid` (1 year), `vip` (1 year, granted by admin without payment), `family` (never expires, granted by admin). **(assumed: this is the meaning of VIP and family)**
- Approve: status → `active`, `approved_at` = now, `expires_at` = now + 365 days (`family`: no expiry).
- Renew / extend: new expiry = old `expires_at` + 365 days if still active, otherwise now + 365 days.
- Rejected users can submit again (status back to `pending_approval`).
- Expired users keep all data; the app is locked until an admin approves again.
- Daily job: 30 and 7 days before expiry → push reminder. Past expiry → status `expired`.
- Locked users cannot read or write financial data through the API either (RLS), not only in the UI.

## Sign-in

- Email + password first. No email confirmation (no email-sending cost).
- Google and Facebook sign-in are wired later, when the owner has the developer accounts.
- Apple sign-in: not wanted. Open issue: App Store requires an equivalent privacy-focused login (Apple) when third-party social login is offered on iOS. Decide when social login goes in.

## Money

- Amounts stored as integers in minor units. Always positive; `type` is `income` or `expense`.
- Currency: user preference in settings, `ILS` or `USD`. **(assumed: display only, one currency per account, no conversion)**
- Budget month: calendar month, or a user-chosen start day. **(assumed: start day limited to 1–28 so every month has it)**
- Categories: separate lists for income and expense. Defaults are created for each new user; the user can add, rename, delete and reorder both lists. No subcategories.
  - Expense defaults: car, food and drink, leisure, housing, health, shopping, bills, other.
  - Income defaults: salary, other.
- Budgets: optional monthly budget per expense category, plus an optional overall monthly budget. Same amount every month, no rollover.
- Home shows, small and quiet, how much is left: overall and per category. Over budget → bold red amount and red bar.
- Transaction fields: amount, description, date (defaults to today), category, and optional repeat.
- Repeat options: recurring (repeats on a chosen date) or installments (a total split over N payments from a chosen date). Detailed rules (frequency choices, editing, deleting) to be confirmed before Phase 3.
- Goals: separate from transactions. A deposit into a goal does not count as an expense and does not change totals or stats.
- Not in v1: accounts (cash / card), transfers, tags, receipt photos.

## Screens

- Tabs: Today (home), Stats, Goals, More.
- Home: moving 3D wallet logo, date, period expense total, overall left, Income and Expense buttons, category cards. Tap a card → that period's transactions with edit / delete.
- Add transaction: bottom sheet; category is an icon grid with a "+" tile at the end.
- Stats: monthly / yearly, expense / income, previous / next period, donut with total in the center, legend with percent and sum, change versus the previous period.
- Goals: cards with target, saved, progress bar, deposit button.
- More: account, language, theme, currency, budget month start, reminders, purchase-notification toggle (future), history + Excel export, delete account, sign out.
- Login and every register step: wallet illustration with moving 3D leaves. Many leaves across the app.
- Reminders: daily "log your spending" at a chosen time, plus subscription expiry notices.
- Delete account: hard delete of all data and the auth user, after confirmation.
- Online only in v1.

## Admin web

- English, desktop first, layout as in the owner's mockup. Admins only.
- KPIs: total users, active subscribers, pending approvals, expiring soon.
- Pending approvals: approve (pick plan: paid / vip / family) or reject.
- Users: extend access, change plan, see status and expiry.

## Future (not built now, keep room)

- Automatic purchase detection from bank / Apple Pay / Google Pay notifications, with a toggle in More. Possible on Android (notification listener); iOS does not let apps read other apps' notifications.
- WhatsApp bot for approvals.

## Dev test users

Four users in the dev project: one admin, one active client, one pending, one expired. Credentials are kept in the gitignored `supabase/seed/dev-users.local.md`.
