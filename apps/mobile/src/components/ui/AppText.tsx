import { Text, type TextProps } from 'react-native';

/**
 * All app text goes through here so the font (Rubik) and color tokens are
 * always right. Custom fonts ignore fontWeight on native, so `weight` picks
 * the font file. Color is set with `tone`, never with a text-color class,
 * so two color classes can never fight.
 */
const families = {
  regular: 'font-rubik',
  medium: 'font-rubik-medium',
  bold: 'font-rubik-bold',
} as const;

const tones = {
  text: 'text-text',
  muted: 'text-text-muted',
  primary: 'text-primary',
  onPrimary: 'text-on-primary',
  onAccent: 'text-on-accent',
  danger: 'text-danger',
  success: 'text-success',
} as const;

export type TextTone = keyof typeof tones;

export type AppTextProps = TextProps & {
  weight?: keyof typeof families;
  tone?: TextTone;
  className?: string;
};

export function AppText({ weight = 'regular', tone = 'text', className = '', ...props }: AppTextProps) {
  return <Text className={`${tones[tone]} ${families[weight]} ${className}`} {...props} />;
}
