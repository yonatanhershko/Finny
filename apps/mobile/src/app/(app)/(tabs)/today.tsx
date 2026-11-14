import { budgetRemaining, type Category, percentOf } from '@finny/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeafBackground } from '@/components/nature/LeafBackground';
import { AppText } from '@/components/ui/AppText';
import { BudgetBar } from '@/components/ui/BudgetBar';
import { CategoryIcon, Icon } from '@/components/ui/Icon';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { useCategoryName, useCurrentPeriod, useDateFormat, useMoney } from '@/data/hooks';
import { useCategories, useCategoryTotals, useSettings } from '@/data/queries';
import { useTheme } from '@/theme/ThemeProvider';

export default function TodayScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const money = useMoney();
  const { dayMonth } = useDateFormat();
  const { period, today } = useCurrentPeriod();
  const settings = useSettings();
  const categories = useCategories();
  const totals = useCategoryTotals(period);

  const loading = settings.isLoading || categories.isLoading || totals.isLoading;
  const failed = settings.isError || categories.isError || totals.isError;
  const refetch = () => {
    void settings.refetch();
    void categories.refetch();
    void totals.refetch();
  };

  const spentBy = new Map((totals.data ?? []).filter((x) => x.type === 'expense').map((x) => [x.category_id, x.total]));
  const totalExpense = [...spentBy.values()].reduce((a, b) => a + b, 0);
  const totalIncome = (totals.data ?? []).filter((x) => x.type === 'income').reduce((a, x) => a + x.total, 0);
  const overall = settings.data?.overall_budget ?? null;
  const overallLeft = overall === null ? null : budgetRemaining(overall, totalExpense);

  // Show a category when it has spending this period or a budget to track.
  const cards = (categories.data ?? [])
    .filter((c) => c.type === 'expense')
    .filter((c) => (spentBy.get(c.id) ?? 0) > 0 || (c.monthly_budget !== null && !c.archived));

  return (
    <View className="flex-1 bg-background">
      <LeafBackground density="medium" topCorner />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}>
          <View className="h-11 flex-row items-center justify-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('more.reminders')}
              className="h-11 w-11 items-center justify-center"
              onPress={() => router.push('/more')}>
              <Icon name="bell-outline" size={24} tone="primary" />
            </Pressable>
          </View>

          <View className="items-center">
            <AppText weight="medium" className="text-[20px]">
              {dayMonth(today)}
            </AppText>
            <AppText tone="muted" className="text-[15px]">
              {t('today.totalExpenses')}
            </AppText>
            <AppText weight="bold" className="text-[42px] leading-[52px]">
              {money.format(totalExpense)}
            </AppText>
            {overall !== null && overallLeft !== null && (
              <AppText
                tone={overallLeft < 0 ? 'danger' : 'primary'}
                weight={overallLeft < 0 ? 'bold' : 'regular'}
                className="text-[14px]">
                {overallLeft < 0
                  ? t('today.overBy', { amount: money.format(-overallLeft) })
                  : t('today.leftOf', { left: money.format(overallLeft), total: money.format(overall) })}
              </AppText>
            )}
            {totalIncome > 0 && (
              <AppText tone="muted" className="mt-1 text-[13px]">
                {t('today.incomeThisPeriod', { amount: money.format(totalIncome) })}
              </AppText>
            )}
          </View>

          <View className="mt-4 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('today.addExpense')}
              className="min-h-[64px] flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent active:opacity-80"
              onPress={() => router.push({ pathname: '/add', params: { type: 'expense' } })}>
              <Icon name="arrow-down" tone="onAccent" />
              <AppText weight="bold" tone="onAccent" className="text-[19px]">
                {t('common.expense')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('today.addIncome')}
              className="min-h-[64px] flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80"
              onPress={() => router.push({ pathname: '/add', params: { type: 'income' } })}>
              <Icon name="arrow-up" tone="onPrimary" />
              <AppText weight="bold" tone="onPrimary" className="text-[19px]">
                {t('common.income')}
              </AppText>
            </Pressable>
          </View>

          <AppText weight="medium" className="mb-2 mt-6 text-[17px]">
            {t('today.categoriesThisPeriod')}
          </AppText>

          {loading ? (
            <Loading />
          ) : failed ? (
            <ErrorState onRetry={refetch} />
          ) : cards.length === 0 ? (
            <EmptyState text={t('today.empty')} />
          ) : (
            <View className="gap-3">
              {cards.map((category) => (
                <CategoryCard key={category.id} category={category} spent={spentBy.get(category.id) ?? 0} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CategoryCard({ category, spent }: { category: Category; spent: number }) {
  const { t } = useTranslation();
  const money = useMoney();
  const nameOf = useCategoryName();
  const budget = category.monthly_budget;
  const left = budget === null ? null : budgetRemaining(budget, spent);
  const over = left !== null && left < 0;
  const name = nameOf(category);

  const summary =
    budget === null
      ? `${name}, ${money.format(spent)}`
      : over
        ? `${name}, ${t('today.spentOf', { spent: money.format(spent), budget: money.format(budget) })}, ${t('today.overBy', { amount: money.format(-(left as number)) })}`
        : `${name}, ${t('today.spentOf', { spent: money.format(spent), budget: money.format(budget) })}, ${percentOf(spent, budget)}%`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={summary}
      onPress={() => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
      className={`rounded-xl border p-3 active:opacity-80 ${
        over ? 'border-danger bg-danger-surface' : 'border-border bg-surface'
      }`}>
      <View className="flex-row items-center gap-3">
        <CategoryIcon icon={category.icon} color={category.color} />
        <View className="flex-1">
          <AppText weight="medium" tone={over ? 'danger' : 'text'} className="text-[17px]" numberOfLines={1}>
            {name}
          </AppText>
          <AppText tone={over ? 'danger' : 'muted'} className="text-[14px]">
            {budget === null
              ? money.format(spent)
              : t('today.spentOf', { spent: money.format(spent), budget: money.format(budget) })}
          </AppText>
        </View>
        {left !== null && (
          <AppText tone={over ? 'danger' : 'primary'} weight={over ? 'bold' : 'regular'} className="text-[12px]">
            {over ? t('today.overBy', { amount: money.format(-left) }) : t('today.left', { amount: money.format(left) })}
          </AppText>
        )}
      </View>
      {budget !== null && (
        <View className="mt-3">
          <BudgetBar spent={spent} budget={budget} />
        </View>
      )}
    </Pressable>
  );
}
