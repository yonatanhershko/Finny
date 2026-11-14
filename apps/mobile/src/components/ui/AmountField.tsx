import { currencySymbol } from '@finny/shared';
import { TextInput, View } from 'react-native';

import { useMoney } from '@/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

/** Keep only what can become a valid amount: digits and one dot, two decimals. */
export function cleanAmountInput(raw: string): string {
  const cleaned = raw.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  const trimmedWhole = whole.slice(0, 9);
  return rest.length === 0 ? trimmedWhole : `${trimmedWhole}.${rest.join('').slice(0, 2)}`;
}

/** Big numeric amount input with the currency sign. Value is the typed string. */
export function AmountField({
  value,
  onChangeText,
  label,
  autoFocus,
  size = 'large',
}: {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  autoFocus?: boolean;
  size?: 'large' | 'normal';
}) {
  const { colors } = useTheme();
  const { currency } = useMoney();
  const large = size === 'large';
  return (
    <View
      className={`flex-row items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 ${
        large ? 'min-h-[68px]' : 'min-h-[52px]'
      }`}>
      <AppText weight="bold" className={large ? 'text-[30px]' : 'text-[18px]'}>
        {currencySymbol[currency]}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={(text) => onChangeText(cleanAmountInput(text))}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        className={`min-w-[80px] font-rubik-bold text-text outline-none ${large ? 'text-[34px]' : 'text-[18px]'}`}
        style={{ textAlign: 'left' }}
      />
    </View>
  );
}
