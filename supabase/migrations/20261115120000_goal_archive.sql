-- Deleting a goal keeps its deposits in history, stats and export (owner request 2026-11-15).
-- The goal is archived: hidden from the Goals tab, its deposits stay. A hard delete
-- (cascade) is still available when the user also wants the deposits erased.
alter table public.goals add column archived_at timestamptz;
