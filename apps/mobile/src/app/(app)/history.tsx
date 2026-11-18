import type { GoalDeposit } from '@finny/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
import { DepositRow } from '@/components/DepositRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { useCategoryName } from '@/data/hooks';
import type { ListedTransaction } from '@/data/outbox';
import { useAllDeposits, useCategories, useDeleteDeposit, useGoals, useTransactions } from '@/data/queries';
import { buildCsv, shareCsv } from '@/lib/export';

/** Every transaction and goal deposit, newest first, with export to a spreadsheet file. */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const nameOf = useCategoryName();
  const categories = useCategories();
  const transactions = useTransactions(null);
  const deposits = useAllDeposits();
  const goals = useGoals();
  const removeDeposit = useDeleteDeposit();
  const [deletingDeposit, setDeletingDeposit] = useState<GoalDeposit | null>(null);
  const [deleting, setDeleting] = useState<ListedTransaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const byId = new Map((categories.data ?? []).map((c) => [c.id, c]));
  const goalById = new Map((goals.data ?? []).map((g) => [g.id, g]));

  // One list, newest first: transactions and deposits interleaved by date.
  const entries = [
    ...(transactions.data ?? []).map((tx) => ({ kind: 'tx' as const, date: tx.date, at: tx.created_at, tx })),
    ...(deposits.data ?? []).map((d) => ({ kind: 'deposit' as const, date: d.date, at: d.created_at, d })),
  ].sort((a, b) => (a.date === b.date ? b.at.localeCompare(a.at) : b.date.localeCompare(a.date)));

  const exportAll = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const csv = buildCsv(
        // Ones the server refused are not part of the books.
        (transactions.data ?? []).filter((tx) => tx.sync !== 'rejected'),
        deposits.data ?? [],
        (id) => nameOf(byId.get(id)),
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
      const shared = await shareCsv(csv, 'finny-transactions.csv');
      setMessage(shared ? t('export.done') : t('export.unavailable'));
    } catch {
      setMessage(t('export.failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen leaves="low" scroll className="px-5 pb-8 pt-2">
      <ScreenHeader title={t('more.history')} />
      <Button
        label={t('export.button')}
        variant="outline"
        onPress={exportAll}
        loading={exporting}
        disabled={entries.length === 0}
      />
      {message && (
        <AppText tone="muted" className="mt-2 text-center text-[13px]" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      )}
      <View className="mt-4">
        {transactions.isLoading || categories.isLoading || deposits.isLoading ? (
          <Loading />
        ) : transactions.isError || deposits.isError ? (
          <ErrorState
            onRetry={() => {
              void transactions.refetch();
              void deposits.refetch();
            }}
          />
        ) : entries.length === 0 ? (
          // Offline and never loaded on this phone, or really empty.
          <EmptyState text={t(transactions.data ? 'transactions.empty' : 'offline.notLoaded')} />
        ) : (
          <View className="gap-2">
            {entries.map((entry) =>
              entry.kind === 'tx' ? (
                <TransactionRow
                  key={`t-${entry.tx.id}`}
                  transaction={entry.tx}
                  category={byId.get(entry.tx.category_id)}
                  onDelete={() => setDeleting(entry.tx)}
                />
              ) : (
                <DepositRow
                  key={`d-${entry.d.id}`}
                  deposit={entry.d}
                  goal={goalById.get(entry.d.goal_id)}
                  onDelete={() => setDeletingDeposit(entry.d)}
                />
              ),
            )}
          </View>
        )}
      </View>
      <DeleteTransactionDialog transaction={deleting} onClose={() => setDeleting(null)} />
      <Dialog
        visible={!!deletingDeposit}
        title={t('goals.depositDeleteTitle')}
        onClose={() => setDeletingDeposit(null)}
        actions={[
          {
            label: t('common.delete'),
            variant: 'accent',
            loading: removeDeposit.isPending,
            onPress: async () => {
              if (deletingDeposit) await removeDeposit.mutateAsync(deletingDeposit.id).catch(() => undefined);
              setDeletingDeposit(null);
            },
          },
          { label: t('common.cancel'), variant: 'outline', onPress: () => setDeletingDeposit(null) },
        ]}>
        <AppText className="text-[15px]">{t('goals.depositDeleteBody')}</AppText>
      </Dialog>
    </Screen>
  );
}
