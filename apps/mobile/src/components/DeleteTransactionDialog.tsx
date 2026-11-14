import type { Transaction } from '@finny/shared';
import { useTranslation } from 'react-i18next';

import { useMoney } from '@/data/hooks';
import { useDeleteTransaction } from '@/data/queries';

import { AppText } from './ui/AppText';
import { Dialog } from './ui/Dialog';

export function DeleteTransactionDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const money = useMoney();
  const remove = useDeleteTransaction();
  return (
    <Dialog
      visible={!!transaction}
      title={t('transactions.deleteTitle')}
      onClose={onClose}
      actions={[
        {
          label: t('common.delete'),
          variant: 'accent',
          loading: remove.isPending,
          onPress: async () => {
            if (transaction) await remove.mutateAsync(transaction.id).catch(() => undefined);
            onClose();
          },
        },
        { label: t('common.cancel'), variant: 'outline', onPress: onClose },
      ]}>
      <AppText className="text-[15px]">
        {transaction ? `${transaction.description || ''} ${money.format(transaction.amount)}`.trim() : ''}
      </AppText>
    </Dialog>
  );
}
