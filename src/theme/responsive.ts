import { Dimensions, PixelRatio } from 'react-native';

/**
 * Responsive scaling helpers.
 *
 * The Figma frame is an iPhone 16 Pro: 402 x 854 logical points.
 * We scale spacing / font sizes proportionally to the device width so the
 * layout stays visually identical across phone sizes on both Android & iOS.
 */
export const GUIDELINE_BASE_WIDTH = 402;
export const GUIDELINE_BASE_HEIGHT = 854;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const screen = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

/** Scale a size based on screen width (good for widths, horizontal spacing). */
export const scale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size));

/** Scale a size based on screen height (good for vertical spacing). */
export const verticalScale = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size));

/**
 * Moderate scale — scales, but softens the effect with `factor` (default 0.5)
 * so text doesn't become huge on tablets. Best choice for font sizes.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  Math.round(size + (scale(size) - size) * factor);
