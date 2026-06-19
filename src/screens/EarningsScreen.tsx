import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { WalletIcon } from '../components/icons';
import { driverApi } from '../api/driver';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface LedgerRow { id: string; date: string; km: number; amount: number }

type Range = 'week' | 'month';
type Nav = NativeStackNavigationProp<RootStackParamList, 'Earnings'>;

export const EarningsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [range, setRange] = useState<Range>('week');
  const [total, setTotal] = useState(0);
  const [trips, setTrips] = useState(0);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);

  useEffect(() => {
    driverApi
      .earnings(range)
      .then((d: any) => {
        setTotal(d?.totalEarnings ?? d?.total ?? 0);
        setTrips(d?.totalTrips ?? d?.trips ?? 0);
      })
      .catch(() => {
        setTotal(0);
        setTrips(0);
      });
  }, [range]);

  useEffect(() => {
    driverApi
      .earningsHistory()
      .then((list: any[]) =>
        setLedger(
          list.map((b) => ({
            id: b.bookingNumber || b._id || b.id,
            date: b.createdAt
              ? new Date(b.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '',
            km: b.distanceKm ?? b.km ?? 0,
            amount: b.finalFare ?? b.fare ?? b.amount ?? 0,
          })),
        ),
      )
      .catch(() => setLedger([]));
  }, []);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Earnings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(24) }]}>
        <View style={styles.toggle}>
          {(['week', 'month'] as Range[]).map((r) => (
            <Pressable key={r} onPress={() => setRange(r)} style={[styles.seg, range === r && styles.segActive]}>
              <Text style={[styles.segText, range === r && styles.segTextActive]}>{r === 'week' ? 'This week' : 'This month'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.totalCard, cardShadow]}>
          <View style={styles.walletIcon}><WalletIcon size={scale(26)} color={colors.textWhite} /></View>
          <Text style={styles.totalLabel}>Total earnings</Text>
          <Text style={styles.totalValue}>₹ {total.toLocaleString('en-IN')}</Text>
          <Text style={styles.totalSub}>{trips} trips · {range === 'week' ? 'last 7 days' : 'this month'}</Text>
        </View>

        <Text style={styles.section}>Trip ledger</Text>
        {ledger.length === 0 && <Text style={styles.rowMeta}>No earnings yet.</Text>}
        {ledger.map((t) => (
          <View key={t.id} style={[styles.row, cardShadow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowId}>{t.id}</Text>
              <Text style={styles.rowMeta}>{t.date} · {t.km} km</Text>
            </View>
            <Text style={styles.rowAmount}>+₹{t.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4) },
  toggle: { flexDirection: 'row', backgroundColor: colors.tabInactive, borderRadius: scale(12), padding: scale(4) },
  seg: { flex: 1, height: verticalScale(38), borderRadius: scale(9), alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.surface, ...cardShadow },
  segText: { fontFamily: fonts.semiBold, fontSize: scale(13), color: '#5B5B5B' },
  segTextActive: { color: colors.textBlack },
  totalCard: { backgroundColor: colors.directionsBlue, borderRadius: radius.card, padding: scale(20), marginTop: verticalScale(18), alignItems: 'center' },
  walletIcon: { width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontFamily: fonts.medium, fontSize: scale(13), color: 'rgba(255,255,255,0.85)', marginTop: verticalScale(12) },
  totalValue: { fontFamily: fonts.bold, fontSize: scale(32), color: colors.textWhite, marginTop: verticalScale(4) },
  totalSub: { fontFamily: fonts.medium, fontSize: scale(12), color: 'rgba(255,255,255,0.85)', marginTop: verticalScale(4) },
  section: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack, marginTop: verticalScale(22), marginBottom: verticalScale(12) },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), marginBottom: verticalScale(12) },
  rowId: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  rowMeta: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(4) },
  rowAmount: { fontFamily: fonts.bold, fontSize: scale(15), color: '#2E9B2E' },
});
