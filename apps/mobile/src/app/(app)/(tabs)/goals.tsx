import { parseAmount, percentOf } from '@finny/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AmountField } from '@/components/ui/AmountField';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { TextField } from '@/components/ui/TextField';
import { useMoney } from '@/data/hooks';
import { type GoalWithSaved, useDeleteGoal, useDeposit, useGoals, useSaveGoal } from '@/data/queries';

const GOAL_ICONS = ['flag', 'airplane', 'chart-line', 'home', 'car', 'school', 'beach', 'piggy-bank', 'gift', 'laptop'];

export default function GoalsScreen() {
  const { t } = useTranslation();
  const goals = useGoals();
  const [creating, setCreating] = useState(false);
  const [depositFor, setDepositFor] = useState<GoalWithSaved | null>(null);
  const [deleting, setDeleting] = useState<GoalWithSaved | null>(null);
  const remove = useDeleteGoal();

  return (
    <Screen leaves="low" scroll className="px-5 pb-8 pt-3">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="w-11" />
        <AppText weight="bold" className="text-[20px]" accessibilityRole="header">
          {t('goals.title')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('goals.add')}
          className="h-11 w-11 items-center justify-center"
          onPress={() => setCreating(true)}>
          <Icon name="plus" size={26} tone="primary" />
        </Pressable>
      </View>

      {goals.isLoading ? (
        <Loading />
      ) : goals.isError ? (
        <ErrorState onRetry={() => void goals.refetch()} />
      ) : goals.data?.length === 0 ? (
        <View className="items-center gap-4">
          <EmptyState text={t('goals.empty')} />
          <Button label={t('goals.add')} onPress={() => setCreating(true)} className="self-stretch" />
        </View>
      ) : (
        <View className="gap-4">
          {goals.data?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDeposit={() => setDepositFor(goal)} onDelete={() => setDeleting(goal)} />
          ))}
        </View>
      )}

      {creating && <GoalDialog onClose={() => setCreating(false)} />}
      {depositFor && <DepositDialog goal={depositFor} onClose={() => setDepositFor(null)} />}
      <Dialog
        visible={!!deleting}
        title={t('goals.deleteTitle', { name: deleting?.name ?? '' })}
        onClose={() => setDeleting(null)}
        actions={[
          {
            label: t('common.delete'),
            variant: 'accent',
            loading: remove.isPending,
            onPress: async () => {
              if (deleting) await remove.mutateAsync(deleting.id).catch(() => undefined);
              setDeleting(null);
            },
          },
          { label: t('common.cancel'), variant: 'outline', onPress: () => setDeleting(null) },
        ]}>
        <AppText className="text-[15px]">{t('goals.deleteBody')}</AppText>
      </Dialog>
    </Screen>
  );
}

function GoalCard({ goal, onDeposit, onDelete }: { goal: GoalWithSaved; onDeposit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const money = useMoney();
  const percent = Math.min(100, Math.floor(percentOf(goal.saved, goal.target_amount)));
  const reached = goal.saved >= goal.target_amount;

  return (
    <View className="rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <AppText weight="bold" className="text-[19px]">
            {goal.name}
          </AppText>
          <AppText tone="muted" className="text-[15px]">
            {t('goals.target', { amount: money.format(goal.target_amount) })}
          </AppText>
        </View>
        <Icon name={goal.icon} size={40} tone="primary" />
      </View>

      <View
        className="mt-3 h-[8px] overflow-hidden rounded-full bg-surface-muted"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View className={`h-full rounded-full ${reached ? 'bg-success' : 'bg-primary'}`} style={{ width: `${percent}%` }} />
      </View>
      <View className="mt-2 flex-row justify-between">
        <AppText className="text-[15px]">{t('goals.saved', { amount: money.format(goal.saved) })}</AppText>
        <AppText weight="medium" className="text-[15px]">
          {percent}%
        </AppText>
      </View>

      <Button label={t('goals.deposit')} onPress={onDeposit} className="mt-3" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('goals.deleteTitle', { name: goal.name })}
        onPress={onDelete}
        className="mt-1 min-h-[44px] items-center justify-center">
        <AppText tone="muted" className="text-[13px]">
          {t('common.delete')}
        </AppText>
      </Pressable>
    </View>
  );
}

function GoalDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const save = useSaveGoal();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('flag');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const amount = parseAmount(target);
    if (name.trim().length === 0) return setError(t('goals.errors.name'));
    if (amount === null) return setError(t('goals.errors.target'));
    try {
      await save.mutateAsync({ name, target_amount: amount, icon });
      onClose();
    } catch {
      setError(t('common.errorGeneric'));
    }
  };

  return (
    <Dialog
      visible
      title={t('goals.add')}
      onClose={onClose}
      actions={[
        { label: t('common.save'), onPress: submit, loading: save.isPending },
        { label: t('common.cancel'), variant: 'outline', onPress: onClose },
      ]}>
      <TextField label={t('goals.name')} value={name} onChangeText={setName} maxLength={60} />
      <View>
        <AppText tone="muted" className="mb-1 text-[13px]">
          {t('goals.targetAmount')}
        </AppText>
        <AmountField value={target} onChangeText={setTarget} label={t('goals.targetAmount')} size="normal" />
      </View>
      <View className="flex-row flex-wrap gap-1">
        {GOAL_ICONS.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={item}
            accessibilityState={{ selected: item === icon }}
            onPress={() => setIcon(item)}
            className={`h-11 w-11 items-center justify-center rounded-full border ${
              item === icon ? 'border-primary bg-surface' : 'border-transparent'
            }`}>
            <Icon name={item} tone={item === icon ? 'primary' : 'muted'} />
          </Pressable>
        ))}
      </View>
      {error && (
        <AppText tone="danger" className="text-[14px]">
          {error}
        </AppText>
      )}
    </Dialog>
  );
}

function DepositDialog({ goal, onClose }: { goal: GoalWithSaved; onClose: () => void }) {
  const { t } = useTranslation();
  const deposit = useDeposit();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const minor = parseAmount(amount);
    if (minor === null) return setError(t('add.errors.amount'));
    try {
      await deposit.mutateAsync({ goal_id: goal.id, amount: minor });
      onClose();
    } catch {
      setError(t('common.errorGeneric'));
    }
  };

  return (
    <Dialog
      visible
      title={t('goals.depositTitle', { name: goal.name })}
      onClose={onClose}
      actions={[
        { label: t('goals.deposit'), onPress: submit, loading: deposit.isPending },
        { label: t('common.cancel'), variant: 'outline', onPress: onClose },
      ]}>
      <AmountField value={amount} onChangeText={setAmount} label={t('add.amount')} autoFocus />
      <AppText tone="muted" className="text-[13px]">
        {t('goals.depositNote')}
      </AppText>
      {error && (
        <AppText tone="danger" className="text-[14px]">
          {error}
        </AppText>
      )}
    </Dialog>
  );
}
