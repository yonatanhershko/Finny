import type { Category, Goal, GoalDeposit, Transaction, Wallet } from '@kaspilo/shared';
import { useTranslation } from 'react-i18next';

import { useCategoryName, useWalletName } from '@/data/hooks';
import { supabase } from '@/lib/supabase';

import { buildCsv, shareCsv } from './export';

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Exports one wallet (any, not only the current one) to a CSV file and opens the
 * share sheet. Resolves false when sharing is not possible on this device.
 */
export function useExportWallet() {
  const { t } = useTranslation();
  const categoryName = useCategoryName();
  const walletName = useWalletName();
  return async (wallet: Wallet): Promise<boolean> => {
    const [categories, transactions, deposits, goals] = await Promise.all([
      rows<Category>(supabase.from('categories').select('*').eq('wallet_id', wallet.id)),
      rows<Transaction>(
        supabase.from('transactions').select('*').eq('wallet_id', wallet.id).order('date', { ascending: false }).limit(5000),
      ),
      rows<GoalDeposit>(supabase.from('goal_deposits').select('*').eq('wallet_id', wallet.id).limit(5000)),
      rows<Goal>(supabase.from('goals').select('*').eq('wallet_id', wallet.id)),
    ]);
    const byId = new Map(categories.map((c) => [c.id, c]));
    const goalById = new Map(goals.map((g) => [g.id, g]));
    const csv = buildCsv(
      transactions,
      deposits,
      (id) => categoryName(byId.get(id)),
      (id) => goalById.get(id)?.name ?? t('goals.savings'),
      {
        headers: {
          date: t('export.date'),
          type: t('export.type'),
          category: t('export.category'),
          description: t('export.description'),
          amount: t('export.amount'),
        },
        income: t('common.income'),
        expense: t('common.expense'),
        savings: t('goals.savings'),
      },
    );
    const safe = walletName(wallet).replace(/[\\/:*?"<>|\s]+/g, '-');
    return shareCsv(csv, `kaspilo-${safe}.csv`);
  };
}
