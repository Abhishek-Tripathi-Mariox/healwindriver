import { moderateScale } from './responsive';

/**
 * Typography tokens.
 * The Figma design uses Poppins. The .ttf files live in `assets/fonts/` and are
 * linked into the native projects via `npm run fonts` (react-native-asset).
 * These family names match the bundled font file names.
 */
export const fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
} as const;

/**
 * Font sizes (Figma px → responsive). Each comment lists where it is used.
 */
export const fontSize = {
  caption: moderateScale(12), // "Welcome,", nav labels
  body: moderateScale(15), // "Book Now"
  title: moderateScale(20), // "Know Your"
  heading: moderateScale(24), // "Rahul Kumar", "Where To ?", "Life Support Vehicle", "Locate"
  headingLg: moderateScale(26), // "Healthcare Centre"
} as const;

/** Common ready-made text styles */
export const textStyles = {
  welcome: { fontFamily: fonts.regular, fontSize: fontSize.caption, letterSpacing: -0.3 },
  name: { fontFamily: fonts.bold, fontSize: fontSize.heading, letterSpacing: -0.3 },
  whereTo: { fontFamily: fonts.semiBold, fontSize: fontSize.heading },
  navLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.caption, letterSpacing: -0.3 },
  buttonLabel: { fontFamily: fonts.bold, fontSize: fontSize.body },
} as const;
