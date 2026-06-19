import { Platform } from 'react-native';
import { colors } from './colors';

/**
 * Figma drop shadow: 0px 4px 4px rgba(0,0,0,0.25).
 * Mapped to iOS shadow* props and Android elevation so it renders on both.
 */
export const cardShadow = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, // alpha already baked into colors.shadow
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
  default: {},
});

/** Stronger shadow for the floating SOS button. */
export const floatingShadow = Platform.select({
  ios: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  android: {
    elevation: 10,
  },
  default: {},
});
