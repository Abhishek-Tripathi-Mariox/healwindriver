import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Trip { id: string; patient: string; route: string; date: string; km: number }

type Nav = NativeStackNavigationProp<RootStackParamList, 'TripHistory'>;

export const TripHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffApi
      .dispatchHistory()
      .then((list: any[]) =>
        setTrips(
          list.map((d) => ({
            id: d.dispatchNumber || d._id || d.id,
            patient: d.patientName || d.patient?.name || 'Case',
            route: [d.pickup?.address, d.drop?.address].filter(Boolean).join(' → ') || '—',
            date: d.createdAt
              ? new Date(d.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '',
            km: d.distanceKm ?? d.km ?? 0,
          })),
        ),
      )
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Trip History" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(24) }]}>
        {loading && <Text style={styles.meta}>Loading…</Text>}
        {!loading && trips.length === 0 && <Text style={styles.meta}>No trips yet.</Text>}
        {trips.map((t) => (
          <View key={t.id} style={[styles.card, cardShadow]}>
            <View style={styles.top}>
              <Text style={styles.patient}>{t.patient}</Text>
              <Text style={styles.id}>{t.id}</Text>
            </View>
            <Text style={styles.route}>{t.route}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{t.date}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{t.km} km</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4), gap: verticalScale(14) },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patient: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  id: { fontFamily: fonts.medium, fontSize: scale(11), color: colors.metaGray },
  route: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(6) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginTop: verticalScale(10) },
  meta: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.metaGray },
  dot: { color: colors.metaGray },
});
