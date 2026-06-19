import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SvgProps } from 'react-native-svg';
import { colors, radius } from '../theme';
import { cardShadow } from '../theme/shadows';

export interface CardProps {
  children?: React.ReactNode;
  /** Optional background SVG component (e.g. the forest texture). */
  Background?: React.FC<SvgProps>;
  /** Opacity for the background layer (Figma uses 0.7–0.9). */
  backgroundOpacity?: number;
  /** Dark scrim over the bg image to keep text readable. */
  scrim?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable rounded card with a 0/4/4 drop shadow.
 * Used for the "Where To?" search bar and both promo cards.
 */
export const Card: React.FC<CardProps> = ({
  children,
  Background,
  backgroundOpacity = 0.85,
  scrim = false,
  onPress,
  style,
  contentStyle,
}) => {
  const inner = (
    <View style={[styles.fill, contentStyle]}>
      {Background && (
        <Background
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          style={[StyleSheet.absoluteFillObject, { opacity: backgroundOpacity }]}
        />
      )}
      {scrim && <View style={styles.scrim} />}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, cardShadow, pressed && styles.pressed, style]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={[styles.card, cardShadow, style]}>{inner}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  pressed: {
    opacity: 0.92,
  },
});
