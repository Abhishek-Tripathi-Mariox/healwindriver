import Logo from '../assets/svg/logo.svg';
import LogoMark from '../assets/svg/logo_mark.svg';
import TrackMap from '../assets/svg/track_map.svg';

/**
 * Asset registry — rendered exactly like the patient app: the brand logo and
 * vector illustrations are real SVG components via react-native-svg-transformer.
 *
 * Previously the logo was rendered from extracted PNGs via <Image> (a guard
 * against react-native-svg not drawing data-URI <image> SVGs on some Androids),
 * but that diverged from the patient app and left the logo missing here. These
 * are the SAME logo.svg / logo_mark.svg the patient app uses (byte-identical),
 * so the driver app's logo now matches it on every screen (splash, login, home).
 */
export const svgs = {
  logo: Logo,
  logoMark: LogoMark,
  trackMap: TrackMap,
} as const;
