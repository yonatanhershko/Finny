import type { AccessPlan, AccountStatus } from "@finny/shared";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: string | null): string {
  return value ? dateFormat.format(new Date(value)) : "—";
}

export const statusLabel: Record<AccountStatus, string> = {
  pending_approval: "Pending",
  active: "Active",
  expired: "Expired",
  rejected: "Rejected",
};

export const planLabel: Record<AccessPlan, string> = {
  paid: "Paid (1 year)",
  vip: "VIP (1 year, no payment)",
  family: "Family (no expiry)",
};

export const planShort: Record<AccessPlan, string> = {
  paid: "Paid",
  vip: "VIP",
  family: "Family",
};
