import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const GENDERS = ['Male', 'Female', 'Other'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'AddPatient'>;

export const AddPatientScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [f, setF] = useState({ name: '', mobile: '', dob: '', pincode: '' });
  const [gender, setGender] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const onSave = async () => {
    if (saving) return;
    // This registers a real hospital patient, so name, mobile and gender are
    // required (they're mandatory on the hospital patient record).
    if (!f.name.trim()) {
      setErr('Patient name is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(f.mobile.trim())) {
      setErr('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!gender) {
      setErr('Please select a gender.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      await staffApi.addPatient({
        name: f.name.trim(),
        mobile: f.mobile.trim(),
        dob: f.dob.trim() || undefined,
        gender: gender ?? undefined,
        pincode: f.pincode.trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      setErr(e?.message || 'Could not save patient.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Add Patient" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(30) }]}>
        <Input label="Patient Name" value={f.name} onChangeText={set('name')} />
        <Input label="Mobile number" value={f.mobile} onChangeText={set('mobile')} keyboardType="number-pad" maxLength={10} />
        <Input label="D.O.B" value={f.dob} onChangeText={set('dob')} placeholder="DD MMM YYYY" />
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => (
            <Pressable key={g} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipActive]}>
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Pin Code" value={f.pincode} onChangeText={set('pincode')} keyboardType="number-pad" maxLength={6} />
        {!!err && <Text style={styles.err}>{err}</Text>}
        <Pressable disabled={saving} onPress={onSave} style={({ pressed }) => [styles.cta, (pressed || saving) && styles.pressed]}>
          <Text style={styles.ctaText}>{saving ? 'Saving…' : 'Save Patient'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const Input: React.FC<{ label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: 'default' | 'number-pad'; maxLength?: number }> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', maxLength }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? label} placeholderTextColor={colors.placeholder} keyboardType={keyboardType} maxLength={maxLength} style={styles.input} />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4) },
  field: { marginBottom: verticalScale(12) },
  label: { fontFamily: fonts.medium, fontSize: scale(13), color: '#4A4A4A', marginBottom: verticalScale(6), marginTop: verticalScale(6) },
  input: { height: verticalScale(46), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(14), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  chips: { flexDirection: 'row', gap: scale(10), marginBottom: verticalScale(8) },
  chip: { paddingHorizontal: scale(16), height: verticalScale(36), borderRadius: scale(18), backgroundColor: colors.tabInactive, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.directionsBlue },
  chipText: { fontFamily: fonts.medium, fontSize: scale(13), color: '#5B5B5B' },
  chipTextActive: { color: colors.textWhite },
  err: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.brandRed, marginTop: verticalScale(6) },
  cta: { height: verticalScale(50), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(22) },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
