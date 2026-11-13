import Svg, { G, Path } from 'react-native-svg';

/** The owner's leaf-branch.svg: a curved stem with ten leaves. `size` is the height. */
const leaves: [x: number, y: number, rotate: number, scale: number, color: string][] = [
  [24.0, 264.4, 39.7, 0.5, '#245C47'],
  [22.4, 234.9, -46.2, 0.48, '#3A8A66'],
  [28.9, 205.7, 70.3, 0.47, '#2A6B52'],
  [40.7, 176.7, -27.1, 0.46, '#4C9A76'],
  [54.8, 147.9, 78.5, 0.44, '#2F7D5B'],
  [68.6, 119.0, -28.4, 0.42, '#6FB28F'],
  [79.1, 89.9, 67.4, 0.41, '#245C47'],
  [83.7, 60.6, -50.7, 0.4, '#3A8A66'],
  [79.5, 30.9, 34.3, 0.38, '#2A6B52'],
  [70.0, 10.0, -31.0, 0.4, '#6FB28F'],
];

export function LeafBranch({ size = 200 }: { size?: number }) {
  return (
    <Svg width={(size * 149) / 345} height={size} viewBox="-22 -35 149 345">
      <Path
        d="M40 300 C -30 200 130 110 70 10"
        fill="none"
        stroke="#3A8A66"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {leaves.map(([x, y, rotate, scale, color]) => (
        <G key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
          <Path d="M0 0 C -24 -22 -30 -68 3 -100 C 31 -66 25 -22 0 0Z" fill={color} />
          <Path d="M0 0 C 25 -22 31 -66 3 -100 Z" fill="#FFFFFF" opacity={0.16} />
          <Path
            d="M0 0 C 1 -30 2 -60 3 -90"
            stroke="#D5EADD"
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
        </G>
      ))}
    </Svg>
  );
}
