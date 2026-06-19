import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenHeader } from '../components';
import { UploadCloudIcon } from '../components/icons';
import { staffApi } from '../api/staff';
import type { PhotoFile } from '../api/upload';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const TYPES = ['Sick', 'Casual'];
const DAYS = ['Full Day', 'Half Day'] as const;
type Nav = NativeStackNavigationProp<RootStackParamList, 'AddLeave'>;

export const AddLeaveScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [type, setType] = useState('Casual');
  const [day, setDay] = useState<(typeof DAYS)[number]>('Full Day');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<PhotoFile | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  // Display + API format: "DD MMM YYYY" (e.g. 30 Sep 2025).
  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const from = fmt(fromDate);
  const to = fmt(toDate);

  const onPicked = (event: any, selected?: Date) => {
    const field = picker;
    setPicker(null); // Android dialog auto-dismisses; close our state too.
    if (event?.type === 'dismissed' || !selected) return;
    if (field === 'from') {
      setFromDate(selected);
      // Keep To ≥ From.
      if (toDate && selected > toDate) setToDate(selected);
    } else if (field === 'to') {
      setToDate(selected);
    }
  };

  // Pick a supporting document (e.g. medical certificate) from the gallery.
  const pickFile = async () => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
      const a = res.assets?.[0];
      if (a?.uri) {
        setFile({
          uri: a.uri,
          name: a.fileName || `leave_${Date.now()}.jpg`,
          type: a.type || 'image/jpeg',
        });
      }
    } catch {
      setErr('Could not pick the file.');
    }
  };

  const onSubmit = async () => {
    if (saving) return;
    if (!from.trim() || !to.trim()) {
      setErr('From and To dates are required.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      await staffApi.applyLeave(
        { type, from: from.trim(), to: to.trim(), day, reason: reason.trim() },
        file ?? undefined,
      );
      navigation.goBack();
    } catch (e: any) {
      setErr(e?.message || 'Could not submit leave.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Apply Leave" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(30) }]}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipActive]}>
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Leave Day</Text>
        <View style={styles.chips}>
          {DAYS.map((d) => (
            <Pressable key={d} onPress={() => setDay(d)} style={[styles.chip, day === d && styles.chipActive]}>
              <Text style={[styles.chipText, day === d && styles.chipTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>From Date</Text>
          <Pressable onPress={() => setPicker('from')} style={styles.input}>
            <Text style={[styles.dateText, !from && styles.datePlaceholder]}>{from || 'Select date'}</Text>
          </Pressable>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>To Date</Text>
          <Pressable onPress={() => setPicker('to')} style={styles.input}>
            <Text style={[styles.dateText, !to && styles.datePlaceholder]}>{to || 'Select date'}</Text>
          </Pressable>
        </View>

        {picker && (
          <DateTimePicker
            value={(picker === 'from' ? fromDate : toDate) || new Date()}
            mode="date"
            display="calendar"
            minimumDate={picker === 'to' && fromDate ? fromDate : undefined}
            onChange={onPicked}
            onError={() => {
              // Guard against a missing/mis-built native picker module so the
              // app surfaces an error instead of hard-crashing on date tap.
              setPicker(null);
              setErr('Could not open the date picker. Please update the app.');
            }}
          />
        )}

        <Text style={styles.label}>Reason</Text>
        <TextInput value={reason} onChangeText={setReason} placeholder="Reason for leave" placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" style={styles.textarea} />

        <Pressable style={styles.file} onPress={pickFile}>
          <UploadCloudIcon size={scale(26)} color={colors.textPrimary} />
          <Text style={styles.fileText} numberOfLines={1}>
            {file ? file.name : 'Select File (optional)'}
          </Text>
        </Pressable>
        {!!file && (
          <Pressable onPress={() => setFile(null)}>
            <Text style={styles.removeFile}>Remove file</Text>
          </Pressable>
        )}

        {!!err && <Text style={styles.err}>{err}</Text>}
        <Pressable disabled={saving} onPress={onSubmit} style={({ pressed }) => [styles.cta, (pressed || saving) && styles.pressed]}>
          <Text style={styles.ctaText}>{saving ? 'Submitting…' : 'Submit Leave'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4) },
  label: { fontFamily: fonts.medium, fontSize: scale(13), color: '#4A4A4A', marginTop: verticalScale(14), marginBottom: verticalScale(8) },
  chips: { flexDirection: 'row', gap: scale(10) },
  chip: { paddingHorizontal: scale(18), height: verticalScale(38), borderRadius: scale(19), backgroundColor: colors.tabInactive, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.directionsBlue },
  chipText: { fontFamily: fonts.medium, fontSize: scale(14), color: '#5B5B5B' },
  chipTextActive: { color: colors.textWhite },
  field: {},
  input: { height: verticalScale(46), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(14), justifyContent: 'center', fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  dateText: { fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  datePlaceholder: { color: colors.placeholder },
  textarea: { height: verticalScale(90), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, padding: scale(14), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  file: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(12), height: verticalScale(52), borderRadius: scale(12), borderWidth: 1, borderStyle: 'dashed', borderColor: colors.dashBorder, backgroundColor: colors.dashBg, marginTop: verticalScale(16) },
  fileText: { fontFamily: fonts.medium, fontSize: scale(14), color: colors.textBlack, maxWidth: '70%' },
  removeFile: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.brandRed, marginTop: verticalScale(8), alignSelf: 'flex-end' },
  err: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.brandRed, marginTop: verticalScale(8) },
  cta: { height: verticalScale(50), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(20) },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
