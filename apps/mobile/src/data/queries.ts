import type {
  Category,
  CategoryTotal,
  Goal,
  GoalDeposit,
  GoalTotal,
  Period,
  RepeatFrequency,
  Transaction,
  TransactionType,
  UserSettings,
  Wallet,
} from '@finny/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { useWalletId } from './walletContext';

/**
 * All reads and writes of the user's financial data. Amounts are integers in
 * minor units everywhere. Row Level Security scopes every call to the signed-in
 * user, so no user id is sent from here. Money data is also scoped to the current
 * wallet: every key holds its id, so switching wallets never shows another wallet's rows.
 */

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

const keys = {
  settings: ['settings'] as const,
  wallets: ['wallets'] as const,
  categories: (w: string) => ['categories', w] as const,
  totals: (w: string, p: Period) => ['totals', w, p.start, p.end] as const,
  transactions: (w: string, p: Period | null, categoryId?: string) =>
    ['transactions', w, p?.start ?? 'all', p?.end ?? 'all', categoryId ?? 'all'] as const,
  /** Prefix of every goal and deposit query; invalidating it refreshes them all. */
  goals: ['goals'] as const,
  walletGoals: (w: string) => ['goals', w] as const,
};

/** After any change to transactions, every sum on screen may be stale. */
function useInvalidateMoney() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['totals'] }),
      client.invalidateQueries({ queryKey: ['transactions'] }),
    ]);
}

// ---- settings ---------------------------------------------------------------

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: async () => unwrap<UserSettings>(await supabase.from('user_settings').select('*').single()),
  });
}

export function useUpdateSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>) => {
      const current = client.getQueryData<UserSettings>(keys.settings);
      if (!current) throw new Error('settings not loaded');
      return unwrap<UserSettings>(
        await supabase.from('user_settings').update(patch).eq('user_id', current.user_id).select().single(),
      );
    },
    onSuccess: (data) => client.setQueryData(keys.settings, data),
  });
}

// ---- wallets ----------------------------------------------------------------

export function useWallets(enabled = true) {
  return useQuery({
    queryKey: keys.wallets,
    enabled,
    queryFn: async () =>
      unwrap<Wallet[]>(await supabase.from('wallets').select('*').order('sort_order').order('created_at')),
  });
}

export type WalletPatch = Partial<
  Pick<Wallet, 'name' | 'color' | 'icon' | 'sort_order' | 'month_start_day' | 'overall_budget'>
>;

export function useUpdateWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & WalletPatch) => {
      const { id, ...patch } = input;
      return unwrap<Wallet>(await supabase.from('wallets').update(patch).eq('id', id).select().single());
    },
    onSuccess: (data) =>
      client.setQueryData<Wallet[]>(keys.wallets, (list) => list?.map((w) => (w.id === data.id ? data : w))),
  });
}

/** Move one wallet to a new place in the list. */
export function useMoveWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ list, from, to }: { list: Wallet[]; from: number; to: number }) => {
      const order = [...list];
      const [moved] = order.splice(from, 1);
      order.splice(to, 0, moved);
      // Write every wallet's new index, so equal or gapped orders straighten out too.
      const changed = order.map((w, index) => ({ w, index })).filter(({ w, index }) => w.sort_order !== index);
      const results = await Promise.all(
        changed.map(({ w, index }) => supabase.from('wallets').update({ sort_order: index }).eq('id', w.id)),
      );
      for (const result of results) if (result.error) throw new Error(result.error.message);
    },
    onSettled: () => client.invalidateQueries({ queryKey: keys.wallets }),
  });
}

export class WalletLimitError extends Error {}

/** New wallet with the default categories (server side). At most 4, enforced by the database. */
export function useCreateWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color: string; icon: string }) => {
      const { data, error } = await supabase.rpc('create_wallet', {
        p_name: input.name.trim(),
        p_color: input.color,
        p_icon: input.icon,
      });
      if (error) throw error.message.includes('wallet_limit') ? new WalletLimitError() : new Error(error.message);
      return data as Wallet;
    },
    onSuccess: async (wallet) => {
      // In the list at once, so switching to it never falls back to another wallet.
      client.setQueryData<Wallet[]>(keys.wallets, (list) => (list ? [...list, wallet] : [wallet]));
      await client.invalidateQueries({ queryKey: keys.wallets });
    },
  });
}

/** Deletes a wallet and all its data for good. The database keeps the last one. */
export function useDeleteWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_wallet', { p_wallet_id: id });
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: async (id) => {
      for (const prefix of ['categories', 'totals', 'transactions', 'goals']) {
        client.removeQueries({ queryKey: [prefix, id] });
      }
      await client.invalidateQueries({ queryKey: keys.wallets });
    },
  });
}

// ---- categories -------------------------------------------------------------

export function useCategories() {
  const wallet = useWalletId();
  return useQuery({
    queryKey: keys.categories(wallet),
    queryFn: async () =>
      unwrap<Category[]>(
        await supabase
          .from('categories')
          .select('*')
          .eq('wallet_id', wallet)
          .order('sort_order')
          .order('created_at'),
      ),
  });
}

export type CategoryInput = {
  type: TransactionType;
  name: string;
  icon: string;
  color: string;
  monthly_budget?: number | null;
};

export function useSaveCategory() {
  const client = useQueryClient();
  const wallet = useWalletId();
  return useMutation({
    mutationFn: async (input: { id?: string; sort_order?: number } & Partial<CategoryInput>) => {
      const { id, ...fields } = input;
      if (id) {
        return unwrap<Category>(
          await supabase.from('categories').update(fields).eq('id', id).select().single(),
        );
      }
      if (!fields.type) throw new Error('type is required');
      return unwrap<Category>(
        await supabase
          .from('categories')
          .insert({ ...fields, type: fields.type, wallet_id: wallet, sort_order: fields.sort_order ?? 999 })
          .select()
          .single(),
      );
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['categories'] }),
  });
}

/**
 * Remove a category. One that has transactions is archived instead (hidden
 * from pickers, history and totals keep it); an unused one is deleted.
 */
export function useRemoveCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const used = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);
      if (used.error) throw new Error(used.error.message);
      if ((used.count ?? 0) > 0) {
        unwrap(await supabase.from('categories').update({ archived: true }).eq('id', id).select());
        return 'archived' as const;
      }
      const removed = await supabase.from('categories').delete().eq('id', id);
      if (removed.error) {
        // still referenced by a repeat rule: archive
        unwrap(await supabase.from('categories').update({ archived: true }).eq('id', id).select());
        return 'archived' as const;
      }
      return 'deleted' as const;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ---- totals and transactions ------------------------------------------------

export function useCategoryTotals(period: Period) {
  const wallet = useWalletId();
  return useQuery({
    queryKey: keys.totals(wallet, period),
    queryFn: async () =>
      unwrap<CategoryTotal[]>(
        await supabase.rpc('category_totals', { p_wallet_id: wallet, p_from: period.start, p_to: period.end }),
      ),
  });
}

export function useTransactions(period: Period | null, categoryId?: string) {
  const wallet = useWalletId();
  return useQuery({
    queryKey: keys.transactions(wallet, period, categoryId),
    queryFn: async () => {
      let query = supabase.from('transactions').select('*').eq('wallet_id', wallet);
      if (period) query = query.gte('date', period.start).lte('date', period.end);
      if (categoryId) query = query.eq('category_id', categoryId);
      return unwrap<Transaction[]>(
        await query.order('date', { ascending: false }).order('created_at', { ascending: false }).limit(2000),
      );
    },
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ['transactions', 'one', id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<Transaction>(await supabase.from('transactions').select('*').eq('id', id as string).single()),
  });
}

export type Repeat =
  | { kind: 'none' }
  | { kind: 'recurring'; frequency: RepeatFrequency }
  | { kind: 'installments'; count: number };

export type TransactionInput = {
  type: TransactionType;
  /** minor units. For installments this is the full total. */
  amount: number;
  description: string;
  date: string;
  category_id: string;
  repeat: Repeat;
};

export function useAddTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const description = input.description.trim();
      if (input.repeat.kind === 'recurring') {
        unwrap(
          await supabase.rpc('create_recurring', {
            p_type: input.type,
            p_category_id: input.category_id,
            p_description: description,
            p_amount: input.amount,
            p_frequency: input.repeat.frequency,
            p_start_date: input.date,
          }),
        );
      } else if (input.repeat.kind === 'installments') {
        unwrap(
          await supabase.rpc('create_installments', {
            p_type: input.type,
            p_category_id: input.category_id,
            p_description: description,
            p_total: input.amount,
            p_count: input.repeat.count,
            p_first_date: input.date,
          }),
        );
      } else {
        unwrap(
          await supabase
            .from('transactions')
            .insert({
              type: input.type,
              amount: input.amount,
              description,
              date: input.date,
              category_id: input.category_id,
            })
            .select(),
        );
      }
    },
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      amount: number;
      description: string;
      date: string;
      category_id: string;
    }) => {
      const { id, ...fields } = input;
      unwrap(
        await supabase
          .from('transactions')
          .update({ ...fields, description: fields.description.trim() })
          .eq('id', id)
          .select(),
      );
    },
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await supabase.from('transactions').delete().eq('id', id).select());
    },
    onSuccess: invalidate,
  });
}

/** Stop a recurring rule: no new occurrences. Past transactions stay. */
export function useStopRecurring() {
  return useMutation({
    mutationFn: async (ruleId: string) => {
      unwrap(await supabase.from('recurring_rules').update({ active: false }).eq('id', ruleId).select());
    },
  });
}

/** Adds the recurring transactions that came due since the last visit. */
export async function materializeRecurring(): Promise<number> {
  const { data, error } = await supabase.rpc('materialize_recurring');
  return error ? 0 : (data ?? 0);
}

// ---- goals ------------------------------------------------------------------

export type GoalWithSaved = Goal & { saved: number };

export function useGoals() {
  const wallet = useWalletId();
  return useQuery({
    queryKey: keys.walletGoals(wallet),
    queryFn: async (): Promise<GoalWithSaved[]> => {
      // goal_totals sums every goal of the user; only this wallet's goals are listed.
      const [goals, totals] = await Promise.all([
        supabase.from('goals').select('*').eq('wallet_id', wallet).order('created_at'),
        supabase.rpc('goal_totals'),
      ]);
      const saved = new Map(unwrap<GoalTotal[]>(totals).map((t) => [t.goal_id, t.saved]));
      return unwrap<Goal[]>(goals).map((g) => ({ ...g, saved: saved.get(g.id) ?? 0 }));
    },
  });
}

/** Money deposited per goal inside one budget period. Never part of expense totals. */
export function useGoalDepositsInPeriod(period: Period) {
  const wallet = useWalletId();
  return useQuery({
    // Under the 'goals' key so a new deposit refreshes it.
    queryKey: [...keys.walletGoals(wallet), 'deposits', period.start, period.end] as const,
    queryFn: async (): Promise<Map<string, number>> => {
      const rows = unwrap<Pick<GoalDeposit, 'goal_id' | 'amount'>[]>(
        await supabase
          .from('goal_deposits')
          .select('goal_id, amount')
          .eq('wallet_id', wallet)
          .gte('date', period.start)
          .lte('date', period.end)
          .limit(2000),
      );
      const sums = new Map<string, number>();
      for (const r of rows) sums.set(r.goal_id, (sums.get(r.goal_id) ?? 0) + r.amount);
      return sums;
    },
  });
}

export function useSaveGoal() {
  const client = useQueryClient();
  const wallet = useWalletId();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; target_amount: number; icon?: string }) => {
      const { id, ...fields } = input;
      const name = fields.name.trim();
      if (id) {
        unwrap(await supabase.from('goals').update({ ...fields, name }).eq('id', id).select());
      } else {
        unwrap(await supabase.from('goals').insert({ ...fields, name, wallet_id: wallet }).select());
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.goals }),
  });
}

/**
 * Delete a goal. `keep` archives it: gone from the Goals tab, deposits stay in history,
 * stats and balance. `erase` removes the goal and every deposit for good.
 */
export function useDeleteGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; mode: 'keep' | 'erase' }) => {
      if (input.mode === 'keep') {
        unwrap(await supabase.from('goals').update({ archived_at: new Date().toISOString() }).eq('id', input.id).select());
      } else {
        unwrap(await supabase.from('goals').delete().eq('id', input.id).select());
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.goals }),
  });
}

/** Every deposit, newest first. Archived goals' deposits are included. */
export function useAllDeposits() {
  const wallet = useWalletId();
  return useQuery({
    queryKey: [...keys.walletGoals(wallet), 'deposits', 'all'] as const,
    queryFn: async () =>
      unwrap<GoalDeposit[]>(
        await supabase
          .from('goal_deposits')
          .select('*')
          .eq('wallet_id', wallet)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(2000),
      ),
  });
}

/** Delete one deposit. The money returns to the balance. */
export function useDeleteDeposit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await supabase.from('goal_deposits').delete().eq('id', id).select());
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useDeposit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { goal_id: string; amount: number }) => {
      unwrap(await supabase.from('goal_deposits').insert(input).select());
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.goals }),
  });
}
