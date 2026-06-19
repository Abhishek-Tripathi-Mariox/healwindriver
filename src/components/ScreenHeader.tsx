import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from './BackButton';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Optional element rendered on the right (e.g. an icon button). */
  right?: React.ReactNode;
}

/** Standard top bar: back button + centered title (+ optional right slot). */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, right }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + verticalScale(8) }]}>
      <BackButton onPress={onBack} />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: verticalScale(10),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: scale(18),
    color: colors.textBlack,
    marginHorizontal: spacing.sm,
  },
  right: {
    minWidth: scale(40),
    alignItems: 'flex-end',
  },
});
