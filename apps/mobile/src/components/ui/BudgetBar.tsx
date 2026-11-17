import { View } from 'react-native';

import { ProgressFill } from './ProgressFill';

/**
 * Budget progress. `spent` and `budget` are integers in minor units.
 * Turns red only when spending is over the budget.
 */
export function BudgetBar({ spent, budget, introKey }: { spent: number; budget: number; introKey: string }) {
  const over = spent > budget;
  const ratio = budget > 0 ? Math.min(spent / budget, 1) : 0;

  return (
    <View
      className="h-[6px] overflow-hidden rounded-full bg-surface-muted"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}>
      <ProgressFill ratio={ratio} introKey={introKey} className={over ? 'bg-danger' : 'bg-primary'} />
    </View>
  );
}
