import Svg, { Circle, Path } from 'react-native-svg';

/** Two people hugging. Line icon on a 24 grid, to sit beside Icon glyphs. */
export function HugIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={7.5} cy={5.5} r={2.6} stroke={color} strokeWidth={1.8} />
      <Circle cx={16.5} cy={5.5} r={2.6} stroke={color} strokeWidth={1.8} />
      <Path
        d="M3.2 20.5 V15 a4 4 0 0 1 4 -4 h1.6 M20.8 20.5 V15 a4 4 0 0 0 -4 -4 h-1.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.8 11 q3.2 3.2 6.4 0 M7.2 15.6 q4.8 3.4 9.6 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
