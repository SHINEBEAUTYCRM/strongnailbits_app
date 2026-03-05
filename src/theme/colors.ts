/* ── Light palette (default) ── */
export const lightColors = {
  // Primary
  coral: '#C8102E',
  coral2: '#B8203F',
  violet: '#8B5CF6',

  // Text
  dark: '#1A1A1A',
  darkSecondary: '#666666',
  darkTertiary: '#8E8E93',

  // Backgrounds
  pearl: '#F5F5F7',
  sand: '#F2F2F7',
  white: '#FFFFFF',

  // States
  green: '#34C759',
  amber: '#C27400',
  red: '#E0352B',

  // Additional
  border: '#E5E5EA',
  borderLight: '#F0F0F0',
  overlay: 'rgba(0,0,0,0.5)',

  // Order status colors
  statusNew: '#8B5CF6',
  statusProcessing: '#C27400',
  statusShipped: '#3B82F6',
  statusDelivered: '#34C759',
  statusCancelled: '#E0352B',
} as const;

/* ── Dark palette ── */
export const darkColors: typeof lightColors = {
  // Primary — brighter for dark backgrounds
  coral: '#FF4D6D',
  coral2: '#C8102E',
  violet: '#A78BFA',

  // Text — inverted
  dark: '#F5F5F7',
  darkSecondary: '#A1A1AA',
  darkTertiary: '#71717A',

  // Backgrounds
  pearl: '#0A0A0A',
  sand: '#1C1C1E',
  white: '#1C1C1E',

  // States — brighter for dark
  green: '#4ADE80',
  amber: '#FBBF24',
  red: '#F87171',

  // Additional
  border: '#38383A',
  borderLight: '#2C2C2E',
  overlay: 'rgba(0,0,0,0.7)',

  // Order status colors
  statusNew: '#A78BFA',
  statusProcessing: '#FBBF24',
  statusShipped: '#60A5FA',
  statusDelivered: '#4ADE80',
  statusCancelled: '#F87171',
} as const;

// Default export for backward compatibility — points to light theme
export const colors = lightColors;

export type ColorKey = keyof typeof lightColors;
