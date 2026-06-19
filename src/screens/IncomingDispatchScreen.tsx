import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MapPinIcon, PhoneIcon, WarningIcon } from '../components/icons';
import { dispatchStore, useIncomingDispatch } from '../state/dispatchStore';
import { authStore } from '../state/authStore';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'IncomingDispatch'>;
const RESPOND_SECONDS = 30;

export const IncomingDispatchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [seconds, setSeconds] = useState(RESPOND_SECONDS);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // We leave this screen by clearing `incoming` (reject/accept/timeout), which
  // also trips the "cleared from under us" effect below. This guards against
  // both paths firing navigation at once (which threw "GO_BACK was not handled").
  const leaving = useRef(false);
  const d = useIncomingDispatch();
  // An attendant is notified "patient inbound" — they prepare, they don't
  // accept/reject or drive the dispatch (that's the driver's job).
  const isAttendant = authStore.getSnapshot().profile?.staff?.role === 'attendant';

  // Pop back to whatever was underneath (home). This screen is presented as a
  // modal on top of the home stack, but if it somehow became the root (e.g. a
  // restored nav state) there's nothing to pop — guard so goBack never throws.
  const leave = React.useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Driver dismiss = reject the dispatch on the server; attendant dismiss is
  // local-only (they were just informed, there's nothing to reject).
  const dismiss = React.useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    if (timer.current) clearInterval(timer.current);
    if (isAttendant) dispatchStore.clearIncoming();
    else void dispatchStore.rejectIncoming();
    leave();
  }, [leave, isAttendant]);

  useEffect(() => {
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          dismiss(); // auto-dismiss on timeout
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [dismiss]);

  // If the dispatch was cancelled/cleared from under us, leave the screen —
  // unless we're already leaving deliberately (accept replaces to ActiveDispatch;
  // letting this also fire goBack would dispatch GO_BACK at a dead route).
  useEffect(() => {
    if (!d && !leaving.current) {
      leaving.current = true;
      leave();
    }
  }, [d, leave]);

  if (!d) return <View style={styles.root} />;

  const accept = async () => {
    if (busy || leaving.current) return;
    if (timer.current) clearInterval(timer.current);
    setBusy(true);
    // Claim the exit up front: acceptIncoming clears `incoming` synchronously,
    // which would otherwise trip the auto-dismiss effect and race this nav.
    leaving.current = true;
    const ok = await dispatchStore.acceptIncoming();
    setBusy(false);
    if (ok) {
      navigation.replace('ActiveDispatch');
    } else {
      // Accept failed (incoming is still set) — surface why, drop the ring so it
      // doesn't immediately re-present, and return home.
      leaving.current = false;
      dispatchStore.clearIncoming();
      Alert.alert(
        'Could not accept',
        'This dispatch could not be accepted — it may have been cancelled or reassigned. Please try again.',
      );
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.sheet, { paddingTop: insets.top + verticalScale(20), paddingBottom: insets.bottom + verticalScale(20) }]}>
        <View style={styles.badge}>
          <WarningIcon size={scale(30)} />
        </View>
        <Text style={styles.heading}>{isAttendant ? 'PATIENT INBOUND' : 'INCOMING EMERGENCY DISPATCH'}</Text>
        <View style={styles.priority}>
          <Text style={styles.priorityText}>{d.priority}</Text>
        </View>

        <Text style={styles.timer}>{seconds}</Text>
        <Text style={styles.timerLabel}>seconds to respond</Text>

        <View style={styles.info}>
          <Text style={styles.patient}>{d.patient}</Text>
          <View style={styles.locRow}>
            <MapPinIcon size={scale(16)} />
            <Text style={styles.locLabel}>PATIENT LOCATION</Text>
          </View>
          <Text style={styles.loc}>{d.pickup}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{d.km} km away</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.meta}>ETA {d.eta} min</Text>
            {!!d.fare && <Text style={styles.dot}>·</Text>}
            {!!d.fare && <Text style={styles.meta}>{d.fare}</Text>}
          </View>
        </View>

        {isAttendant ? (
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.accept, pressed && styles.pressed]} onPress={dismiss}>
              <Text style={styles.acceptText}>Acknowledge</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable disabled={busy} style={({ pressed }) => [styles.reject, pressed && styles.pressed]} onPress={dismiss}>
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
            <Pressable disabled={busy} style={({ pressed }) => [styles.accept, (pressed || busy) && styles.pressed]} onPress={accept}>
              <PhoneIcon size={scale(18)} color={colors.textWhite} />
              <Text style={styles.acceptText}>{busy ? 'Accepting…' : 'Accept'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: scale(22), borderTopRightRadius: scale(22), paddingHorizontal: spacing.lg, alignItems: 'center' },
  badge: { width: scale(60), height: scale(60), borderRadius: scale(30), backgroundColor: '#FCE9E9', alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.brandRedDark, marginTop: verticalScale(14), letterSpacing: 0.3, textAlign: 'center' },
  priority: { backgroundColor: colors.brandRed, borderRadius: scale(6), paddingHorizontal: scale(12), paddingVertical: verticalScale(3), marginTop: verticalScale(10) },
  priorityText: { fontFamily: fonts.bold, fontSize: scale(11), color: colors.textWhite, letterSpacing: 1 },
  timer: { fontFamily: fonts.bold, fontSize: scale(54), color: colors.textBlack, marginTop: verticalScale(14) },
  timerLabel: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  info: { alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), marginTop: verticalScale(20) },
  patient: { fontFamily: fonts.bold, fontSize: scale(18), color: colors.textBlack },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginTop: verticalScale(12) },
  locLabel: { fontFamily: fonts.semiBold, fontSize: scale(11), color: colors.inkMuted, letterSpacing: 0.5 },
  loc: { fontFamily: fonts.medium, fontSize: scale(14), color: colors.textBlack, marginTop: verticalScale(4) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginTop: verticalScale(10) },
  meta: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textPrimary },
  dot: { color: colors.metaGray },
  actions: { flexDirection: 'row', gap: scale(14), alignSelf: 'stretch', marginTop: verticalScale(22) },
  reject: { flex: 1, height: verticalScale(54), borderRadius: scale(12), borderWidth: 1.5, borderColor: colors.brandRed, alignItems: 'center', justifyContent: 'center' },
  rejectText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.brandRed },
  accept: { flex: 1.4, flexDirection: 'row', gap: scale(8), height: verticalScale(54), borderRadius: scale(12), backgroundColor: colors.payGreen, alignItems: 'center', justifyContent: 'center' },
  acceptText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
  pressed: { opacity: 0.85 },
});
