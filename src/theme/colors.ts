export const colors = {
  // Primary
  coral: '#D6264A',
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

export type ColorKey = keyof typeof colors;
