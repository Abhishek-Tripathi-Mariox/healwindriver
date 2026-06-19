import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ChevronBackIcon } from './icons';
import { colors, radius, scale } from '../theme';
import { cardShadow } from '../theme/shadows';

export interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Circular white back button (Figma: 40x40 with chevron). */
export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Go back"
    hitSlop={8}
    style={({ pressed }) => [styles.btn, cardShadow, pressed && styles.pressed, style]}
  >
    <ChevronBackIcon size={scale(22)} color={colors.textPrimary} />
  </Pressable>
);

const SIZE = scale(40);

const styles = StyleSheet.create({
  btn: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
