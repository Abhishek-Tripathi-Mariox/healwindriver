import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Fab, ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Leave { id: string; type: string; day: string; from: string; to: string; reason?: string; status: string }

type Nav = NativeStackNavigationProp<RootStackParamList, 'ApplyLeave'>;

const statusColor = (s: string) => (s === 'Approved' ? '#2E9B2E' : s === 'Rejected' ? colors.brandRedDark : colors.directionsBlue);
const statusBg = (s: string) => (s === 'Approved' ? '#E6F4E6' : s === 'Rejected' ? '#FCE9E9' : '#EAF1FE');

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

export const ApplyLeaveScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [leaves, setLeaves] = React.useState<Leave[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      staffApi
        .leaves()
        .then((list: any[]) =>
          setLeaves(
            list.map((l) => ({
              id: l._id || l.id,
              type: l.type,
              day: l.day,
              from: fmt(l.fromDate || l.from),
              to: fmt(l.toDate || l.to),
              reason: l.reason,
              status: l.status || 'Pending',
            })),
          ),
        )
        .catch(() => setLeaves([]));
    }, []),
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="Leave Management" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(90) }]}>
        {leaves.length === 0 ? (
          <Text style={styles.empty}>No leaves applied yet.</Text>
        ) : (
          leaves.map((l) => (
            <View key={l.id} style={[styles.card, cardShadow]}>
              <View style={styles.top}>
                <Text style={styles.type}>{l.type} Leave · {l.day}</Text>
                <View style={[styles.chip, { backgroundColor: statusBg(l.status) }]}>
                  <Text style={[styles.chipText, { color: statusColor(l.status) }]}>{l.status}</Text>
                </View>
              </View>
              <Text style={styles.dates}>{l.from} → {l.to}</Text>
              {!!l.reason && <Text style={styles.reason}>{l.reason}</Text>}
            </View>
          ))
        )}
      </ScrollView>
      <Fab icon="plus" onPress={() => navigation.navigate('AddLeave')} accessibilityLabel="Apply leave" style={[styles.fab, { bottom: insets.bottom + verticalScale(20) }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4), gap: verticalScale(14) },
  empty: { textAlign: 'center', fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted, marginTop: verticalScale(40) },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  chip: { borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: verticalScale(3) },
  chipText: { fontFamily: fonts.semiBold, fontSize: scale(11) },
  dates: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.textPrimary, marginTop: verticalScale(8) },
  reason: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(6) },
  fab: { position: 'absolute', right: spacing.lg },
});
