import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ChevronForwardIcon, PlusIcon } from './icons';
import { colors, scale } from '../theme';
import { floatingShadow } from '../theme/shadows';

export interface FabProps {
  /** Which glyph to show. */
  icon?: 'plus' | 'forward';
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Circular floating action button (white) used across the later screens. */
export const Fab: React.FC<FabProps> = ({
  icon = 'plus',
  onPress,
  size = scale(60),
  style,
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? (icon === 'plus' ? 'Add' : 'Continue')}
    style={({ pressed }) => [
      styles.fab,
      floatingShadow,
      { width: size, height: size, borderRadius: size / 2 },
      pressed && styles.pressed,
      style,
    ]}
  >
    {icon === 'plus' ? (
      <PlusIcon size={size * 0.42} color={colors.textBlack} />
    ) : (
      <ChevronForwardIcon size={size * 0.4} color={colors.textBlack} />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  fab: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
