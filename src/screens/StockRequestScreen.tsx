import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppAlert } from '../services/appAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { BoxIcon, MinusIcon, PlusIcon } from '../components/icons';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type CatalogItem = { _id: string; name: string; unit?: string; sellingPrice?: number; centralStock?: number };
type StockItem = { itemId: string; name: string; unit?: string; quantity: number };
type Nav = NativeStackNavigationProp<RootStackParamList, 'StockRequest'>;

export const StockRequestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [onHand, setOnHand] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({}); // keyed by itemId
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    staffApi
      .inventoryCatalog()
      .then((items) => alive && setCatalog(items))
      .catch(() => alive && setCatalog([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Refresh the crew's on-hand stock whenever the screen focuses.
  useFocusEffect(
    React.useCallback(() => {
      staffApi
        .myStock()
        .then((res: any) => setOnHand(res?.items || res?.data?.items || []))
        .catch(() => setOnHand([]));
    }, []),
  );

  const set = (id: string, delta: number) => setQty((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 0) + delta) }));
  const totalItems = Object.values(qty).reduce((n, q) => n + q, 0);

  const submit = async () => {
    if (totalItems === 0 || saving) return;
    const items = catalog
      .filter((c) => (qty[c._id] ?? 0) > 0)
      .map((c) => ({ itemId: c._id, name: c.name, qty: qty[c._id] }));
    setSaving(true);
    try {
      await staffApi.stockRequest(items);
      setSent(true);
      setQty({});
    } catch (e: any) {
      AppAlert.alert('Request failed', e?.message || 'Could not submit your stock request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Stock Update Request" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(110) }]}>
        {sent && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Request submitted — control room will restock your unit.</Text>
          </View>
        )}

        {/* Current stock on this ambulance */}
        <Text style={styles.section}>On your ambulance</Text>
        {onHand.length === 0 ? (
          <Text style={styles.empty}>No stock loaded yet.</Text>
        ) : (
          <View style={[styles.stockCard, cardShadow]}>
            {onHand.map((s) => (
              <View key={s.itemId} style={styles.stockRow}>
                <Text style={styles.stockName}>{s.name}</Text>
                <Text style={styles.stockQty}>{s.quantity}{s.unit ? ` ${s.unit}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.section}>Request more</Text>
        {loading ? (
          <ActivityIndicator color={colors.directionsBlue} style={{ marginTop: verticalScale(16) }} />
        ) : catalog.length === 0 ? (
          <Text style={styles.empty}>No inventory items available.</Text>
        ) : (
          catalog.map((item) => {
            const q = qty[item._id] ?? 0;
            return (
              <View key={item._id} style={[styles.row, cardShadow]}>
                <View style={styles.icon}><BoxIcon size={scale(20)} color={colors.directionsBlue} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.unit && <Text style={styles.unit}>per {item.unit}</Text>}
                </View>
                <View style={styles.stepper}>
                  <Pressable onPress={() => set(item._id, -1)} hitSlop={6} style={styles.step}><MinusIcon size={scale(16)} color={colors.textWhite} /></Pressable>
                  <Text style={styles.qty}>{q}</Text>
                  <Pressable onPress={() => set(item._id, 1)} hitSlop={6} style={styles.step}><PlusIcon size={scale(16)} color={colors.textWhite} /></Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + verticalScale(10) }]}>
        <Text style={styles.barCount}>{totalItems} item(s) selected</Text>
        <Pressable
          disabled={totalItems === 0}
          onPress={submit}
          style={({ pressed }) => [styles.submit, totalItems === 0 && styles.submitDisabled, pressed && totalItems > 0 && styles.pressed]}
        >
          <Text style={styles.submitText}>Submit Request</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4), gap: verticalScale(12) },
  banner: { backgroundColor: '#E6F4E6', borderRadius: radius.card, padding: scale(14) },
  bannerText: { fontFamily: fonts.medium, fontSize: scale(13), color: '#2E7D32' },
  row: { flexDirection: 'row', alignItems: 'center', gap: scale(12), backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(14) },
  icon: { width: scale(40), height: scale(40), borderRadius: scale(12), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
  unit: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(2) },
  section: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.textBlack, marginTop: verticalScale(6) },
  empty: { fontFamily: fonts.medium, fontSize: scale(12.5), color: colors.inkMuted },
  stockCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(14), gap: verticalScale(8) },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockName: { flex: 1, fontFamily: fonts.medium, fontSize: scale(13), color: colors.textBlack },
  stockQty: { fontFamily: fonts.bold, fontSize: scale(13), color: colors.payGreen },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: scale(10), backgroundColor: colors.directionsBlue, borderRadius: scale(8), paddingHorizontal: scale(8), height: verticalScale(32) },
  step: { width: scale(20), alignItems: 'center', justifyContent: 'center' },
  qty: { fontFamily: fonts.bold, fontSize: scale(13), color: colors.textWhite, minWidth: scale(16), textAlign: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: '#ECECEC', paddingHorizontal: spacing.lg, paddingTop: verticalScale(12) },
  barCount: {
    fontFamily: fonts.bold,
    fontSize: scale(13),
    color: colors.directionsBlue,
    backgroundColor: '#EAF1FE',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  submit: { paddingHorizontal: scale(24), height: verticalScale(48), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { backgroundColor: '#A9BEE6' },
  pressed: { opacity: 0.85 },
  submitText: { fontFamily: fonts.bold, fontSize: scale(15), color: colors.textWhite },
});
