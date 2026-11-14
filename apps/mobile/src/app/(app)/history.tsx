import type { Transaction } from '@finny/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { useCategoryName } from '@/data/hooks';
import { useCategories, useTransactions } from '@/data/queries';
import { buildCsv, shareCsv } from '@/lib/export';

/** Every transaction, newest first, with export to a spreadsheet file. */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const nameOf = useCategoryName();
  const categories = useCategories();
  const transactions = useTransactions(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const byId = new Map((categories.data ?? []).map((c) => [c.id, c]));

  const exportAll = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const csv = buildCsv(transactions.data ?? [], (id) => nameOf(byId.get(id)), {
        headers: {
          date: t('export.date'),
          type: t('export.type'),
          category: t('export.category'),
          description: t('export.description'),
          amount: t('export.amount'),
        },
        income: t('common.income'),
        expense: t('common.expense'),
      });
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
        disabled={!transactions.data?.length}
      />
      {message && (
        <AppText tone="muted" className="mt-2 text-center text-[13px]" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      )}
      <View className="mt-4">
        {transactions.isLoading || categories.isLoading ? (
          <Loading />
        ) : transactions.isError ? (
          <ErrorState onRetry={() => void transactions.refetch()} />
        ) : transactions.data?.length === 0 ? (
          <EmptyState text={t('transactions.empty')} />
        ) : (
          <View className="gap-2">
            {transactions.data?.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                category={byId.get(tx.category_id)}
                onDelete={() => setDeleting(tx)}
              />
            ))}
          </View>
        )}
      </View>
      <DeleteTransactionDialog transaction={deleting} onClose={() => setDeleting(null)} />
    </Screen>
  );
}
