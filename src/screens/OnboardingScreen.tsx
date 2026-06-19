import React, { useState } from 'react';
import { Platform, PermissionsAndroid, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BellIcon, CheckCircleIcon, IconProps, MapPinIcon, PhoneIcon } from '../components/icons';
import { ensurePermission as ensureLocationPermission } from '../services/location';
import { requestNotificationPermission } from '../services/push';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Perm {
  key: string;
  title: string;
  desc: string;
  Icon: React.FC<IconProps>;
  request: () => Promise<boolean>;
}

// Real OS permission request for one-tap calling (Android CALL_PHONE; iOS n/a).
const requestCallPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

const PERMS: Perm[] = [
  { key: 'loc', title: 'Location (always)', desc: 'Required to receive nearby dispatches and share live location on a trip', Icon: MapPinIcon, request: ensureLocationPermission },
  { key: 'notif', title: 'Notifications', desc: 'Emergency dispatch alerts and shift reminders', Icon: BellIcon, request: requestNotificationPermission },
  { key: 'call', title: 'Phone', desc: 'One-tap calling to the patient and control room', Icon: PhoneIcon, request: requestCallPermission },
];

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const allGranted = PERMS.every((p) => granted[p.key]);

  // Fire the REAL OS permission dialog and record the outcome.
  const requestOne = async (p: Perm) => {
    const ok = await p.request().catch(() => false);
    setGranted((g) => ({ ...g, [p.key]: ok }));
    return ok;
  };

  const requestAllAndContinue = async () => {
    if (busy) return;
    setBusy(true);
    try {
      for (const p of PERMS) {
        if (!granted[p.key]) await requestOne(p);
      }
    } finally {
      setBusy(false);
      // Crew can re-grant any denied permission from system settings later.
      navigation.reset({ index: 0, routes: [{ name: 'DriverHome' }] });
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + verticalScale(30), paddingBottom: insets.bottom + verticalScale(20) }]}>
      <View style={styles.body}>
        <Text style={styles.title}>Before you go on duty</Text>
        <Text style={styles.sub}>These permissions keep dispatch fast and reliable.</Text>

        <View style={{ marginTop: verticalScale(24), gap: verticalScale(14) }}>
          {PERMS.map((p) => {
            const on = !!granted[p.key];
            return (
              <Pressable key={p.key} onPress={() => requestOne(p)} style={[styles.card, cardShadow]}>
                <View style={styles.iconWrap}>
                  <p.Icon size={scale(22)} color={colors.directionsBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.cardDesc}>{p.desc}</Text>
                </View>
                {on ? <CheckCircleIcon size={scale(24)} color={colors.payGreen} /> : <View style={styles.toggleOff} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={styles.note}>You can change these later in system settings.</Text>
        <Pressable
          disabled={busy}
          onPress={requestAllAndContinue}
          style={({ pressed }) => [styles.cta, (pressed || busy) && styles.pressed]}
        >
          <Text style={styles.ctaText}>{allGranted ? 'Continue' : 'Allow & Continue'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  body: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: scale(24), color: colors.textBlack },
  sub: { fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted, marginTop: verticalScale(8) },
  card: { flexDirection: 'row', alignItems: 'center', gap: scale(14), backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  iconWrap: { width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  cardDesc: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(3) },
  toggleOff: { width: scale(24), height: scale(24), borderRadius: scale(12), borderWidth: 2, borderColor: colors.inputBorder },
  note: { textAlign: 'center', fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginBottom: verticalScale(12) },
  cta: { height: verticalScale(52), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  ctaSoft: { backgroundColor: colors.directionsBlue },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
