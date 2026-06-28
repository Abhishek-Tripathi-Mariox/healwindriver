import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProfileAvatar, ScreenHeader } from '../components';
import { authStore, useAuth } from '../state/authStore';
import { driverApi } from '../api/driver';
import { staffApi } from '../api/staff';
import { firstPhotoUrl } from '../api/upload';
import { pickProfilePhoto, uploadProfilePhoto } from '../services/profilePhoto';
import { isValidName, NAME_ERROR } from '../utils/validation';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const GENDERS = ['Male', 'Female', 'Other'];
type Nav = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { role, profile } = useAuth();
  const isStaff = role === 'staff';
  // Staff identity lives under profile.staff; the ride-driver under profile.driver.
  const src = (isStaff ? profile?.staff : profile?.driver ?? profile) ?? {};

  const [f, setF] = useState({
    fullName: src.fullName || src.name || '',
    email: src.email || '',
    dob: src.dob || src.dateOfBirth || '',
    bloodGroup: src.bloodGroup || '',
  });
  const [gender, setGender] = useState<string>(src.gender || '');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const photoUrl = firstPhotoUrl(src.profilePhoto ?? profile?.profilePhoto);

  const changePhoto = async () => {
    if (photoBusy) return;
    try {
      const file = await pickProfilePhoto();
      if (!file) return;
      setPhotoBusy(true);
      await uploadProfilePhoto(role, file);
    } catch (e: any) {
      Alert.alert('Photo not updated', e?.message || 'Could not update your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onSave = async () => {
    if (saving) return;
    if (!isValidName(f.fullName)) {
      setErr(NAME_ERROR);
      return;
    }
    setErr('');
    setSaving(true);
    try {
      // Send only filled fields — the backend ignores empty/undefined ones.
      const common = {
        fullName: f.fullName.trim(),
        email: f.email.trim() || undefined,
        gender: gender || undefined,
        dob: f.dob.trim() || undefined,
      };
      // Blood group is a driver-only field; mobile/role stay admin-managed for both.
      if (isStaff) await staffApi.updateProfile(common);
      else await driverApi.updateProfile({ ...common, bloodGroup: f.bloodGroup.trim() || undefined });
      await authStore.refreshProfile();
      navigation.goBack();
    } catch (e: any) {
      setErr(e?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(30) }]}
      >
        <View style={styles.avatarWrap}>
          <ProfileAvatar uri={photoUrl} editable busy={photoBusy} onPress={changePhoto} />
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <Input label="Full name" value={f.fullName} onChangeText={set('fullName')} />
        <Input label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" />
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => (
            <Pressable key={g} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipActive]}>
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Date of birth" value={f.dob} onChangeText={set('dob')} placeholder="DD MMM YYYY" />
        {!isStaff && (
          <Input label="Blood group" value={f.bloodGroup} onChangeText={set('bloodGroup')} placeholder="e.g. O+" />
        )}

        {!!err && <Text style={styles.err}>{err}</Text>}
        <Pressable disabled={saving} onPress={onSave} style={({ pressed }) => [styles.cta, (pressed || saving) && styles.pressed]}>
          <Text style={styles.ctaText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const Input: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
}> = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? label}
      placeholderTextColor={colors.placeholder}
      keyboardType={keyboardType}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(4) },
  avatarWrap: { alignItems: 'center', marginBottom: verticalScale(10) },
  avatarHint: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(8) },
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
