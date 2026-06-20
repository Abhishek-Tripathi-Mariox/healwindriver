import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TripHistory'>;

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const statusStyle = (s: string) =>
  s === 'COMPLETED'
    ? { bg: '#E6F4E6', fg: '#2E9B2E', label: 'Completed' }
    : s === 'CANCELLED'
      ? { bg: '#FCE9E9', fg: colors.brandRedDark, label: 'Cancelled' }
      : { bg: '#EAF1FE', fg: colors.directionsBlue, label: s };

export const TripHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffApi
      .dispatchHistory()
      .then((list: any[]) => setTrips(list || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Trip History" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator color={colors.directionsBlue} style={{ marginTop: verticalScale(40) }} />
      ) : trips.length === 0 ? (
        <Text style={styles.empty}>No trips yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(24) }]}>
          {trips.map((t) => {
            const st = statusStyle(t.status);
            return (
              <Pressable
                key={t._id}
                onPress={() => navigation.navigate('TripDetail', { trip: t })}
                style={({ pressed }) => [styles.card, cardShadow, pressed && styles.pressed]}
              >
                <View style={styles.top}>
                  <Text style={styles.patient} numberOfLines={1}>{t.patientName || 'Emergency patient'}</Text>
                  <View style={[styles.chip, { backgroundColor: st.bg }]}>
                    <Text style={[styles.chipText, { color: st.fg }]}>{st.label}</Text>
                  </View>
                </View>
                {!!t.address && (
                  <View style={styles.row}>
                    <View style={styles.pin} />
                    <Text style={styles.address} numberOfLines={2}>{t.address}</Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{fmtDate(t.completedAt || t.cancelledAt || t.createdAt)}</Text>
                  {t.distanceKm > 0 && <Text style={styles.meta}>· {t.distanceKm} km</Text>}
                  {!!t.vehicle && <Text style={styles.meta}>· {t.vehicle}</Text>}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', marginTop: verticalScale(50), fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted },
  list: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6), gap: verticalScale(12) },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: scale(10) },
  patient: { flex: 1, fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  chip: { borderRadius: scale(6), paddingHorizontal: scale(9), paddingVertical: verticalScale(3) },
  chipText: { fontFamily: fonts.semiBold, fontSize: scale(10) },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: scale(8), marginTop: verticalScale(8) },
  pin: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: colors.directionsBlue, marginTop: verticalScale(5) },
  address: { flex: 1, fontFamily: fonts.regular, fontSize: scale(12.5), color: colors.inkMuted, lineHeight: scale(17) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginTop: verticalScale(10), flexWrap: 'wrap' },
  meta: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.metaGray },
});
