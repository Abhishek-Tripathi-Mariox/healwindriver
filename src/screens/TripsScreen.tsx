import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { driverApi } from '../api/driver';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Trip {
  id: string;
  patient: string;
  route: string;
  date: string;
  km: number;
  fare: string;
  status: 'completed' | 'cancelled';
}

const mapTrip = (b: any): Trip => {
  const st = String(b.status || '').toUpperCase();
  return {
    id: b.bookingNumber || b._id || b.id,
    patient: b.patientName || b.userId?.fullName || b.user?.fullName || 'Patient',
    route: [b.pickup?.address, b.drop?.address].filter(Boolean).join(' → ') || '—',
    date: b.createdAt
      ? new Date(b.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '',
    km: b.distanceKm ?? b.km ?? 0,
    fare: `₹ ${b.finalFare ?? b.fare ?? b.amount ?? 0}`,
    status: st === 'CANCELLED' ? 'cancelled' : 'completed',
  };
};

type Tab = 'active' | 'past';
type Nav = NativeStackNavigationProp<RootStackParamList, 'Trips'>;

export const TripsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('past');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverApi
      .bookingHistory()
      .then((list) => setTrips(list.map(mapTrip)))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <ScreenHeader title="My Trips" onBack={() => navigation.goBack()} />
      <View style={styles.tabs}>
        {(['active', 'past'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'active' ? 'Active' : 'Past trips'}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(24) }]}>
        {tab === 'active' ? (
          <Text style={styles.empty}>No active trip right now.</Text>
        ) : loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : trips.length === 0 ? (
          <Text style={styles.empty}>No past trips.</Text>
        ) : (
          trips.map((t) => (
            <View key={t.id} style={[styles.card, cardShadow]}>
              <View style={styles.cardTop}>
                <Text style={styles.patient}>{t.patient}</Text>
                <Text style={styles.fare}>{t.fare}</Text>
              </View>
              <Text style={styles.route}>{t.route}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{t.date}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.meta}>{t.km} km</Text>
                <View style={[styles.chip, { backgroundColor: t.status === 'completed' ? '#E6F4E6' : '#FCE9E9' }]}>
                  <Text style={[styles.chipText, { color: t.status === 'completed' ? '#2E9B2E' : colors.brandRedDark }]}>
                    {t.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', gap: scale(14), paddingHorizontal: spacing.lg, marginBottom: verticalScale(6) },
  tab: { paddingHorizontal: scale(18), height: verticalScale(35), borderRadius: scale(15), backgroundColor: colors.tabInactive, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.tabActive },
  tabText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: '#5B5B5B' },
  tabTextActive: { color: '#262626' },
  list: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(14), gap: verticalScale(14) },
  empty: { textAlign: 'center', fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted, marginTop: verticalScale(40) },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patient: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  fare: { fontFamily: fonts.bold, fontSize: scale(15), color: colors.textBlack },
  route: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(6) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginTop: verticalScale(10) },
  meta: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.metaGray },
  dot: { color: colors.metaGray },
  chip: { marginLeft: 'auto', borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: verticalScale(3) },
  chipText: { fontFamily: fonts.semiBold, fontSize: scale(11) },
});
