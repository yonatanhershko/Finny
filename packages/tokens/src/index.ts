/**
 * Finny global style. One source for mobile (NativeWind) and web (Tailwind).
 * Change a value here, both apps follow.
 */

export const colors = {
  light: {
    primary: '#4A7C6F',
    onPrimary: '#FFFFFF',
    secondary: '#A8C5B4',
    background: '#F5F1E8',
    surface: '#FFFFFF',
    surfaceMuted: '#EFEADF',
    accent: '#E8A87C',
    onAccent: '#4A2A12',
    text: '#2E3D38',
    textMuted: '#6B7A74',
    border: '#E4DFD2',
    danger: '#D64545',
    dangerSurface: '#FCEBEB',
    success: '#3E8E5A',
    leafLight: '#CFE0D3',
    leafMid: '#A8C5B4',
    leafDark: '#4A7C6F',
  },
  dark: {
    primary: '#7FBCA3',
    onPrimary: '#10201A',
    secondary: '#3D6B58',
    background: '#16211C',
    surface: '#1F2D27',
    surfaceMuted: '#263830',
    accent: '#E8A87C',
    onAccent: '#3A200D',
    text: '#E9F0EA',
    textMuted: '#9DB0A6',
    border: '#2F4239',
    danger: '#F07C7C',
    dangerSurface: '#3A1F1F',
    success: '#7FCB98',
    leafLight: '#2C4439',
    leafMid: '#3D6B58',
    leafDark: '#7FBCA3',
  },
} as const;

export type ThemeName = keyof typeof colors;
export type ColorToken = keyof (typeof colors)['light'];

/** Colors for category icons and chart slices. Same in both themes. */
export const categoryPalette = [
  '#5B9BD5',
  '#E8A87C',
  '#F2C94C',
  '#4A7C6F',
  '#9B8AD6',
  '#E07A8B',
  '#6FB7B0',
  '#B58A5A',
  '#8FBF6B',
  '#8A9099',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontFamily = {
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  bold: 'Rubik_700Bold',
} as const;

export const fontSize = {
  caption: 12,
  body: 15,
  title: 18,
  heading: 24,
  hero: 36,
} as const;
