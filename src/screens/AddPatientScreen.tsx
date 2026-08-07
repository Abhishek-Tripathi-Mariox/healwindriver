import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenHeader } from '../components';
import { staffApi } from '../api/staff';
import { dispatchStore } from '../state/dispatchStore';
import { pickPatientMedia } from '../services/patientMedia';
import type { PhotoFile } from '../api/upload';
import { onlyDigits, isValidName, NAME_ERROR, isValidMobile, MOBILE_ERROR } from '../utils/validation';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const GENDERS = ['Male', 'Female', 'Other'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'AddPatient'>;

export const AddPatientScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [f, setF] = useState({ name: '', mobile: '', dob: '', pincode: '' });
  const [gender, setGender] = useState<string | null>(null);
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<PhotoFile[]>([]);
  const [picking, setPicking] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  // Camera or gallery, photo or video (120s cap, compressed) — same helper
  // already used for in-transit patient media.
  const addMedia = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const picked = await pickPatientMedia();
      if (picked.length) setMedia((m) => [...m, ...picked]);
    } catch (e: any) {
      setErr(e?.message || 'Could not open the camera/gallery.');
    } finally {
      setPicking(false);
    }
  };
  const removeMedia = (i: number) => setMedia((m) => m.filter((_, idx) => idx !== i));

  // Display + API format: "DD MMM YYYY" (e.g. 30 Sep 1990) — matches AddLeaveScreen's convention.
  const onDobPicked = (event: any, selected?: Date) => {
    setShowDobPicker(false); // Android dialog auto-dismisses; close our state too.
    if (event?.type === 'dismissed' || !selected) return;
    setDobDate(selected);
    set('dob')(selected.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  };

  const onSave = async () => {
    if (saving) return;
    // This registers a real hospital patient, so name, mobile and gender are
    // required (they're mandatory on the hospital patient record).
    if (!isValidName(f.name)) {
      setErr(NAME_ERROR);
      return;
    }
    if (!isValidMobile(f.mobile)) {
      setErr(MOBILE_ERROR);
      return;
    }
    if (!gender) {
      setErr('Please select a gender.');
      return;
    }
    setErr('');
    setSaving(true);
    try {
      // If the crew is on an active dispatch, link this patient to that SOS
      // journey so the dispatch (and admin) show who was treated.
      const dispatchId = dispatchStore.getSnapshot().active?.id;
      const res: any = await staffApi.addPatient({
        name: f.name.trim(),
        mobile: f.mobile.trim(),
        dob: f.dob.trim() || undefined,
        gender: gender ?? undefined,
        pincode: f.pincode.trim() || undefined,
        dispatchId,
      });
      // Media upload is best-effort — the patient record itself is already
      // saved by this point, so a failed upload shouldn't block navigating
      // away or lose the registration.
      const patientId = res?.item?._id;
      if (patientId && media.length) {
        await staffApi.addPatientMedia(patientId, media).catch(() => undefined);
      }
      // Refresh the active dispatch so the just-linked patient shows up.
      if (dispatchId) await dispatchStore.hydrate('staff').catch(() => undefined);
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
        <Input label="Mobile number" value={f.mobile} onChangeText={(v) => set('mobile')(onlyDigits(v))} keyboardType="number-pad" maxLength={10} />
        <View style={styles.field}>
          <Text style={styles.label}>D.O.B</Text>
          <Pressable onPress={() => setShowDobPicker(true)} style={styles.input}>
            <Text style={[styles.dateText, !f.dob && styles.datePlaceholder]}>{f.dob || 'Select date of birth'}</Text>
          </Pressable>
        </View>
        {showDobPicker && (
          <DateTimePicker
            value={dobDate || new Date()}
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            onChange={onDobPicked}
            onError={() => {
              // Guard against a missing/mis-built native picker module so the
              // app surfaces an error instead of hard-crashing on date tap.
              setShowDobPicker(false);
              setErr('Could not open the date picker. Please update the app.');
            }}
          />
        )}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => (
            <Pressable key={g} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipActive]}>
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Pin Code" value={f.pincode} onChangeText={(v) => set('pincode')(onlyDigits(v, 6))} keyboardType="number-pad" maxLength={6} />

        <Text style={styles.label}>Photos / Videos</Text>
        {media.map((m, i) => (
          <View key={`${m.uri}-${i}`} style={styles.mediaRow}>
            <Text style={styles.mediaIcon}>{m.type?.startsWith('video/') ? '🎥' : '🖼️'}</Text>
            <Text style={styles.mediaName} numberOfLines={1}>{m.name}</Text>
            <Pressable onPress={() => removeMedia(i)} hitSlop={8}>
              <Text style={styles.mediaRemove}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable disabled={picking} onPress={addMedia} style={styles.addMediaBtn}>
          <Text style={styles.addMediaText}>{picking ? 'Opening…' : '+ Add Photo / Video'}</Text>
        </Pressable>
        <Text style={styles.hint}>Camera or gallery · videos up to 120 seconds</Text>

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
  input: { height: verticalScale(46), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(14), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack, justifyContent: 'center' },
  dateText: { fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  datePlaceholder: { color: colors.placeholder },
  chips: { flexDirection: 'row', gap: scale(10), marginBottom: verticalScale(8) },
  chip: { paddingHorizontal: scale(16), height: verticalScale(36), borderRadius: scale(18), backgroundColor: colors.tabInactive, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.directionsBlue },
  chipText: { fontFamily: fonts.medium, fontSize: scale(13), color: '#5B5B5B' },
  chipTextActive: { color: colors.textWhite },
  err: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.brandRed, marginTop: verticalScale(6) },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    height: verticalScale(40),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(8),
  },
  mediaIcon: { fontSize: scale(15) },
  mediaName: { flex: 1, fontFamily: fonts.regular, fontSize: scale(13), color: colors.textBlack },
  mediaRemove: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.brandRed, paddingHorizontal: scale(4) },
  addMediaBtn: {
    height: verticalScale(44),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: colors.directionsBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(4),
  },
  addMediaText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.directionsBlue },
  hint: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(4), marginBottom: verticalScale(4) },
  cta: { height: verticalScale(50), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(22) },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
