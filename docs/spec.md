# Finny spec — approved decisions

Decided by the owner on 2026-11-13. Lines marked **(assumed)** were proposed by Claude and not yet confirmed; confirm or change them before the phase that uses them.

## Product

- Mobile app (Expo, iOS + Android) for tracking income, expenses, budgets, goals. Admin web dashboard (Next.js on Vercel free tier). One Supabase database per environment.
- Dev environment first. Prod gets a clean, separate Supabase project later.
- Languages: Hebrew and English. Phone language decides at first launch: Hebrew phone → Hebrew, any other language → English (changed by the owner 2026-11-14). User can switch in More.
- Layout direction: the screen layout is the same on iPhone, Android and web and never mirrors (tab bar, header, button pairs keep their left-to-right places). Language only changes (1) where text starts: Hebrew text sits at the right, English at the left, centered text stays centered, and text that is only a number (amount, date, time, phone) is always at the left and reads left to right, also in Hebrew; the currency sign is left of the number, and (2) the order inside rows of icon + text (Hebrew: icon at the right). No app reload when the language changes. **(owner request 2026-11-15)**
- Themes: light and dark, tokens in `.claude/rules/design.md`.

## Build order

Init → Phase 1 infra → Phase 5 tokens / theme / i18n / leaf art → Phase 2 auth, gate, admin → Phase 3 money features → Phase 4 tabs and settings. One local commit per phase.

## Subscription and access

- Yearly subscription paid by Bit, outside the app. No payment proof upload. Admin matches the payer by name.
- Phone number is not required at sign-up.
- Locked screen button "Contact your advisor" opens WhatsApp to 052-320-3902. A bot may replace this later.
- `profiles.status`: `pending_approval` | `active` | `expired` | `rejected`.
- `profiles.role`: `client` | `admin`.
- `profiles.plan`: `paid` (1 year), `vip` (1 year, granted by admin without payment), `family` (never expires, granted by admin). Confirmed by the owner 2026-11-14.
- Access length: the admin picks it on approve, renew and extend: **1 year** (365 days, default) or **2 months** (calendar months). `family` ignores it. (owner 2026-11-15)
- Approve: status → `active`, `approved_at` = now, `expires_at` = now + chosen length (`family`: no expiry).
- Renew / extend: new expiry = old `expires_at` + chosen length if still active, otherwise now + chosen length.
- Rejected users can submit again (status back to `pending_approval`).
- Expired users keep all data; the app is locked until an admin approves again.
- Refund (owner 2026-11-15): cancel within 14 days of payment (Consumer Protection Law), refund minus the lower of 5% or ₪100, sent by Bit within 14 days. No refund after 14 days. If Finny shuts down, the unused part is refunded pro rata. Done by hand by the admin, no app flow.
- No age limit. Under 18 needs a parent's consent to pay (stated in the terms).
- A blocked user can get their data export by emailing the owner; the in-app export needs access.
- Daily job: past expiry → status `expired`. Renewal reminders: see "Notifications".
- Locked users cannot read or write financial data through the API either (RLS), not only in the UI.

## Sign-in

- Email + password first. No email confirmation (no email-sending cost).
- No welcome screen (owner 2026-11-16): a signed-out user lands straight on sign-in. Sign-up is reached from the link under it; its back button returns to sign-in.
- Sign-up has three steps: name, email, password. Earlier steps show as rows with a pencil, so the user can jump back and change the name or email. Under the email field is a "Terms of use" tab: tap it, press "I agree" (pinned at the bottom, no need to scroll to the end), and the tab turns green. Continue stays locked until then. No checkbox. The accepted version and time are saved on the auth user (`terms_version`, `terms_accepted_at`). (owner 2026-11-14, no-scroll 2026-11-15)
- Terms of use: Hebrew + English text in the app i18n files, version `2026-11-15b`, approved by the owner 2026-11-15. Bump `TERMS_VERSION` when the text changes. Operator shown as the owner's private name until a business is registered. Contact: email only. Subscription length is not fixed in the terms: price and length are given to the user before payment (WhatsApp / phone / email, not shown in the app); the operator may grant free or non-expiring access (vip / family).
- Forgot password: from sign-in. Email → 6-digit code sent by email → code + new password. No OTP at sign-up (the admin approval is the gate; clients are personal, a few per month). Needs custom SMTP and a code template, see `docs/prod-setup.md`. (owner 2026-11-14)
- Google sign-in (owner 2026-11-16): one "Continue with Google" button on the sign-in screen, under the password form; it signs in an existing user or creates a new one. On the phone it uses Google's native sign-in sheet (shows "Finny", not the Supabase address) and Supabase checks the ID token; web and Expo Go fall back to Supabase hosted Google OAuth in the browser, back to `<scheme>://auth-callback`. One Google OAuth web client serves dev and prod (owner 2026-11-17). Name comes from Google. A new Google user never saw the sign-up terms tab, so the first sign-in opens the terms screen: "I agree" saves `terms_version` / `terms_accepted_at`, the other choice signs out. Then the usual locked screen until an admin approves. (terms gate and button placement chosen by Claude) Setup steps: `docs/google-sign-in.md`.
- Facebook sign-in: later, when the owner has the developer account.
- Apple sign-in: not wanted. **Open issue, now live:** with Google sign-in on iOS, App Store guideline 4.8 asks for an equivalent privacy-focused login (Sign in with Apple), or review may reject the app. Decide before the first App Store submission: add Apple, or hide the Google button on iOS.

## Money

- Amounts stored as integers in minor units. Always positive; `type` is `income` or `expense`.
- Currency: user preference in settings, `ILS` or `USD`. Display only: the sign changes, nothing is converted. Confirmed 2026-11-14.
- Budget month: calendar month, or a user-chosen start day 1–31 (no 28 limit, owner 2026-11-14). In a month shorter than the start day, the budget month starts on that month's last day (start day 31 → 28/29 Feb, 30 Apr). Calendar math uses the date-fns library, never hand-written date code.
- Yearly stats = calendar year, 1 January to 31 December. **(assumed)**
- Categories: separate lists for income and expense. Defaults are created for each new user; the user can add, rename, delete and reorder both lists. No subcategories.
  - Expense defaults: car, food and drink, leisure, housing, health, shopping, bills, other.
  - Income defaults: salary, other.
- Budgets: optional monthly budget per expense category, plus an optional overall monthly budget. Same amount every month, no rollover.
- Home shows, small and quiet, how much is left: overall and per category. Over budget → bold red amount and red bar.
- Transaction fields: amount, description, date (defaults to today), category, and optional repeat.
- Repeat options, chosen in the add sheet. **(details assumed by Claude, confirm or change)**
  - Recurring: weekly, monthly or yearly from the chosen date. Each occurrence becomes a real transaction on its date, created when the app is opened on or after that date (missed ones are caught up). A rule that starts on the 31st stays on month ends.
  - Installments: a total split into 2–120 monthly payments from the chosen date. Every payment is the total divided by the count, rounded down; the remainder goes on the first payment, so the payments sum to the total exactly. All payments are created at once, future-dated, and count in the month they fall in.
  - Each generated transaction can be edited or deleted on its own. Editing a rule is not in v1.
- Deleting a category: if it has transactions it is archived (hidden from pickers; history and totals keep it). If unused it is deleted. **(assumed)**
- Goal withdrawals are not in v1; deposits only. **(assumed)**
- Home lists an expense category when it has spending in the current budget month or has a budget.
- Balance = income − goal deposits − expenses, for the same budget period (negative allowed). Home shows it under the expense total in place of the income line. Stats has a third tab, Balance, monthly and yearly: the donut splits income into expenses, saved and left (when over, only expenses and saved). **(owner request 2026-11-15, donut split chosen by Claude)**
- Goals: separate from transactions. A deposit into a goal does not count as an expense and does not change totals or stats.
- Home shows a "Deposits this month" section under the categories: one card per goal that got a deposit in the current budget month, with the sum deposited that month. Tap opens the Goals tab. Hidden when there are no deposits. The expense total at the top never includes deposits. Below it, an "Income this month" section lists income categories with their sums, same card style; tap opens that category's transactions. **(owner idea 2026-11-15, layout chosen by Claude)**
- History lists goal deposits together with transactions, newest first. A deposit row shows the goal, the amount and the label "Savings"; each deposit has its own trash icon to delete just that deposit (the money returns to the balance). **(owner request 2026-11-15)**
- Excel (CSV) export contains the deposits too: type "Savings", category column = goal name, same positive amount. Balance = income − savings − expenses, so savings come off the total. **(owner request 2026-11-15)**
- Deleting a goal: the user chooses in the dialog. Default "Delete goal, keep history": the goal disappears from the Goals tab, but its deposits stay in history, stats, balance and export (the goal is archived). Second choice "Delete goal and its deposits": everything is erased and the money returns to the balance. The owner left the choice to Claude; keep-history is the default because the money really was set aside. **(Claude's choice, confirm or change)**
- Swipe sideways (from the screen edge) goes back on every screen opened from another screen, on iOS and Android. **(owner request 2026-11-15)**
- Swipe between the main tabs: swipe left opens the tab on your left, swipe right the tab on your right (Today, Stats, Goals, More, left to right). Nothing happens at the first and last tab. **(owner request 2026-11-15)**
- Not in v1: accounts (cash / card), transfers, tags, receipt photos. Wallets (separate books) are in, see "Wallets".

## Wallets

Decided by the owner 2026-11-17. Layout and details chosen by Claude from the approved mockup.

- A user can have up to **4 wallets** (for example personal, business). Same limit on every plan. One subscription covers all of them.
- Each wallet is a separate book: its own transactions, categories, budgets, recurring rules, goals and deposits. Wallets never mix: no totals across wallets, no transfers between them.
- Per wallet: name, color, icon, order, budget month start day, overall monthly budget.
- For the whole account: currency, language, theme, notifications. (One currency keeps the numbers simple; a per-wallet currency can come later without breaking data.)
- Every account has at least one wallet. The first one is "Personal" (translated name until the user renames it). Existing data moves into it, so nothing changes for a user who never adds a second wallet.
- A new wallet starts with the default categories and no budgets, goals or transactions.
- The app opens on the wallet used last on this device. If that wallet is gone, it opens the first one.
- **Which wallet am I in:** a chip with the wallet's color dot and name at the top of Home, Stats and Goals; the add sheet says "In wallet: X".
- **Switch / create / edit:** tap the chip → a sheet slides up from the bottom: the wallets (current one checked, tap to switch), a pencil on each to edit name, color and icon, and "New wallet" with a count (3/4). At 4 wallets "New wallet" is replaced by "Up to 4 wallets".
- **Manage:** More → Wallets: order (move up / down), edit, export the wallet to CSV, delete.
- **Delete:** only from More → Wallets. Deletes the wallet and all its data for good. The dialog offers the CSV export first and asks the user to type the wallet's name. The last wallet cannot be deleted. When the current wallet is deleted, the app moves to the first remaining one.
- History and the CSV export cover the current wallet only.
- Enforced in the database: the 4 limit, the last-wallet rule, and that every row's wallet belongs to the same user.

## Screens

- Tabs: Today (home), Stats, Goals, More.
- Home: no wallet logo in the header after login (owner 2026-11-14); wallet chip (see "Wallets"), bell, date, period expense total, overall left, Income and Expense buttons, category cards. Tap a card → that period's transactions with edit / delete.
- Add transaction: bottom sheet; category is an icon grid with a "+" tile at the end.
- Export is a CSV file (opens in Excel and Google Sheets, Hebrew included).
- Stats: monthly / yearly, expense / income, previous / next period, donut with total in the center, legend with percent and sum, change versus the previous period.
- Goals: cards with target, saved, progress bar, deposit button.
- More: account, language, theme, currency, wallets, budget month start and overall budget (of the current wallet), notifications, history + Excel export, delete account, sign out, About (last row).
- Login and every register step: wallet illustration with moving 3D leaves. Many leaves across the app.
- Reminders: see "Notifications". The daily "log your spending" reminder is dropped (owner 2026-11-15).
- Delete account: hard delete of all data and the auth user, after confirmation.
- Online only in v1.

## About and app review

Decided by the owner 2026-11-17. No effect on any amount, budget or stat.

- **About:** the last row in More opens an About screen: the logo wallet, "Finny", two short lines on what the app is, Terms of use (read only, same text as at sign-up; the privacy policy is its section 9), Rate us, Contact, and the app version with build number at the bottom.
- **Contact:** a line with the owner's email (yonher8@gmail.com); tapping it opens a new mail. No WhatsApp for now.
- **Rate us (About):** opens the store's write-a-review page (App Store / Google Play). Shown only once the store link is set in the app config; until the app is in the stores the row is hidden.
- **Automatic review prompt:** the native in-app review dialog of iOS / Android, never our own "do you like Finny?" question first.
  - When: right after a transaction is saved (back on home), or right after a goal deposit that reaches the goal's target.
  - Only if: at least 7 days since this user first opened the app on this phone, and at least 10 transactions saved on this phone.
  - At most once every 120 days (our own limit; Apple and Google add their own limits and may still show nothing).
  - Never on first launch, mid-task or after an error. Counters are kept on the phone per user.

## Notifications

Decided by the owner 2026-11-15. No effect on any amount, budget or stat.

- Three kinds, each with its own switch (small animation) on a Notifications screen under More. The home bell opens the same screen. All default on.
- **Renewal** — sent by the server (push), so it always follows the real `expires_at`, also when the admin extended access and the app was not opened. Sent 30 days, 7 days and 1 day before expiry, and on the expiry day. `family` (no expiry) gets none. Tap opens a Renew screen: expiry date + "Contact your advisor" on WhatsApp. Sent once per kind per expiry date.
  - Sent by the daily job at 08:00 UTC (10:00 Israel in winter, 11:00 in summer). Days are counted in Israel time. **(assumed)**
  - Needs a development / store build and push credentials (Firebase for Android, Apple Developer account for iPhone). Does not work in Expo Go. iPhone starts working when the owner adds the Apple account; see `docs/notifications-setup.md`.
- **Inactivity** — scheduled by the phone itself (local, no server). "Use" = opening the app. Reminders at 19:00 on day 4, day 14 and day 24 after the last open, then silence until the next open. Light tone, three different texts.
- **Purchase detected** (Apple Pay / Google Pay → "Add this expense?" → opens the expense sheet with the amount filled, the user saves) — separate phase after this one. Android: automatic through a notification listener. iPhone: Apple does not allow it; the user sets up a Shortcuts automation once, with an in-app guide. Until then the switch shows "Soon".
- Permission: asked after the first arrival at home, with a short explanation before the system prompt. If refused, the Notifications screen shows "Open settings".
- Switches are saved per device (a new phone starts with all on). The renewal switch and the device language are also saved with the device's push token, so the server knows whether and in which language to send.
- Language: notifications use the app language. Changing the language changes them too, with nothing for the user to do.
- Signing out removes the device's push token and cancels its scheduled reminders.
- Push delivery: Firebase (free Spark plan) is used only as the delivery pipe to Android; no data is kept there. iPhone goes through Apple when the developer account exists. (owner 2026-11-16)
- **Manual send** from the admin dashboard (owner 2026-11-16), for sending by hand or testing:
  - To one active user (a "Notify" button in that user's row) or to all active users (a "Notify all" button above the list).
  - A dropdown lists every kind: renewal in a month / in a week / tomorrow / today, the three inactivity texts, and "Custom message". Purchase detection joins when it is built.
  - Custom message: a one-time title (up to 60 characters) and text (up to 200), sent as written to every device, in whatever language the admin wrote. Not saved.
  - Ready-made kinds arrive in each device's own language.
  - Resets nothing: not written to the sent log, does not move the inactivity countdown, and the automatic reminder still arrives on its day.
  - Sent even when the user switched that notification off; the dialog shows how many devices have renewal reminders off.
  - The dialog shows who will get it (users, registered devices) before sending and "sent to N devices" after. A user with no registered device gets nothing, and the dialog says so.
  - Admins only, enforced in the database. No audit log of manual sends.

## Admin web

- English, desktop first, layout as in the owner's mockup. Admins only.
- KPIs: total users, active subscribers, pending approvals, expiring soon.
- Pending approvals: approve (pick plan: paid / vip / family, and length: 1 year / 2 months) or reject.
- Users: extend access (1 year / 2 months), change plan, see status and expiry.

## Future (not built now, keep room)

- Purchase detection: see "Notifications".
- WhatsApp bot for approvals.

## Dev test users

Four users in the dev project: one admin, one active client (with sample data), one pending, one expired. Credentials are kept in the gitignored `supabase/seed/dev-users.local.md`.
