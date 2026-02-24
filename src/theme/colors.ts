export const colors = {
  // Primary
  coral: '#D6264A',
  coral2: '#B8203F',
  violet: '#8B5CF6',

  // Text
  dark: '#1a1a1a',
  darkSecondary: '#666666',
  darkTertiary: '#999999',

  // Backgrounds
  pearl: '#FAFAF8',
  sand: '#F3F1EE',
  white: '#FFFFFF',

  // States
  green: '#008040',
  amber: '#C27400',
  red: '#E0352B',

  // Additional
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  overlay: 'rgba(0,0,0,0.5)',

  // Order status colors
  statusNew: '#8B5CF6',
  statusProcessing: '#C27400',
  statusShipped: '#3B82F6',
  statusDelivered: '#008040',
  statusCancelled: '#E0352B',
} as const;

export type ColorKey = keyof typeof colors;
