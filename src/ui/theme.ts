export const C = {
  bg: '#F5F6F2',
  ink: '#1A1F1C',
  muted: '#5B635E',
  line: '#E3E6E0',
  input: '#D5D9D2',
  white: '#FFFFFF',
  green: '#1F7A4D',
  greenDark: '#15573A',
  greenTint: '#E4EFE8',
  amber: '#F2A33A',
  amberTint: '#FDEFD9',
  amberText: '#7A4A06',
  amberDeep: '#5C3804',
  red: '#B3261E',
  redTint: '#FCE8E6',
  redDeep: '#7A1B15',
  redLine: '#E3BFBC',
  grey: '#ECEEEA',
  greyText: '#3E4541',
  off: '#C9CEC6',
  dash: '#9AA39D',
  seg: '#E8EBE5',
  placeholder: '#8A918C',
} as const;

export type Weight = 400 | 500 | 600 | 700 | 800;

export const FONT: Record<Weight, string> = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
};

export type Tono = 'verde' | 'ambar' | 'gris';

export const TONO: Record<Tono, { bg: string; fg: string }> = {
  verde: { bg: C.greenTint, fg: C.green },
  ambar: { bg: C.amberTint, fg: C.amberText },
  gris: { bg: C.grey, fg: C.greyText },
};
