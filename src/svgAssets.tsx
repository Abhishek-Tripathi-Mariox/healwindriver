import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import TrackMap from '../assets/svg/track_map.svg';

/**
 * Asset registry. The brand "logo" / "logo_mark" SVGs are actually PNGs wrapped
 * in an <image> data-URI, which react-native-svg does NOT render on Android — so
 * the logo came up blank. We render them as real PNGs via <Image> instead, while
 * keeping the same call-site API (width/height/style). Genuine vector assets
 * (track_map) stay as SVG components.
 */

const logoPng = require('./assets/img/logo.png');
const logoMarkPng = require('./assets/img/logo_mark.png');

interface LogoProps {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  // Accepted for compatibility with the old SVG components; not used by <Image>.
  preserveAspectRatio?: string;
}

const Logo: React.FC<LogoProps> = ({ width, height, style }) => (
  <Image source={logoPng} resizeMode="contain" style={[{ width, height }, style]} />
);

const LogoMark: React.FC<LogoProps> = ({ width, height, style }) => (
  <Image source={logoMarkPng} resizeMode="contain" style={[{ width, height }, style]} />
);

export const svgs = {
  logo: Logo,
  logoMark: LogoMark,
  trackMap: TrackMap,
} as const;
