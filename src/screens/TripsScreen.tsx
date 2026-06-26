import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { driverApi } from '../api/driver';
import { dispatchStore, useActiveDispatch } from '../state/dispatchStore';
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
  raw: any;
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
    raw: b,
  };
};

// Reshape a booking row into the fields TripDetailScreen reads (it's shared
// with the SOS/dispatch flow), so the detail shows real data instead of dashes.
const toDetail = (t: Trip): any => {
  const b = t.raw || {};
  const lat = b.pickup?.lat ?? b.pickupLat;
  const lng = b.pickup?.lng ?? b.pickupLng;
  return {
    ...b,
    _id: b._id || t.id,
    ref: b.bookingNumber || t.id,
    patientName: t.patient,
    patientPhone: b.patientPhone || b.user?.phone || b.userId?.mobileNumber,
    address: b.pickup?.address || b.drop?.address,
    coords: lat != null && lng != null ? { lat, lng } : undefined,
    vehicle: b.vehicleNumber || b.vehicle || b.ambulance?.registrationNumber,
    distanceKm: t.km,
    dispatchedAt: b.createdAt,
    completedAt: b.completedAt,
    cancelledAt: b.cancelledAt,
    status: t.status === 'cancelled' ? 'CANCELLED' : 'COMPLETED',
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
  // The in-progress ride (if any). bookingHistory only returns finished trips,
  // so the active ride was never shown — pull it from the dispatch store.
  const active = useActiveDispatch();
  const autoSwitched = useRef(false);

  useEffect(() => {
    // Refresh the active ride so it shows even if this screen is opened cold.
    dispatchStore.hydrate('driver').catch(() => undefined);
    driverApi
      .bookingHistory()
      .then((list) => setTrips(list.map(mapTrip)))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  // Land on the Active tab once when there's a live ride (respecting any later
  // manual tab switch).
  useEffect(() => {
    if (active && !autoSwitched.current) {
      autoSwitched.current = true;
      setTab('active');
    }
  }, [active]);

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
          active ? (
            <Pressable
              onPress={() => navigation.navigate('ActiveDispatch' as never)}
              style={({ pressed }) => [styles.card, cardShadow, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.patient}>{active.patient}</Text>
                {!!active.fare && <Text style={styles.fare}>{active.fare}</Text>}
              </View>
              <Text style={styles.route}>
                {[active.pickup, active.drop].filter(Boolean).join(' → ') || '—'}
              </Text>
              <View style={styles.metaRow}>
                {active.km > 0 && <Text style={styles.meta}>{active.km} km</Text>}
                {active.km > 0 && active.eta > 0 && <Text style={styles.dot}>·</Text>}
                {active.eta > 0 && <Text style={styles.meta}>ETA {active.eta} min</Text>}
                <View style={[styles.chip, { backgroundColor: '#EAF1FE' }]}>
                  <Text style={[styles.chipText, { color: colors.directionsBlue }]}>
                    {active.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <Text style={styles.empty}>No active trip right now.</Text>
          )
        ) : loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : trips.length === 0 ? (
          <Text style={styles.empty}>No past trips.</Text>
        ) : (
          trips.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => navigation.navigate('TripDetail', { trip: toDetail(t) })}
              style={({ pressed }) => [styles.card, cardShadow, pressed && { opacity: 0.85 }]}
            >
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
            </Pressable>
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
