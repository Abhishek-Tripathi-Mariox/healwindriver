import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon } from './icons';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';

export interface BannerData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface Props {
  notif: BannerData | null;
  onDismiss: () => void;
  onPress?: (data?: Record<string, any>) => void;
}

const AUTO_HIDE_MS = 6000;

/**
 * Branded heads-up in-app notification that slides down from the top when a
 * foreground push arrives — replaces the plain OS Alert. Auto-dismisses, and
 * tapping it deep-links via `onPress`.
 */
export const InAppBanner: React.FC<Props> = ({ notif, onDismiss, onPress }) => {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-160)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notif) return;
    Animated.timing(y, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    timer.current = setTimeout(hide, AUTO_HIDE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notif]);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(y, {
      toValue: -160,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && onDismiss());
  };

  if (!notif) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { paddingTop: insets.top + verticalScale(6), transform: [{ translateY: y }] },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.card, cardShadow]}
        onPress={() => {
          hide();
          onPress?.(notif.data);
        }}
      >
        <View style={styles.accent} />
        <View style={styles.iconWrap}>
          <BellIcon size={scale(20)} color={colors.textWhite} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {notif.title || 'HealWin'}
          </Text>
          {!!notif.body && (
            <Text style={styles.body} numberOfLines={2}>
              {notif.body}
            </Text>
          )}
        </View>
        <Pressable hitSlop={10} onPress={hide} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    paddingLeft: scale(18),
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: scale(5),
    backgroundColor: colors.brandRed,
  },
  iconWrap: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.textBlack },
  body: {
    fontFamily: fonts.regular,
    fontSize: scale(12.5),
    color: colors.inkMuted,
    marginTop: verticalScale(2),
    lineHeight: scale(17),
  },
  close: { padding: scale(4) },
  closeText: { fontFamily: fonts.medium, fontSize: scale(14), color: '#B0B6BD' },
});
