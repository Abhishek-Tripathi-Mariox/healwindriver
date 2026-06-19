import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { BoxIcon, MinusIcon, PlusIcon } from '../components/icons';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

const ITEMS = ['Oxygen Cylinder', 'Disposable Gloves (box)', 'Bandages', 'Normal Saline (500ml)', 'Syringes (10ml)', 'IV Cannula'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'StockRequest'>;

export const StockRequestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: string, delta: number) => setQty((s) => ({ ...s, [k]: Math.max(0, (s[k] ?? 0) + delta) }));
  const totalItems = Object.values(qty).reduce((n, q) => n + q, 0);

  const submit = async () => {
    if (totalItems === 0 || saving) return;
    const items = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([name, q]) => ({ name, qty: q }));
    setSaving(true);
    try {
      await staffApi.stockRequest(items);
      setSent(true);
      setQty({});
    } catch (e: any) {
      // Surface real failures instead of faking success.
      Alert.alert('Request failed', e?.message || 'Could not submit your stock request. Please try again.');
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
        {ITEMS.map((item) => {
          const q = qty[item] ?? 0;
          return (
            <View key={item} style={[styles.row, cardShadow]}>
              <View style={styles.icon}><BoxIcon size={scale(20)} color={colors.directionsBlue} /></View>
              <Text style={styles.name}>{item}</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => set(item, -1)} hitSlop={6} style={styles.step}><MinusIcon size={scale(16)} color={colors.textWhite} /></Pressable>
                <Text style={styles.qty}>{q}</Text>
                <Pressable onPress={() => set(item, 1)} hitSlop={6} style={styles.step}><PlusIcon size={scale(16)} color={colors.textWhite} /></Pressable>
              </View>
            </View>
          );
        })}
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
  name: { flex: 1, fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: scale(10), backgroundColor: colors.directionsBlue, borderRadius: scale(8), paddingHorizontal: scale(8), height: verticalScale(32) },
  step: { width: scale(20), alignItems: 'center', justifyContent: 'center' },
  qty: { fontFamily: fonts.bold, fontSize: scale(13), color: colors.textWhite, minWidth: scale(16), textAlign: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: '#ECECEC', paddingHorizontal: spacing.lg, paddingTop: verticalScale(12) },
  barCount: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  submit: { paddingHorizontal: scale(24), height: verticalScale(48), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { backgroundColor: '#A9BEE6' },
  pressed: { opacity: 0.85 },
  submitText: { fontFamily: fonts.bold, fontSize: scale(15), color: colors.textWhite },
});
