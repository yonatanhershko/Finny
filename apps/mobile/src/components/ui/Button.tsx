import { type ReactNode } from 'react';
import { ActivityIndicator, type PressableProps, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { PressScale } from './PressScale';

const variants = {
  primary: { box: 'bg-primary', tone: 'onPrimary' },
  accent: { box: 'bg-accent', tone: 'onAccent' },
  outline: { box: 'bg-surface border border-border', tone: 'text' },
} as const;

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: keyof typeof variants;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const v = variants[variant];
  const spinnerColor =
    variant === 'primary' ? colors.onPrimary : variant === 'accent' ? colors.onAccent : colors.text;

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || loading, busy: loading }}
      disabled={disabled || loading}
      className={`min-h-[52px] flex-row items-center justify-center rounded-lg px-5 active:opacity-80 ${v.box} ${disabled ? 'opacity-50' : ''} ${className}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <AppText weight="medium" tone={v.tone} className="text-[17px]">
            {label}
          </AppText>
        </View>
      )}
    </PressScale>
  );
}
