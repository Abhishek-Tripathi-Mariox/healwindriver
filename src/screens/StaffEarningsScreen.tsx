import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StaffEarnings'>;

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export const StaffEarningsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [summary, setSummary] = React.useState<any>(null);
  const [trips, setTrips] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      staffApi
        .earnings()
        .then((d: any) => {
          setSummary(d?.summary || null);
          setTrips(d?.trips || []);
        })
        .catch(() => {
          setSummary(null);
          setTrips([]);
        })
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="Earnings" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator color={colors.directionsBlue} style={{ marginTop: verticalScale(40) }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(24) }]}>
          <View style={[styles.totalCard, cardShadow]}>
            <Text style={styles.totalLabel}>Total earnings</Text>
            <Text style={styles.totalValue}>₹{summary?.total ?? 0}</Text>
            <Text style={styles.tripCount}>{summary?.tripCount ?? 0} completed trips</Text>
          </View>

          <View style={styles.statRow}>
            <Stat label="Today" value={summary?.today ?? 0} />
            <Stat label="This week" value={summary?.thisWeek ?? 0} />
            <Stat label="This month" value={summary?.thisMonth ?? 0} />
          </View>

          <Text style={styles.section}>Trip payouts</Text>
          {trips.length === 0 ? (
            <Text style={styles.empty}>No completed trips yet.</Text>
          ) : (
            trips.map((t, i) => (
              <View key={t.dispatchId || i} style={[styles.row, cardShadow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t.serviceName || 'Trip'}</Text>
                  <Text style={styles.rowMeta}>
                    {t.role === 'driver' ? 'As driver' : 'As attendant'}
                    {t.distanceKm ? ` · ${t.distanceKm} km` : ''} · {fmt(t.completedAt)}
                  </Text>
                </View>
                <Text style={styles.rowAmt}>₹{t.amount}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={[styles.stat, cardShadow]}>
    <Text style={styles.statValue}>₹{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6) },
  totalCard: { backgroundColor: colors.directionsBlue, borderRadius: radius.card, padding: scale(20), alignItems: 'center' },
  totalLabel: { fontFamily: fonts.medium, fontSize: scale(13), color: 'rgba(255,255,255,0.85)' },
  totalValue: { fontFamily: fonts.bold, fontSize: scale(32), color: colors.textWhite, marginTop: verticalScale(4) },
  tripCount: { fontFamily: fonts.regular, fontSize: scale(12), color: 'rgba(255,255,255,0.85)', marginTop: verticalScale(6) },
  statRow: { flexDirection: 'row', gap: scale(10), marginTop: verticalScale(14) },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(12), alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack },
  statLabel: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(4) },
  section: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack, marginTop: verticalScale(22), marginBottom: verticalScale(12) },
  empty: { textAlign: 'center', marginTop: verticalScale(20), fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(14), marginBottom: verticalScale(10) },
  rowTitle: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  rowMeta: { fontFamily: fonts.regular, fontSize: scale(11.5), color: colors.inkMuted, marginTop: verticalScale(4) },
  rowAmt: { fontFamily: fonts.bold, fontSize: scale(15), color: '#2E9B2E' },
});
