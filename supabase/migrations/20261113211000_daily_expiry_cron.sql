-- Runs every day at 00:05 UTC: active accounts past their expiry become expired.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'finny-expire-subscriptions',
  '5 0 * * *',
  $$select public.expire_subscriptions()$$
);
