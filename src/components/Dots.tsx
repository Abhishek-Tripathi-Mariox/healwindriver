import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, scale } from '../theme';

export interface DotsProps {
  count: number;
  activeIndex: number;
}

/** Carousel pagination dots (Figma shows 4, 3rd active). */
export const Dots: React.FC<DotsProps> = ({ count, activeIndex }) => (
  <View style={styles.row}>
    {Array.from({ length: count }).map((_, i) => {
      const active = i === activeIndex;
      return (
        <View
          key={i}
          style={[
            styles.dot,
            active && styles.dotActive,
            { backgroundColor: active ? colors.dotActive : colors.dotInactive },
          ]}
        />
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
    marginHorizontal: scale(3),
  },
  dotActive: {
    width: scale(16),
  },
});
