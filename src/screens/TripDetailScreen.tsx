import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
type Rt = RouteProp<RootStackParamList, 'TripDetail'>;

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const statusStyle = (s: string) =>
  s === 'COMPLETED'
    ? { bg: '#E6F4E6', fg: '#2E9B2E', label: 'Completed' }
    : s === 'CANCELLED'
      ? { bg: '#FCE9E9', fg: colors.brandRedDark, label: 'Cancelled' }
      : { bg: '#EAF1FE', fg: colors.directionsBlue, label: s };

export const TripDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const t = params.trip || {};
  const st = statusStyle(t.status);

  const openMap = () => {
    if (t.coords?.lat == null) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${t.coords.lat},${t.coords.lng}`).catch(() => undefined);
  };
  const call = () => {
    if (!t.patientPhone || t.patientPhone === 'N/A') return;
    Linking.openURL(`tel:${t.patientPhone}`).catch(() => undefined);
  };

  const rows: [string, string][] = [
    ['Trip ref', t.ref || String(t._id || '').slice(-6).toUpperCase()],
    ['Vehicle', t.vehicle || '—'],
    ['Distance', t.distanceKm > 0 ? `${t.distanceKm} km` : '—'],
    ...(t.etaMinutes ? [['ETA at dispatch', `${t.etaMinutes} min`] as [string, string]] : []),
    ['Dispatched at', fmt(t.dispatchedAt)],
    ...(t.status === 'COMPLETED' ? [['Completed at', fmt(t.completedAt)] as [string, string]] : []),
    ...(t.status === 'CANCELLED' ? [['Cancelled at', fmt(t.cancelledAt)] as [string, string]] : []),
  ];

  return (
    <View style={styles.root}>
      <ScreenHeader title="Trip Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(30) }]}>
        {/* Patient + status */}
        <View style={[styles.card, cardShadow]}>
          <View style={styles.headRow}>
            <Text style={styles.name}>{t.patientName || 'Emergency patient'}</Text>
            <View style={[styles.chip, { backgroundColor: st.bg }]}>
              <Text style={[styles.chipText, { color: st.fg }]}>{st.label}</Text>
            </View>
          </View>
          {!!t.patientPhone && t.patientPhone !== 'N/A' && (
            <Pressable onPress={call}>
              <Text style={styles.phone}>📞 {t.patientPhone}</Text>
            </Pressable>
          )}
        </View>

        {/* Pickup location */}
        <View style={[styles.card, styles.gap, cardShadow]}>
          <Text style={styles.sectionTitle}>Pickup location</Text>
          <View style={styles.locRow}>
            <View style={styles.pin} />
            <Text style={styles.address}>{t.address || (t.coords ? `${t.coords.lat?.toFixed(5)}, ${t.coords.lng?.toFixed(5)}` : 'Location not recorded')}</Text>
          </View>
          {t.coords?.lat != null && (
            <Pressable onPress={openMap} style={({ pressed }) => [styles.mapBtn, pressed && styles.pressed]}>
              <Text style={styles.mapBtnText}>Open in Maps</Text>
            </Pressable>
          )}
        </View>

        {/* Trip facts */}
        <View style={[styles.card, styles.gap, cardShadow]}>
          {rows.map(([k, v]) => (
            <View key={k} style={styles.factRow}>
              <Text style={styles.factK}>{k}</Text>
              <Text style={styles.factV}>{v}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6) },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  gap: { marginTop: verticalScale(14) },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: scale(10) },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: scale(17), color: colors.textBlack },
  chip: { borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: verticalScale(3) },
  chipText: { fontFamily: fonts.semiBold, fontSize: scale(11) },
  phone: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.directionsBlue, marginTop: verticalScale(8) },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.inkMuted, marginBottom: verticalScale(10) },
  locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: scale(10) },
  pin: { width: scale(10), height: scale(10), borderRadius: scale(5), backgroundColor: colors.brandRedDark, marginTop: verticalScale(4) },
  address: { flex: 1, fontFamily: fonts.medium, fontSize: scale(14), color: colors.textBlack, lineHeight: scale(20) },
  mapBtn: { marginTop: verticalScale(14), height: verticalScale(42), borderRadius: scale(10), borderWidth: 1.5, borderColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  mapBtnText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.directionsBlue },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(7) },
  factK: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  factV: { flex: 1, textAlign: 'right', marginLeft: scale(12), fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
});
