import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
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

  const save = async () => {
    if (saving) return;
    // Require at least one vital or a note so we don't save an empty record.
    const hasVitals = Object.values(vitals || {}).some((v) => String(v ?? '').trim());
    if (!hasVitals && !notes.trim()) {
      Alert.alert('Nothing to save', 'Enter at least one vital reading or a note.');
      return;
    }
    setSaving(true);
    try {
      await staffApi.saveCaseNotes({
        dispatchId: active?.id,
        vitals,
        notes: notes.trim() || undefined,
      });
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

        <Pressable disabled={saving} onPress={save} style={({ pressed }) => [styles.cta, (pressed || saving) && styles.pressed]}>
          <Text style={styles.ctaText}>{saving ? 'Saving…' : 'Save Case Notes'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4) },
  patientCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
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
