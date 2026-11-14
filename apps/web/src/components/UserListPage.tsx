"use client";

import type { AccountStatus } from "@finny/shared";
import { useState } from "react";

import { fetchProfiles, PAGE_SIZE } from "@/lib/admin-api";
import { statusLabel } from "@/lib/format";
import { useAsync } from "@/lib/use-async";

import { UserTable } from "./UserTable";
import { Button, Card, DataState } from "./ui";

const allStatuses: AccountStatus[] = ["pending_approval", "active", "expired", "rejected"];

/** Searchable, paged user list. `fixedStatus` locks it to one status. */
export function UserListPage({
  title,
  subtitle,
  fixedStatus,
  emptyText,
}: {
  title: string;
  subtitle: string;
  fixedStatus?: AccountStatus;
  emptyText: string;
}) {
  const [status, setStatus] = useState<AccountStatus | "all">(fixedStatus ?? "all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const users = useAsync(
    () =>
      fetchProfiles({
        statuses: status === "all" ? undefined : [status],
        search,
        page,
      }),
    `${status}|${search}|${page}`,
  );

  const total = users.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-text-muted">{subtitle}</p>
      </header>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            aria-label="Search by name or email"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-9 w-64 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
          {!fixedStatus && (
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AccountStatus | "all");
                setPage(0);
              }}
              className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
            >
              <option value="all">All statuses</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          )}
        </div>

        <DataState
          loading={users.loading && !users.data}
          error={users.error}
          empty={users.data?.rows.length === 0}
          emptyText={emptyText}
          onRetry={users.reload}
        />
        {!!users.data?.rows.length && (
          <UserTable users={users.data.rows} onChanged={users.reload} />
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            {total.toLocaleString("en")} {total === 1 ? "user" : "users"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span>
              Page {page + 1} of {pages}
            </span>
            <Button
              variant="ghost"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
