import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ShiftDetail'>;
type Rt = RouteProp<RootStackParamList, 'ShiftDetail'>;

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const statusStyle = (s: string) => {
  const v = (s || '').toLowerCase();
  if (v === 'active') return { bg: '#E6F4E6', fg: '#2E9B2E', label: 'On shift' };
  if (v === 'completed') return { bg: '#EEF1F5', fg: colors.metaGray, label: 'Completed' };
  if (v === 'cancelled' || v === 'missed') return { bg: '#FCE9E9', fg: colors.brandRedDark, label: v === 'missed' ? 'Missed' : 'Cancelled' };
  return { bg: '#EAF1FE', fg: colors.directionsBlue, label: 'Scheduled' };
};

export const ShiftDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [s, setS] = useState<any>(params.shift || {});
  const [busy, setBusy] = useState(false);

  const amb = s.ambulanceId || s.ambulance || {};
  const vehicle = [amb.registrationNumber, amb.ambulanceType].filter(Boolean).join(' · ') || '—';
  const clockedIn = !!s.clockInAt && !s.clockOutAt;
  const st = statusStyle(s.status);
  const ended = ['completed', 'cancelled', 'missed'].includes(String(s.status || '').toLowerCase()) || !!s.clockOutAt;

  const toggleClock = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res: any = clockedIn ? await staffApi.clockOut(s._id) : await staffApi.clockIn(s._id);
      // Reflect the new clock time locally (the API echoes the shift).
      const updated = res?.shift || res;
      if (updated && updated._id) setS({ ...s, ...updated });
      else setS({ ...s, ...(clockedIn ? { clockOutAt: new Date().toISOString() } : { clockInAt: new Date().toISOString(), status: 'active' }) });
    } catch (e: any) {
      Alert.alert(clockedIn ? 'Could not clock out' : 'Could not clock in', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Shift Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(30) }]}>
        <View style={[styles.card, cardShadow]}>
          <View style={styles.headRow}>
            <Text style={styles.date}>{fmtDate(s.startAt)}</Text>
            <View style={[styles.chip, { backgroundColor: st.bg }]}>
              <Text style={[styles.chipText, { color: st.fg }]}>{st.label}</Text>
            </View>
          </View>
          <Text style={styles.timeRange}>{fmtTime(s.startAt)} – {fmtTime(s.endAt)}</Text>
        </View>

        <View style={[styles.card, styles.gap, cardShadow]}>
          <Row k="Vehicle" v={vehicle} />
          <Row k="Role" v={s.role ? String(s.role).replace(/^\w/, (c: string) => c.toUpperCase()) : '—'} />
          <Row k="Clock in" v={s.clockInAt ? fmtTime(s.clockInAt) : 'Not yet'} />
          <Row k="Clock out" v={s.clockOutAt ? fmtTime(s.clockOutAt) : ended ? '—' : 'In progress'} />
          {!!s.notes && <Row k="Notes" v={s.notes} />}
        </View>

        <Text style={styles.help}>
          {clockedIn
            ? 'You are clocked in. Clock out when your shift ends — the time is recorded for your hours.'
            : ended
              ? 'This shift has ended. It stays here for your records.'
              : 'Clock in when your shift starts. After clock-out (or the shift window ends) it is marked completed.'}
        </Text>

        {!ended && (
          <Pressable
            disabled={busy}
            onPress={toggleClock}
            style={({ pressed }) => [styles.cta, clockedIn ? styles.clockOut : styles.clockIn, (pressed || busy) && styles.pressed]}
          >
            {busy ? <ActivityIndicator color={colors.textWhite} /> : <Text style={styles.ctaText}>{clockedIn ? 'Clock out' : 'Clock in'}</Text>}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={styles.rowV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6) },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  gap: { marginTop: verticalScale(14) },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: scale(10) },
  date: { flex: 1, fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack },
  chip: { borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: verticalScale(3) },
  chipText: { fontFamily: fonts.semiBold, fontSize: scale(11) },
  timeRange: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.directionsBlue, marginTop: verticalScale(8) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(8) },
  rowK: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  rowV: { flex: 1, textAlign: 'right', marginLeft: scale(12), fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
  help: { fontFamily: fonts.regular, fontSize: scale(12.5), color: colors.inkMuted, lineHeight: scale(18), marginTop: verticalScale(16), paddingHorizontal: scale(4) },
  cta: { height: verticalScale(50), borderRadius: scale(12), alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(18) },
  clockIn: { backgroundColor: colors.payGreen },
  clockOut: { backgroundColor: colors.brandRed },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
