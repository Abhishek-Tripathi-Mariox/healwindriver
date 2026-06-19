import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader, TrackMap } from '../components';
import { CheckCircleIcon, DirectionsArrowIcon, PhoneIcon } from '../components/icons';
import { dispatchStore, useActiveDispatch, DispatchStatus, otpRequired } from '../state/dispatchStore';
import { authStore } from '../state/authStore';
import { subscribePosition, getLastPosition, getCurrentPositionOnce } from '../services/location';
import { distanceKm, etaMinutesFromKm } from '../services/geo';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActiveDispatch'>;

const STAFF_STEPS: { key: DispatchStatus; label: string }[] = [
  { key: 'ACKNOWLEDGED', label: 'Accepted' },
  { key: 'EN_ROUTE', label: 'En route' },
  { key: 'ON_SCENE', label: 'On scene' },
  { key: 'ON_TRIP', label: 'On trip' },
  { key: 'COMPLETED', label: 'Completed' },
];
const BOOKING_STEPS: { key: DispatchStatus; label: string }[] = [
  { key: 'ACKNOWLEDGED', label: 'Accepted' },
  { key: 'EN_ROUTE', label: 'En route' },
  { key: 'ON_SCENE', label: 'On scene' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const ActiveDispatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const d = useActiveDispatch();
  // Where "back"/"done" lands. Prefer the active dispatch's kind; fall back to
  // the signed-in role when there's no active dispatch (empty state).
  const homeRoute =
    (d ? d.kind === 'booking' : authStore.getSnapshot().role === 'driver')
      ? 'DriverHome'
      : 'StaffHome';
  // ActiveDispatch is frequently the root of the stack (reached via replace from
  // the incoming alert, a complete-trip reset, or a restored nav state). A bare
  // goBack then throws "GO_BACK was not handled by any navigator", so fall back
  // to resetting onto home when there's nothing to pop.
  const back = React.useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: homeRoute }] });
  }, [navigation, homeRoute]);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [busy, setBusy] = useState(false);
  // Live driver position → live distance/ETA to the patient.
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(
    getLastPosition(),
  );
  React.useEffect(() => {
    if (!getLastPosition()) {
      void getCurrentPositionOnce().then((p) => p && setDriverPos(p));
    }
    return subscribePosition(setDriverPos);
  }, []);

  if (!d) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Active Dispatch" onBack={back} />
        <Text style={styles.empty}>No active dispatch.</Text>
      </View>
    );
  }

  const staffFlow = d.kind !== 'booking';
  const STEPS = staffFlow ? STAFF_STEPS : BOOKING_STEPS;
  const currentIndex = STEPS.findIndex((s) => s.key === d.status);

  // Live distance from the crew's own GPS to the patient (falls back to the
  // static dispatch-time value when GPS or patient coordinates aren't available).
  const patientPt =
    d.patientLat != null && d.patientLng != null
      ? { lat: d.patientLat, lng: d.patientLng }
      : null;
  const liveKm = distanceKm(driverPos, patientPt);
  const shownKm = liveKm != null ? liveKm : d.km;
  const liveEta = etaMinutesFromKm(liveKm);
  const shownEta = liveEta != null ? liveEta : d.eta;

  const ctaLabel = (): string => {
    switch (d.status) {
      case 'ACKNOWLEDGED':
        return 'Start Trip (En Route)';
      case 'EN_ROUTE':
        return 'Mark Arrived (On Scene)';
      case 'ON_SCENE':
        return staffFlow ? 'Verify OTP & Start Trip' : 'Complete Trip';
      case 'ON_TRIP':
        return 'Complete Trip (At Hospital)';
      default:
        return 'Done';
    }
  };

  // This tap finishes the dispatch when it's the final step.
  const isFinalStep = d.status === 'ON_TRIP' || (!staffFlow && d.status === 'ON_SCENE');

  const onCta = async () => {
    if (busy) return;
    // The ON_SCENE → ON_TRIP step (patient pickup) needs the OTP first.
    if (otpRequired(d)) {
      setOtp('');
      setOtpErr('');
      setOtpOpen(true);
      return;
    }
    setBusy(true);
    await dispatchStore.advance();
    setBusy(false);
    if (isFinalStep) navigation.reset({ index: 0, routes: [{ name: homeRoute }] });
  };

  const submitOtp = async () => {
    if (busy) return;
    if (otp.trim().length < 4) {
      setOtpErr('Enter the OTP shown on the patient app.');
      return;
    }
    setBusy(true);
    const ok = await dispatchStore.advance(otp.trim());
    setBusy(false);
    if (ok) {
      setOtpOpen(false);
      setOtp('');
    } else {
      setOtpErr('Incorrect OTP. Please re-check with the patient.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Active Dispatch" onBack={back} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(120) }]}>
        <TrackMap driver={driverPos} patient={patientPt} style={styles.mapWrap} />

        {/* Status stepper */}
        <View style={[styles.card, cardShadow]}>
          <View style={styles.stepper}>
            {STEPS.map((s, i) => {
              const done = i <= currentIndex;
              return (
                <View key={s.key} style={styles.step}>
                  <View style={[styles.dot, done && styles.dotDone]}>
                    {done && <CheckCircleIcon size={scale(16)} color={colors.payGreen} />}
                  </View>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{s.label}</Text>
                  {i < STEPS.length - 1 && <View style={[styles.line, i < currentIndex && styles.lineDone]} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Patient + route */}
        <View style={[styles.card, cardShadow]}>
          <Text style={styles.patient}>{d.patient}</Text>
          <Text style={styles.meta}>
            {shownKm} km · ETA {shownEta} min{d.fare ? ` · ${d.fare}` : ''}
            {liveKm != null ? ' · live' : ''}
          </Text>
          <View style={styles.divider} />
          <Row label="Pickup" value={d.pickup} />
          <Row label="Drop" value={d.drop} />

          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn} onPress={() => Linking.openURL(`tel:${d.phone.replace(/\s/g, '')}`)}>
              <PhoneIcon size={scale(18)} color={colors.callGreen} />
              <Text style={styles.quickText}>Call</Text>
            </Pressable>
            <Pressable
              style={styles.quickBtn}
              onPress={() =>
                Linking.openURL(
                  'https://www.google.com/maps/dir/?api=1&destination=' +
                    encodeURIComponent(d.status === 'ON_SCENE' ? d.drop : d.pickup),
                )
              }
            >
              <DirectionsArrowIcon size={scale(18)} color={colors.directionsBlue} />
              <Text style={styles.quickText}>Navigate</Text>
            </Pressable>
          </View>

          <Pressable style={styles.hospitalBtn} onPress={() => navigation.navigate('HospitalSelect')}>
            <Text style={styles.hospitalBtnText}>Select nearby drop-off hospital</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + verticalScale(10) }]}>
        <Pressable disabled={busy} style={({ pressed }) => [styles.cta, (pressed || busy) && styles.pressed]} onPress={onCta}>
          <Text style={styles.ctaText}>{ctaLabel()}</Text>
        </Pressable>
      </View>

      {/* OTP verification before starting the trip (patient pickup) */}
      <Modal visible={otpOpen} transparent animationType="fade" onRequestClose={() => setOtpOpen(false)}>
        <View style={styles.otpBackdrop}>
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>Verify pickup OTP</Text>
            <Text style={styles.otpSub}>Ask {d.patient} for the 4-digit OTP shown in their app.</Text>
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 4))}
              placeholder="----"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.otpInput}
              autoFocus
            />
            {!!otpErr && <Text style={styles.otpErr}>{otpErr}</Text>}
            <View style={styles.otpRow}>
              <Pressable style={styles.otpCancel} onPress={() => setOtpOpen(false)}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </Pressable>
              <Pressable disabled={busy} style={[styles.otpVerify, busy && styles.pressed]} onPress={submitOtp}>
                <Text style={styles.otpVerifyText}>{busy ? 'Verifying…' : 'Start Trip'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', fontFamily: fonts.medium, fontSize: scale(15), color: colors.inkMuted, marginTop: verticalScale(40) },
  content: { paddingHorizontal: spacing.md, paddingTop: verticalScale(4) },
  mapWrap: { height: verticalScale(180), borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.avatarCircle },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), marginTop: verticalScale(14) },
  stepper: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center' },
  dot: { width: scale(26), height: scale(26), borderRadius: scale(13), borderWidth: 2, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, zIndex: 1 },
  dotDone: { borderColor: colors.payGreen },
  stepLabel: { fontFamily: fonts.medium, fontSize: scale(10), color: colors.inkMuted, marginTop: verticalScale(6) },
  stepLabelDone: { color: colors.textBlack },
  line: { position: 'absolute', top: scale(13), left: '55%', right: '-45%', height: 2, backgroundColor: colors.inputBorder },
  lineDone: { backgroundColor: colors.payGreen },
  patient: { fontFamily: fonts.bold, fontSize: scale(18), color: colors.textBlack },
  meta: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted, marginTop: verticalScale(4) },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E2E2', marginVertical: verticalScale(14) },
  row: { flexDirection: 'row', marginBottom: verticalScale(10) },
  rowLabel: { width: scale(60), fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.inkMuted },
  rowValue: { flex: 1, fontFamily: fonts.medium, fontSize: scale(13), color: colors.textBlack },
  quickRow: { flexDirection: 'row', gap: scale(12), marginTop: verticalScale(6) },
  quickBtn: { flex: 1, flexDirection: 'row', gap: scale(8), height: verticalScale(44), borderRadius: scale(10), backgroundColor: colors.softPurple, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.ink },
  hospitalBtn: { marginTop: verticalScale(12), height: verticalScale(44), borderRadius: scale(10), borderWidth: 1.5, borderColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  hospitalBtnText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.directionsBlue },
  otpBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  otpCard: { width: '100%', backgroundColor: colors.surface, borderRadius: scale(16), padding: scale(20) },
  otpTitle: { fontFamily: fonts.bold, fontSize: scale(18), color: colors.textBlack },
  otpSub: { fontFamily: fonts.regular, fontSize: scale(13), color: colors.inkMuted, marginTop: verticalScale(6) },
  otpInput: { marginTop: verticalScale(16), height: verticalScale(54), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, textAlign: 'center', letterSpacing: scale(8), fontFamily: fonts.bold, fontSize: scale(22), color: colors.textBlack },
  otpErr: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.brandRed, marginTop: verticalScale(8) },
  otpRow: { flexDirection: 'row', gap: scale(12), marginTop: verticalScale(18) },
  otpCancel: { flex: 1, height: verticalScale(48), borderRadius: scale(10), borderWidth: 1.5, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  otpCancelText: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.inkMuted },
  otpVerify: { flex: 1.4, height: verticalScale(48), borderRadius: scale(10), backgroundColor: colors.payGreen, alignItems: 'center', justifyContent: 'center' },
  otpVerifyText: { fontFamily: fonts.bold, fontSize: scale(15), color: colors.textWhite },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: '#ECECEC', paddingHorizontal: spacing.md, paddingTop: verticalScale(12) },
  cta: { height: verticalScale(52), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
