import { TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

/** Labeled text input with an inline error line. */
export function TextField({ label, error, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View className="gap-1">
      <AppText tone="muted" className="text-[13px]">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        className={`min-h-[52px] rounded-lg border bg-surface px-4 font-rubik text-[16px] text-text outline-none ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...props}
      />
      {error ? (
        <AppText tone="danger" className="text-[13px]" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
