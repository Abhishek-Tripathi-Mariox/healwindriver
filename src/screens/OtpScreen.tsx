import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BackButton } from '../components';
import { driverAuth, staffAuth } from '../api/auth';
import { authStore } from '../state/authStore';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const LEN = 6;
type Nav = NativeStackNavigationProp<RootStackParamList, 'Otp'>;
type Rt = RouteProp<RootStackParamList, 'Otp'>;

export const OtpScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [txnId, setTxnId] = useState(params.txnId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef<Array<TextInput | null>>([]);
  const filled = digits.every((d) => d !== '');
  const authApi = params.role === 'staff' ? staffAuth : driverAuth;

  const onChange = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const onVerify = async () => {
    if (!filled || loading) return;
    setError('');
    setLoading(true);
    try {
      const { token, id, role } = await authApi.verifyOtp(txnId, digits.join(''), params.mobileNumber);
      await authStore.setSession(token, role, id, params.mobileNumber);
      // Driver goes through the permission/onboarding gate; staff straight in.
      const home = role === 'staff' ? 'StaffHome' : 'Onboarding';
      navigation.reset({ index: 0, routes: [{ name: home }] });
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (loading) return;
    setError('');
    try {
      const res = await authApi.resendOtp(params.mobileNumber);
      setTxnId(res.txnId);
      setDigits(Array(LEN).fill(''));
      refs.current[0]?.focus();
    } catch (e: any) {
      setError(e?.message || 'Could not resend OTP.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + verticalScale(8) }]}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.sub}>Sent to +91 {params.mobileNumber}</Text>

      <View style={styles.boxes}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              refs.current[i] = r;
            }}
            value={d}
            onChangeText={(v) => onChange(i, v)}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.box, d !== '' && styles.boxFilled]}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        disabled={!filled || loading}
        onPress={onVerify}
        style={({ pressed }) => [styles.cta, (!filled || loading) && styles.ctaDisabled, pressed && filled && styles.pressed]}
      >
        <Text style={styles.ctaText}>{loading ? 'Verifying…' : 'Verify & Continue'}</Text>
      </Pressable>
      <Pressable onPress={resend} style={styles.resend}>
        <Text style={styles.resendText}>Resend OTP</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  title: { fontFamily: fonts.bold, fontSize: scale(22), color: colors.textBlack, marginTop: verticalScale(30) },
  sub: { fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted, marginTop: verticalScale(8) },
  boxes: { flexDirection: 'row', gap: scale(8), marginTop: verticalScale(30) },
  box: { flex: 1, height: verticalScale(58), borderRadius: scale(12), borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: colors.surface, textAlign: 'center', fontFamily: fonts.bold, fontSize: scale(20), color: colors.textBlack },
  boxFilled: { borderColor: colors.directionsBlue },
  cta: { height: verticalScale(52), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(30) },
  ctaDisabled: { backgroundColor: '#A9BEE6' },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
  resend: { alignSelf: 'center', marginTop: verticalScale(18) },
  resendText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.directionsBlue },
  error: { fontFamily: fonts.medium, fontSize: scale(12), color: '#D32F2F', marginTop: verticalScale(16) },
});
