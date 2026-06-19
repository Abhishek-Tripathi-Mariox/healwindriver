import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { svgs } from '../svgAssets';
import { colors, fonts, scale, verticalScale } from '../theme';
import { floatingShadow } from '../theme/shadows';
import { useAuth } from '../state/authStore';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { status, role } = useAuth();
  const fade = useRef(new Animated.Value(0)).current;
  const [minPassed, setMinPassed] = useState(false);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const t = setTimeout(() => setMinPassed(true), 1500);
    return () => clearTimeout(t);
  }, [fade]);

  // Navigate once BOTH the min splash time has elapsed AND auth resolved.
  // State-driven (no stale closures) so whichever finishes last triggers it.
  useEffect(() => {
    if (!minPassed || status === 'loading') return;
    const dest =
      status === 'authed' ? (role === 'staff' ? 'StaffHome' : 'DriverHome') : 'Login';
    navigation.reset({ index: 0, routes: [{ name: dest }] });
  }, [minPassed, status, role, navigation]);

  const LogoMark = svgs.logoMark;
  const Logo = svgs.logo;

  return (
    <View style={styles.root}>
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <View style={[styles.mark, floatingShadow]}>
          <LogoMark width={scale(96)} height={scale(96)} preserveAspectRatio="xMidYMid meet" />
        </View>
        <Logo width={scale(210)} height={scale(43)} preserveAspectRatio="xMidYMid meet" style={{ marginTop: verticalScale(24) }} />
        <Text style={styles.tag}>Partner App</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  mark: { width: scale(132), height: scale(132), borderRadius: scale(28), backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  tag: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.directionsBlue, marginTop: verticalScale(14), letterSpacing: 1 },
});
