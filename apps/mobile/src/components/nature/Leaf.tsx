import Svg, { Path } from 'react-native-svg';

/**
 * One leaf, drawn from the owner's leaf-branch.svg shape: body, a soft
 * highlight on one half, and a center vein. `size` is the height.
 */
export function Leaf({
  size = 40,
  color,
  veinColor = '#D5EADD',
}: {
  size?: number;
  color: string;
  veinColor?: string;
}) {
  return (
    <Svg width={(size * 68) / 108} height={size} viewBox="-34 -104 68 108">
      <Path d="M0 0 C -24 -22 -30 -68 3 -100 C 31 -66 25 -22 0 0Z" fill={color} />
      <Path d="M0 0 C 25 -22 31 -66 3 -100 Z" fill="#FFFFFF" opacity={0.16} />
      <Path
        d="M0 0 C 1 -30 2 -60 3 -90"
        stroke={veinColor}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
    </Svg>
  );
}
