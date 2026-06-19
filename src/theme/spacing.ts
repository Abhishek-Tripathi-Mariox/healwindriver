import { scale, verticalScale } from './responsive';

/**
 * Spacing scale (in Figma points, scaled responsively).
 * The home screen uses a horizontal gutter of ~13–18px.
 */
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(13), // outer screen gutter
  lg: scale(18),
  xl: scale(24),
  xxl: scale(32),
} as const;

/** Vertical rhythm helpers */
export const vspace = {
  xs: verticalScale(4),
  sm: verticalScale(8),
  md: verticalScale(16),
  lg: verticalScale(24),
} as const;

/** Corner radii from Figma */
export const radius = {
  card: scale(10),
  pill: scale(100),
  avatar: scale(91),
} as const;
