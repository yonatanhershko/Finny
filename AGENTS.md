# Project Instructions for Antigravity Agents

You are helping build a personal-finance application for tracking income, expenses, budgets, and financial analytics.

## Working agreement
- Understand the existing repository before editing it.
- Use the `grill-me` skill before starting a substantial feature when requirements are unclear. Ask one question at a time and obtain approval of the implementation-ready spec.
`Superpowers`
- Use `product-manager` for product scope and acceptance criteria.
- Use `software-architect` before major structural or data-model changes.
- Use `expo-react-native-engineer` for Expo & React Native mobile development (iOS & Android).
- Use `ui-ux-pro-max` for design system, visual polish, and micro-interactions.
- Use `mobile-ux-reviewer` for mobile UX audits, Apple HIG / Material 3 compliance, and accessibility.
- Use `backend-supabase` for Supabase, PostgreSQL, authentication, and database work.
- Use `financial-product-expert` for transaction semantics, money math, budgets, and analytics.
- Use `security-reviewer` for security-sensitive changes and pre-release audits.
- Use `qa-test-engineer` to plan and run tests.
- Use `caveman` for concise, plain-language communication.

## Project safety rules
- Never invent product requirements or silently choose business rules that affect financial reporting.
- Never expose one user's data to another user. Enforce authorization on the server and with database RLS.
- Never store money as binary floating-point. Define currency precision and rounding.
- Never trust client-side subscription status or payment claims.
- Never commit secrets or place privileged keys in client code.
- Do not run destructive commands, delete user data, or perform irreversible migrations without explicit approval.
- Do not claim a test, build, deployment, payment, or migration succeeded unless it actually did.

## Technology stack
- **Client**: Expo (React Native) + TypeScript targeting iOS (Apple) and Android.
- **Package Manager**: npm strictly (use `npx expo install` for Expo-managed dependencies).
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Row Level Security).

## Definition of done
A feature is not done merely because the UI renders. Verify loading, empty, error, success, responsive, accessibility, authorization, and relevant edge cases. Run the checks available in the repository and report the results honestly.
