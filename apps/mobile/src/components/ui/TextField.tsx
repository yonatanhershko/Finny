import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

import { useLanguage } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon } from './Icon';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

/** Labeled text input with an inline error line. */
export function TextField({ label, error, secureTextEntry, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // Typed text follows the language: Hebrew starts at the right, English at the left.
  const he = useLanguage() === 'he';
  const direction = { textAlign: he ? 'right' : 'left', writingDirection: he ? 'rtl' : 'ltr' } as const;
  const [revealed, setRevealed] = useState(false);
  const borderClass = error ? 'border-danger' : 'border-border';

  return (
    <View className="gap-1">
      <AppText tone="muted" className="text-[13px]">
        {label}
      </AppText>
      {secureTextEntry ? (
        <View
          className={`min-h-[52px] flex-row items-center rounded-lg border bg-surface ps-4 ${borderClass}`}>
          <TextInput
            accessibilityLabel={label}
            placeholderTextColor={colors.textMuted}
            className="min-h-[52px] flex-1 font-rubik text-[16px] text-text outline-none"
            secureTextEntry={!revealed}
            {...props}
            style={[direction, props.style]}
          />
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('common.hidePassword') : t('common.showPassword')}
            hitSlop={6}
            className="h-[52px] w-12 items-center justify-center">
            <Icon name={revealed ? 'eye-off-outline' : 'eye-outline'} tone="muted" />
          </Pressable>
        </View>
      ) : (
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          className={`min-h-[52px] rounded-lg border bg-surface px-4 font-rubik text-[16px] text-text outline-none ${borderClass}`}
          {...props}
          style={[direction, props.style]}
        />
      )}
      {error ? (
        <AppText tone="danger" className="text-[13px]" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
