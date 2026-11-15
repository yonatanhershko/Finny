import type { Category, Transaction } from '@finny/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useCategoryName, useDateFormat, useMoney } from '@/data/hooks';
import { useRowAlign } from '@/i18n';

import { AppText } from './ui/AppText';
import { CategoryIcon, Icon } from './ui/Icon';

/** One transaction line. Tap to edit; the trash button asks the parent to delete. */
export function TransactionRow({
  transaction,
  category,
  onDelete,
}: {
  transaction: Transaction;
  category: Category | undefined;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const align = useRowAlign();
  const money = useMoney();
  const nameOf = useCategoryName();
  const { dayMonthShort } = useDateFormat();
  const title = transaction.description || nameOf(category);
  const sign = transaction.type === 'income' ? '+' : '';

  return (
    <View className={`items-center rounded-lg border border-border bg-surface ${align.row}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${money.format(transaction.amount)}, ${dayMonthShort(transaction.date)}. ${t('common.edit')}`}
        onPress={() => router.push({ pathname: '/add', params: { id: transaction.id } })}
        className={`min-h-[60px] flex-1 items-center gap-3 py-2 active:opacity-70 ${align.row} ${align.he ? 'pr-3' : 'pl-3'}`}>
        <CategoryIcon icon={category?.icon ?? 'tag'} color={category?.color ?? '#8A9099'} size={38} />
        <View className="flex-1">
          <AppText className="text-[15px]" numberOfLines={1}>
            {title}
          </AppText>
          <View className={`items-center gap-1 ${align.row}`}>
            <AppText tone="muted" className="text-[12px]">
              {dayMonthShort(transaction.date)} · {nameOf(category)}
            </AppText>
            {transaction.recurring_rule_id && <Icon name="repeat" size={13} tone="muted" />}
          </View>
        </View>
        <AppText weight="medium" tone={transaction.type === 'income' ? 'success' : 'text'} className="text-[15px]">
          {sign}
          {money.format(transaction.amount)}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('common.delete')}: ${title}`}
        onPress={onDelete}
        className="h-[60px] w-11 items-center justify-center">
        <Icon name="trash-can-outline" size={20} tone="muted" />
      </Pressable>
    </View>
  );
}
