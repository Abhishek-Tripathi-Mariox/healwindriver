import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { MinusIcon, PlusIcon } from '../components/icons';
import { staffApi } from '../api/staff';
import { useActiveDispatch } from '../state/dispatchStore';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

const VITALS = [
  { key: 'bp', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', placeholder: '72' },
  { key: 'spo2', label: 'SpO₂', unit: '%', placeholder: '98' },
  { key: 'temp', label: 'Temperature', unit: '°F', placeholder: '98.6' },
];

type Nav = NativeStackNavigationProp<RootStackParamList, 'CaseNotes'>;

export const CaseNotesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const active = useActiveDispatch();
  const [vitals, setVitals] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  // Supplies used on the patient — consumed from the ambulance's on-hand stock.
  const [stock, setStock] = useState<{ itemId: string; name: string; unit?: string; quantity: number }[]>([]);
  const [used, setUsed] = useState<Record<string, number>>({}); // itemId → qty

  // Case notes are recorded DURING transit — only once the patient is actually
  // onboard (dispatch reached ON_TRIP), not while still en route to them.
  const onboard = active?.status === 'ON_TRIP';

  useFocusEffect(
    React.useCallback(() => {
      if (!onboard) return;
      staffApi
        .myStock()
        .then((res: any) => setStock(res?.items || res?.data?.items || []))
        .catch(() => setStock([]));
    }, [onboard]),
  );

  const useItem = (itemId: string, max: number, delta: number) =>
    setUsed((s) => ({ ...s, [itemId]: Math.min(max, Math.max(0, (s[itemId] ?? 0) + delta)) }));

  const save = async () => {
    if (saving) return;
    if (!onboard) {
      Alert.alert('Patient not onboard yet', 'You can add case notes once the patient is picked up (trip started).');
      return;
    }
    // Require at least one vital, a note, OR a used supply so we don't save empty.
    const hasVitals = Object.values(vitals || {}).some((v) => String(v ?? '').trim());
    const usedItems = Object.entries(used)
      .filter(([, q]) => q > 0)
      .map(([itemId, q]) => ({ itemId, qty: q }));
    if (!hasVitals && !notes.trim() && usedItems.length === 0) {
      Alert.alert('Nothing to save', 'Enter a vital, a note, or the supplies used.');
      return;
    }
    setSaving(true);
    try {
      await staffApi.saveCaseNotes({
        dispatchId: active?.id,
        vitals,
        notes: notes.trim() || undefined,
      });
      // Consume supplies off the ambulance + bill the patient (in-transit).
      if (usedItems.length > 0 && active?.id) {
        const ref = active.kind === 'request'
          ? { requestId: active.id }
          : { dispatchId: active.id };
        await staffApi.consumeStock({ ...ref, items: usedItems }).catch(() => undefined);
      }
      Alert.alert('Saved', 'Case notes saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Case Notes" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(30) }]}>
        <View style={[styles.patientCard, cardShadow]}>
          <Text style={styles.patientName}>{active?.patient || 'No active case'}</Text>
          <Text style={styles.patientMeta}>
            {active ? `${active.pickup}${active.km ? ` · ${active.km} km` : ''}` : 'Notes will save unlinked'}
          </Text>
        </View>

        {!onboard ? (
          <View style={[styles.lockedCard, cardShadow]}>
            <Text style={styles.lockedTitle}>Case notes locked</Text>
            <Text style={styles.lockedText}>
              {active
                ? 'Case notes can be added once the patient is onboard (after you start the trip / pickup OTP).'
                : 'No active case. Case notes open once you are on an active dispatch and the patient is onboard.'}
            </Text>
          </View>
        ) : (
        <>
        <Text style={styles.section}>Vitals</Text>
        <View style={styles.vitals}>
          {VITALS.map((v) => (
            <View key={v.key} style={styles.vital}>
              <Text style={styles.vitalLabel}>{v.label}</Text>
              <View style={styles.vitalInputRow}>
                <TextInput
                  value={vitals[v.key] ?? ''}
                  onChangeText={(t) => setVitals((s) => ({ ...s, [v.key]: t }))}
                  placeholder={v.placeholder}
                  placeholderTextColor={colors.placeholder}
                  style={styles.vitalInput}
                />
                <Text style={styles.vitalUnit}>{v.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Patient condition, treatment given, observations…"
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
          style={styles.notes}
        />

        <Text style={styles.section}>Supplies used on patient</Text>
        {stock.length === 0 ? (
          <Text style={styles.suppliesEmpty}>No stock loaded on this ambulance. Request stock from the menu.</Text>
        ) : (
          stock.map((s) => {
            const q = used[s.itemId] ?? 0;
            return (
              <View key={s.itemId} style={[styles.supplyRow, cardShadow]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplyName}>{s.name}</Text>
                  <Text style={styles.supplyAvail}>{s.quantity} available{s.unit ? ` (${s.unit})` : ''}</Text>
                </View>
                <View style={styles.supplyStepper}>
                  <Pressable onPress={() => useItem(s.itemId, s.quantity, -1)} hitSlop={6} style={styles.supplyStep}><MinusIcon size={scale(15)} color={colors.textWhite} /></Pressable>
                  <Text style={styles.supplyQty}>{q}</Text>
                  <Pressable onPress={() => useItem(s.itemId, s.quantity, 1)} hitSlop={6} style={styles.supplyStep}><PlusIcon size={scale(15)} color={colors.textWhite} /></Pressable>
                </View>
              </View>
            );
          })
        )}

        <Pressable disabled={saving} onPress={save} style={({ pressed }) => [styles.cta, (pressed || saving) && styles.pressed]}>
          <Text style={styles.ctaText}>{saving ? 'Saving…' : 'Save Case Notes'}</Text>
        </Pressable>
        </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4) },
  patientCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  lockedCard: { backgroundColor: '#FFF7E6', borderRadius: radius.card, borderWidth: 1, borderColor: '#FCD9A0', padding: scale(16), marginTop: verticalScale(16) },
  lockedTitle: { fontFamily: fonts.bold, fontSize: scale(14), color: '#B45309', marginBottom: verticalScale(6) },
  lockedText: { fontFamily: fonts.medium, fontSize: scale(12.5), color: '#7A5B1E', lineHeight: scale(18) },
  suppliesEmpty: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted },
  supplyRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12), backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(12), marginBottom: verticalScale(10) },
  supplyName: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
  supplyAvail: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(2) },
  supplyStepper: { flexDirection: 'row', alignItems: 'center', gap: scale(10), backgroundColor: colors.brandRed, borderRadius: scale(8), paddingHorizontal: scale(8), height: verticalScale(30) },
  supplyStep: { width: scale(18), alignItems: 'center', justifyContent: 'center' },
  supplyQty: { fontFamily: fonts.bold, fontSize: scale(13), color: colors.textWhite, minWidth: scale(14), textAlign: 'center' },
  patientName: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack },
  patientMeta: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(5) },
  section: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack, marginTop: verticalScale(20), marginBottom: verticalScale(12) },
  vitals: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12) },
  vital: { width: '47%', flexGrow: 1 },
  vitalLabel: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginBottom: verticalScale(6) },
  vitalInputRow: { flexDirection: 'row', alignItems: 'center', height: verticalScale(46), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(12) },
  vitalInput: { flex: 1, fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack, padding: 0 },
  vitalUnit: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.metaGray },
  notes: { height: verticalScale(120), borderRadius: scale(12), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, padding: scale(14), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  cta: { height: verticalScale(50), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(22) },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
