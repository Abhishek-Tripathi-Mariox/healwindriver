import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProfileAvatar, ScreenHeader } from '../components';
import {
  BellIcon,
  BookingIcon,
  BoxIcon,
  ChevronForwardIcon,
  EditIcon,
  IconProps,
  LogoutIcon,
  NotesIcon,
} from '../components/icons';
import { useDuty } from '../state/dutyStore';
import { authStore, useAuth } from '../state/authStore';
import { firstPhotoUrl } from '../api/upload';
import { pickProfilePhoto, uploadProfilePhoto } from '../services/profilePhoto';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Row {
  key: string;
  label: string;
  Icon: React.FC<IconProps>;
  route?: keyof RootStackParamList;
  danger?: boolean;
}
const ROWS: Row[] = [
  { key: 'edit', label: 'Edit Profile', Icon: EditIcon, route: 'EditProfile' },
  { key: 'trips', label: 'Trip History', Icon: BookingIcon, route: 'TripHistory' },
  { key: 'notes', label: 'Case Notes & Patient', Icon: NotesIcon, route: 'CaseNotes' },
  { key: 'stock', label: 'Stock Update Request', Icon: BoxIcon, route: 'StockRequest' },
  { key: 'leave', label: 'Leave Management', Icon: BookingIcon, route: 'ApplyLeave' },
  { key: 'notifications', label: 'Notifications', Icon: BellIcon, route: 'StaffNotifications' },
  { key: 'logout', label: 'Logout', Icon: LogoutIcon, route: 'Login', danger: true },
];

type Nav = NativeStackNavigationProp<RootStackParamList, 'StaffProfile'>;

export const StaffProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const onDuty = useDuty();
  const { profile } = useAuth();
  const staff = profile?.staff || {};
  const staffName = staff.fullName || staff.name || 'Staff';
  const photoUrl = firstPhotoUrl(staff.profilePhoto ?? profile?.profilePhoto);
  const [photoBusy, setPhotoBusy] = useState(false);

  const changePhoto = async () => {
    if (photoBusy) return;
    try {
      const file = await pickProfilePhoto();
      if (!file) return; // cancelled
      setPhotoBusy(true);
      await uploadProfilePhoto('staff', file);
    } catch (e: any) {
      Alert.alert('Photo not updated', e?.message || 'Could not update your photo. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };
  const INFO: [string, string][] = [
    ['Mobile', staff.mobileNumber || '—'],
    ['Role', staff.role === 'driver' ? 'Driver' : 'Ambulance Attendant'],
    ['Hospital', profile?.provider?.name || staff.hospitalName || '—'],
    ['Gender', staff.gender || '—'],
  ];

  const logout = async () => {
    await authStore.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(24) }]}>
        <View style={[styles.idCard, cardShadow]}>
          <ProfileAvatar uri={photoUrl} editable busy={photoBusy} onPress={changePhoto} />
          <Text style={styles.name}>{staffName}</Text>
          <View style={[styles.dutyPill, onDuty ? styles.dutyOn : styles.dutyOff]}>
            <Text style={[styles.dutyText, onDuty && { color: colors.textWhite }]}>{onDuty ? 'On Duty' : 'Off Duty'}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, cardShadow]}>
          {INFO.map(([k, v], i) => (
            <View key={k} style={[styles.infoRow, i < INFO.length - 1 && styles.infoDivider]}>
              <Text style={styles.infoK}>{k}</Text>
              <Text style={styles.infoV}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.rows, cardShadow]}>
          {ROWS.map((r, i) => (
            <Pressable
              key={r.key}
              onPress={() => (r.key === 'logout' ? logout() : r.route && navigation.navigate(r.route as never))}
              style={({ pressed }) => [styles.row, i < ROWS.length - 1 && styles.rowDivider, pressed && styles.pressed]}
            >
              <View style={[styles.rowIcon, { backgroundColor: r.danger ? '#FDECEC' : '#EAF1FE' }]}>
                <r.Icon size={scale(20)} color={r.danger ? colors.brandRed : colors.directionsBlue} />
              </View>
              <Text style={[styles.rowLabel, r.danger && { color: colors.brandRed }]}>{r.label}</Text>
              {!r.danger && <ChevronForwardIcon size={scale(20)} color="#B9C2C9" />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: verticalScale(4) },
  idCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(20) },
  avatar: { width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: scale(20), color: colors.textBlack, marginTop: verticalScale(12) },
  dutyPill: { borderRadius: scale(14), paddingHorizontal: scale(14), paddingVertical: verticalScale(4), marginTop: verticalScale(8) },
  dutyOn: { backgroundColor: colors.payGreen },
  dutyOff: { backgroundColor: colors.tabInactive },
  dutyText: { fontFamily: fonts.semiBold, fontSize: scale(12), color: colors.inkMuted },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: scale(16), marginTop: verticalScale(16) },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(13) },
  infoDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6ECF0' },
  infoK: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  infoV: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
  rows: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: spacing.md, marginTop: verticalScale(16) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(14) },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6ECF0' },
  pressed: { opacity: 0.6 },
  rowIcon: { width: scale(36), height: scale(36), borderRadius: scale(10), alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: scale(14), color: colors.textBlack },
});
