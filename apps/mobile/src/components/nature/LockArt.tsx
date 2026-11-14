import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

/** Padlock for the locked screen, as in the owner's pending-approval mockup. */
export function LockArt({ size = 96 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Path
        d="M28 44 V32 a20 20 0 0 1 40 0 V44"
        fill="none"
        stroke={colors.primary}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Rect x={16} y={42} width={64} height={46} rx={10} fill={colors.primary} />
      <Circle cx={48} cy={62} r={7} fill={colors.background} />
      <Rect x={45} y={64} width={6} height={13} rx={3} fill={colors.background} />
    </Svg>
  );
}
