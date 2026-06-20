import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { ClockIcon } from '../components/icons';
import { staffApi } from '../api/staff';
import { useAuth } from '../state/authStore';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Shift {
  id: string;
  day: string;
  time: string;
  vehicle: string;
  state: 'now' | 'upcoming' | 'done';
  clockedIn: boolean;
  raw: any;
}

const fmtDay = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
};
const fmtTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// Shift model fields: startAt / endAt (Date), ambulanceId (populated), status.
const mapShift = (s: any): Shift => {
  const amb = s.ambulanceId || s.ambulance || {};
  const reg = amb.registrationNumber || '';
  const type = amb.ambulanceType || amb.type || '';
  const clockedIn = !!s.clockInAt && !s.clockOutAt;
  const status = String(s.status || '').toLowerCase();
  let state: Shift['state'] = 'upcoming';
  if (clockedIn || status === 'active') state = 'now';
  else if (status === 'completed' || status === 'cancelled' || status === 'missed' || s.clockOutAt) state = 'done';
  return {
    id: String(s._id || s.id || ''),
    day: fmtDay(s.startAt) || 'Shift',
    time: s.startAt && s.endAt ? `${fmtTime(s.startAt)} – ${fmtTime(s.endAt)}` : fmtTime(s.startAt),
    vehicle: [reg, type].filter(Boolean).join(' · '),
    state,
    clockedIn,
    raw: s,
  };
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'Shifts'>;

export const ShiftsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { role } = useAuth();
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (role !== 'staff') {
      setShifts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    staffApi
      .shifts()
      .then((list: any[]) => setShifts(list.map(mapShift).filter((s) => s.id)))
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, [role]);

  useFocusEffect(React.useCallback(() => load(), [load]));

  const toggleClock = async (s: Shift) => {
    if (busy) return;
    setBusy(s.id);
    try {
      if (s.clockedIn) await staffApi.clockOut(s.id);
      else await staffApi.clockIn(s.id);
      load();
    } catch (e: any) {
      Alert.alert(
        s.clockedIn ? 'Could not clock out' : 'Could not clock in',
        e?.message || 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="My Shifts" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: verticalScale(40) }} color={colors.directionsBlue} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(24) }]}>
          {shifts.length === 0 ? (
            <Text style={styles.note}>No shifts assigned yet.</Text>
          ) : (
            shifts.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => navigation.navigate('ShiftDetail', { shift: s.raw })}
                style={({ pressed }) => [styles.card, cardShadow, pressed && styles.pressed]}
              >
                <View style={styles.iconWrap}>
                  <ClockIcon size={scale(22)} color={colors.directionsBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.day}>{s.day}</Text>
                  {!!s.time && <Text style={styles.time}>{s.time}</Text>}
                  {!!s.vehicle && <Text style={styles.vehicle}>{s.vehicle}</Text>}
                  {s.state === 'now' && <Text style={styles.live}>● On shift</Text>}
                </View>
                {s.state !== 'done' ? (
                  <Pressable
                    disabled={busy === s.id}
                    onPress={() => toggleClock(s)}
                    style={[styles.clock, s.clockedIn ? styles.clockOut : styles.clockIn, busy === s.id && styles.pressed]}
                  >
                    <Text style={styles.clockText}>{s.clockedIn ? 'Clock out' : 'Clock in'}</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.badge, styles.badgeDone]}>Done</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4), gap: verticalScale(14) },
  card: { flexDirection: 'row', alignItems: 'center', gap: scale(14), backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  iconWrap: { width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  day: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  time: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.textPrimary, marginTop: verticalScale(3) },
  vehicle: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(3) },
  live: { fontFamily: fonts.semiBold, fontSize: scale(11), color: '#2E9B2E', marginTop: verticalScale(4) },
  clock: { paddingHorizontal: scale(14), height: verticalScale(36), borderRadius: scale(10), alignItems: 'center', justifyContent: 'center' },
  clockIn: { backgroundColor: colors.payGreen },
  clockOut: { backgroundColor: colors.brandRed },
  clockText: { fontFamily: fonts.bold, fontSize: scale(12), color: colors.textWhite },
  pressed: { opacity: 0.7 },
  badge: { fontFamily: fonts.semiBold, fontSize: scale(12), color: colors.directionsBlue },
  badgeDone: { color: colors.metaGray },
  note: { fontFamily: fonts.regular, fontSize: scale(13), color: colors.inkMuted, textAlign: 'center', marginTop: verticalScale(40) },
});
