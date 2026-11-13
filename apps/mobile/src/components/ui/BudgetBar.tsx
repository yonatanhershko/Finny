import { View } from 'react-native';

/**
 * Budget progress. `spent` and `budget` are integers in minor units.
 * Turns red only when spending is over the budget.
 */
export function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const over = spent > budget;
  const ratio = budget > 0 ? Math.min(spent / budget, 1) : 0;

  return (
    <View
      className="h-[6px] overflow-hidden rounded-full bg-surface-muted"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}>
      <View
        className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-primary'}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </View>
  );
}
