import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { svgs } from '../svgAssets';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import { floatingShadow } from '../theme/shadows';
import { driverAuth, staffAuth } from '../api/auth';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const valid = phone.replace(/\D/g, '').length === 10;
  const Logo = svgs.logo;
  const LogoMark = svgs.logoMark;

  // No manual role picker — the backend decides who you are. We first try the
  // ambulance-staff directory (driver/attendant); if the number isn't an
  // onboarded staff member, we fall back to a standalone driver login. The
  // granular role then comes from the server on OTP verify.
  const sendOtp = async () => {
    if (!valid || loading) return;
    setError('');
    setLoading(true);
    const mobileNumber = phone.replace(/\D/g, '');
    try {
      let role: 'driver' | 'staff' = 'staff';
      let res;
      try {
        res = await staffAuth.sendOtp(mobileNumber);
        role = 'staff';
      } catch {
        // Not an ambulance staff member → standalone driver login.
        res = await driverAuth.sendOtp(mobileNumber);
        role = 'driver';
      }
      navigation.navigate('Otp', { mobileNumber, txnId: res.txnId, role });
    } catch (e: any) {
      setError(e?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + verticalScale(40), paddingBottom: insets.bottom + verticalScale(20) }]}>
      <View style={styles.hero}>
        <View style={[styles.mark, floatingShadow]}>
          <LogoMark width={scale(72)} height={scale(72)} preserveAspectRatio="xMidYMid meet" />
        </View>
        <Logo width={scale(200)} height={scale(40)} preserveAspectRatio="xMidYMid meet" style={{ marginTop: verticalScale(20) }} />
        <Text style={styles.welcome}>Welcome to HealWin</Text>
        <Text style={styles.tag}>Sign in to continue</Text>
      </View>

      <View>
        <Text style={styles.label}>Registered mobile number</Text>
        <View style={styles.inputRow}>
          <Text style={styles.cc}>+91</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
            maxLength={10}
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={!valid || loading}
          onPress={sendOtp}
          style={({ pressed }) => [styles.cta, (!valid || loading) && styles.ctaDisabled, pressed && valid && styles.pressed]}
        >
          <Text style={styles.ctaText}>{loading ? 'Sending…' : 'Send OTP'}</Text>
        </Pressable>
        <Text style={styles.terms}>By continuing, you agree to the Terms & Privacy</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: scale(108), height: scale(108), borderRadius: scale(24), backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  welcome: { fontFamily: fonts.bold, fontSize: scale(22), color: colors.textBlack, marginTop: verticalScale(28) },
  tag: { fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted, marginTop: verticalScale(6), textAlign: 'center' },
  label: { fontFamily: fonts.medium, fontSize: scale(13), color: '#4A4A4A', marginBottom: verticalScale(8) },
  error: { fontFamily: fonts.medium, fontSize: scale(12), color: '#D32F2F', marginTop: verticalScale(12) },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: verticalScale(52), borderRadius: scale(12), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(14) },
  cc: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack, marginRight: scale(10) },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: scale(15), color: colors.textBlack, padding: 0 },
  cta: { height: verticalScale(52), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(20) },
  ctaDisabled: { backgroundColor: '#A9BEE6' },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
  terms: { textAlign: 'center', fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(16) },
});
