import { currencySymbol } from '@finny/shared';
import { type ComponentRef, useRef } from 'react';
import { Pressable, TextInput } from 'react-native';

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
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const large = size === 'large';
  const fontSize = large ? (value.length <= 6 ? 34 : value.length <= 8 ? 29 : 25) : 18;
  const signSize = large ? Math.round(fontSize * 0.88) : 18;
  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      // The sign is always left of the number, in Hebrew and English, on every device.
      style={{ direction: 'ltr' }}
      className={`flex-row items-center justify-start gap-2 rounded-lg border border-border bg-surface px-4 ${
        large ? 'min-h-[68px]' : 'min-h-[52px]'
      }`}>
      <AppText weight="bold" style={{ fontSize: signSize, lineHeight: Math.round(signSize * 1.25) }}>
        {currencySymbol[currency]}
      </AppText>
      <TextInput
        ref={input}
        accessibilityLabel={label}
        value={value}
        onChangeText={(text) => onChangeText(cleanAmountInput(text))}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        // Numbers always start at the left, right after the sign, in both languages.
        className="min-w-0 flex-1 font-rubik-bold text-text outline-none"
        style={{ fontSize, paddingVertical: 0, textAlign: 'left', writingDirection: 'ltr' }}
      />
    </Pressable>
  );
}
