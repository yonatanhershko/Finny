import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const tones = {
  text: 'text',
  muted: 'textMuted',
  primary: 'primary',
  onPrimary: 'onPrimary',
  onAccent: 'onAccent',
  danger: 'danger',
} as const;

/** Decorative by default: give the parent control the accessibility label. */
export function Icon({
  name,
  size = 22,
  tone = 'text',
  color,
}: {
  name: string;
  size?: number;
  tone?: keyof typeof tones;
  /** Raw color, for category icons that carry their own color. */
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <MaterialCommunityIcons
      name={name as IconName}
      size={size}
      color={color ?? colors[tones[tone]]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

/** Round tinted badge with a category's icon in its color. */
export function CategoryIcon({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        // the category color at ~18% opacity
        backgroundColor: `${color}2E`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={icon} size={size * 0.52} color={color} />
    </View>
  );
}
