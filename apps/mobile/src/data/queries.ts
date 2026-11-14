import type {
  Category,
  CategoryTotal,
  Goal,
  GoalTotal,
  Period,
  RepeatFrequency,
  Transaction,
  TransactionType,
  UserSettings,
} from '@finny/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * All reads and writes of the user's financial data. Amounts are integers in
 * minor units everywhere. Row Level Security scopes every call to the signed-in
 * user, so no user id is sent from here.
 */

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

const keys = {
  settings: ['settings'] as const,
  categories: ['categories'] as const,
  totals: (p: Period) => ['totals', p.start, p.end] as const,
  transactions: (p: Period | null, categoryId?: string) =>
    ['transactions', p?.start ?? 'all', p?.end ?? 'all', categoryId ?? 'all'] as const,
  goals: ['goals'] as const,
  goalTotals: ['goalTotals'] as const,
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

// ---- categories -------------------------------------------------------------

export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: async () =>
      unwrap<Category[]>(
        await supabase.from('categories').select('*').order('sort_order').order('created_at'),
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
          .insert({ ...fields, type: fields.type, sort_order: fields.sort_order ?? 999 })
          .select()
          .single(),
      );
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.categories }),
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
    onSuccess: () => client.invalidateQueries({ queryKey: keys.categories }),
  });
}

// ---- totals and transactions ------------------------------------------------

export function useCategoryTotals(period: Period) {
  return useQuery({
    queryKey: keys.totals(period),
    queryFn: async () =>
      unwrap<CategoryTotal[]>(
        await supabase.rpc('category_totals', { p_from: period.start, p_to: period.end }),
      ),
  });
}

export function useTransactions(period: Period | null, categoryId?: string) {
  return useQuery({
    queryKey: keys.transactions(period, categoryId),
    queryFn: async () => {
      let query = supabase.from('transactions').select('*');
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
  return useQuery({
    queryKey: keys.goals,
    queryFn: async (): Promise<GoalWithSaved[]> => {
      const [goals, totals] = await Promise.all([
        supabase.from('goals').select('*').order('created_at'),
        supabase.rpc('goal_totals'),
      ]);
      const saved = new Map(unwrap<GoalTotal[]>(totals).map((t) => [t.goal_id, t.saved]));
      return unwrap<Goal[]>(goals).map((g) => ({ ...g, saved: saved.get(g.id) ?? 0 }));
    },
  });
}

export function useSaveGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; target_amount: number; icon?: string }) => {
      const { id, ...fields } = input;
      const name = fields.name.trim();
      if (id) {
        unwrap(await supabase.from('goals').update({ ...fields, name }).eq('id', id).select());
      } else {
        unwrap(await supabase.from('goals').insert({ ...fields, name }).select());
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.goals }),
  });
}

export function useDeleteGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await supabase.from('goals').delete().eq('id', id).select());
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
