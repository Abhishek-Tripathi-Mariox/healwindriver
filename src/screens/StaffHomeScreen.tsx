import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { svgs } from '../svgAssets';
import { staffApi } from '../api/staff';
import { authStore, useAuth } from '../state/authStore';
import {
  BellIcon,
  BookingIcon,
  BoxIcon,
  ClockIcon,
  IconProps,
  LogoutIcon,
  MapPinIcon,
  NotesIcon,
  PersonIcon,
  WalletIcon,
} from '../components/icons';
import { useDuty, dutyStore } from '../state/dutyStore';
import { dispatchStore } from '../state/dispatchStore';
import { ensureAppPermissions } from '../services/permissions';
import { locationService, getCurrentPositionOnce } from '../services/location';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StaffHome'>;

interface Tile {
  key: string;
  label: string;
  Icon: React.FC<IconProps>;
  route: keyof RootStackParamList;
}
// A driver's home is dispatch/driving-focused; an attendant's is patient-care.
const DRIVER_TILES: Tile[] = [
  { key: 'trips', label: 'My Trips', Icon: BookingIcon, route: 'TripHistory' },
  { key: 'earnings', label: 'Earnings', Icon: WalletIcon, route: 'StaffEarnings' },
  { key: 'shifts', label: 'My Shifts', Icon: ClockIcon, route: 'Shifts' },
  { key: 'notifications', label: 'Notifications', Icon: BellIcon, route: 'StaffNotifications' },
  { key: 'profile', label: 'Profile', Icon: PersonIcon, route: 'StaffProfile' },
];
const ATTENDANT_TILES: Tile[] = [
  { key: 'patient', label: 'Add Patient', Icon: PersonIcon, route: 'AddPatient' },
  { key: 'notes', label: 'Case Notes', Icon: NotesIcon, route: 'CaseNotes' },
  { key: 'stock', label: 'Stock Request', Icon: BoxIcon, route: 'StockRequest' },
  { key: 'trips', label: 'Trip History', Icon: BookingIcon, route: 'TripHistory' },
  { key: 'earnings', label: 'Earnings', Icon: WalletIcon, route: 'StaffEarnings' },
  { key: 'leave', label: 'Apply Leave', Icon: BookingIcon, route: 'ApplyLeave' },
  { key: 'profile', label: 'Profile', Icon: PersonIcon, route: 'StaffProfile' },
];

export const StaffHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const onDuty = useDuty();
  const { profile } = useAuth();
  const staffName =
    profile?.staff?.fullName || profile?.staff?.name || profile?.fullName || 'Staff';
  // Sub-role drives the whole home: a driver and an attendant are different jobs.
  const isAttendant = profile?.staff?.role === 'attendant';
  const roleLabel = isAttendant ? 'Ambulance Attendant' : 'Ambulance Driver';
  const tiles = isAttendant ? ATTENDANT_TILES : DRIVER_TILES;
  const [dispatch, setDispatch] = useState<any | null>(null);
  const [unread, setUnread] = useState(0);
  const [dutyBusy, setDutyBusy] = useState(false);
  // Off-duty reason picker.
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasons, setReasons] = useState<{ _id: string; label: string }[]>([]);

  const applyDuty = async (v: boolean, reasonId?: string) => {
    setDutyBusy(true);
    const ok = await dutyStore.set(v, true, reasonId);
    if (!ok) Alert.alert('Could not update duty', 'Please check your connection and try again.');
    setDutyBusy(false);
  };

  // Going ON duty is instant; going OFF shows a reason picker (optional) so ops
  // know why the crew is unavailable.
  const onToggleDuty = async () => {
    if (dutyBusy) return;
    if (!onDuty) {
      void applyDuty(true);
      return;
    }
    setReasonOpen(true);
    staffApi.offDutyReasons().then((r: any[]) => setReasons(r || [])).catch(() => setReasons([]));
  };

  const pickReason = (reasonId?: string) => {
    setReasonOpen(false);
    void applyDuty(false, reasonId);
  };

  // Ask for permissions up front, then push one location fix so the vehicle has
  // a real position (and a real distance from the patient) right away — even
  // before going on duty / before live GPS streaming.
  React.useEffect(() => {
    void ensureAppPermissions().then(() => locationService.sendOnce('staff'));
  }, []);

  // Crew SOS — raises a live alert on the control-centre dashboard.
  const raiseSos = () => {
    Alert.alert('Send SOS?', 'This alerts the control centre with your live location.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          const pos = await getCurrentPositionOnce().catch(() => null);
          try {
            await staffApi.raiseSos(pos ? { lat: pos.lat, lng: pos.lng } : undefined);
            Alert.alert('SOS sent', 'The control centre has been alerted.');
          } catch (e: any) {
            Alert.alert('Could not send SOS', e?.message || 'Please try again or call 112.');
          }
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          dutyStore.set(false);
          await authStore.logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  useFocusEffect(
    React.useCallback(() => {
      staffApi
        .activeDispatch()
        .then((r: any) => setDispatch(r?.dispatch || null))
        .catch(() => setDispatch(null));
      staffApi
        .notifications()
        .then((r) => setUnread(r.unread || 0))
        .catch(() => setUnread(0));
      void dispatchStore.hydrate('staff');
    }, []),
  );

  const caseType = dispatch?.type || dispatch?.serviceType || 'Case';
  const casePatient = dispatch?.patientName || dispatch?.patient?.name || 'Assigned patient';
  const caseId = dispatch?.patientId || dispatch?._id || '';
  const pickup = dispatch?.pickup?.address || dispatch?.pickupAddress || '—';
  const drop = dispatch?.drop?.address || dispatch?.dropAddress || '—';

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + verticalScale(8), paddingBottom: insets.bottom + verticalScale(24) }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <svgs.logo width={scale(110)} height={scale(23)} preserveAspectRatio="xMidYMid meet" />
            <Text style={styles.hello}>Hi, {staffName}</Text>
            <Text style={styles.roleSub}>{roleLabel}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={[styles.sosBtn, cardShadow]} onPress={raiseSos} hitSlop={8} accessibilityLabel="Send SOS">
              <Text style={styles.sosText}>SOS</Text>
            </Pressable>
            <Pressable style={[styles.bell, cardShadow]} onPress={() => navigation.navigate('StaffNotifications')} hitSlop={8}>
              <BellIcon size={scale(22)} color={colors.textPrimary} />
              {unread > 0 && <View style={styles.bellDot} />}
            </Pressable>
            <Pressable style={[styles.bell, cardShadow]} onPress={onLogout} hitSlop={8} accessibilityLabel="Log out">
              <LogoutIcon size={scale(22)} color={colors.brandRed} />
            </Pressable>
          </View>
        </View>

        {/* Duty */}
        <View style={[styles.dutyCard, cardShadow, onDuty ? styles.dutyOn : styles.dutyOff]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dutyTitle, onDuty && { color: colors.textWhite }]}>{onDuty ? 'On Duty' : 'Off Duty'}</Text>
            <Text style={[styles.dutySub, onDuty && { color: 'rgba(255,255,255,0.85)' }]}>
              {onDuty
                ? isAttendant
                  ? 'You are available for assigned cases.'
                  : 'You are available for emergency dispatches.'
                : isAttendant
                  ? 'Go on duty to be assigned to cases.'
                  : 'Go on duty to receive emergency dispatches.'}
            </Text>
          </View>
          <Pressable
            disabled={dutyBusy}
            onPress={onToggleDuty}
            style={[styles.switch, onDuty ? styles.switchOn : styles.switchOff, dutyBusy && { opacity: 0.6 }]}
          >
            <View style={[styles.knob, onDuty ? styles.knobOn : styles.knobOff]} />
          </Pressable>
        </View>

        {/* Assigned case / dispatch */}
        <Text style={styles.section}>{isAttendant ? 'Current Assignment' : 'Current Dispatch'}</Text>
        {dispatch ? (
          <View style={[styles.caseCard, cardShadow]}>
            <View style={styles.caseTop}>
              <Text style={styles.casePatient}>{casePatient}</Text>
              <View style={styles.caseChip}><Text style={styles.caseChipText}>{caseType}</Text></View>
            </View>
            {!!caseId && <Text style={styles.caseId}>ID : {caseId}</Text>}
            <View style={styles.divider} />
            <Row icon label="Pickup point" value={pickup} />
            <Row label="Drop point" value={drop} />
            {isAttendant ? (
              <>
                <Pressable style={styles.caseCta} onPress={() => navigation.navigate('CaseNotes')}>
                  <Text style={styles.caseCtaText}>Open Case Notes</Text>
                </Pressable>
                <Pressable style={styles.caseCtaAlt} onPress={() => navigation.navigate('ActiveDispatch')}>
                  <Text style={styles.caseCtaAltText}>View Dispatch Details</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.caseCta} onPress={() => navigation.navigate('ActiveDispatch')}>
                <Text style={styles.caseCtaText}>Open Live Dispatch</Text>
              </Pressable>
            )}
          </View>
        ) : isAttendant ? (
          <View style={[styles.caseCard, cardShadow]}>
            <Text style={styles.dutySub}>
              {onDuty ? 'No active case right now. You will be notified when one is assigned.' : 'Go on duty to receive case assignments.'}
            </Text>
          </View>
        ) : (
          <View style={[styles.waitCard, cardShadow]}>
            <MapPinIcon size={scale(26)} />
            <Text style={styles.waitTitle}>
              {onDuty ? 'Waiting for dispatches…' : 'You are off duty'}
            </Text>
            <Text style={styles.waitSub}>
              {onDuty
                ? 'You will be alerted when a nearby emergency comes in.'
                : 'Go on duty to start receiving emergency dispatches.'}
            </Text>
          </View>
        )}

        {/* Tiles */}
        <Text style={styles.section}>Quick actions</Text>
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <Pressable key={t.key} style={[styles.tile, cardShadow]} onPress={() => navigation.navigate(t.route as never)}>
              <View style={styles.tileIcon}>
                <t.Icon size={scale(24)} color={colors.directionsBlue} />
              </View>
              <Text style={styles.tileLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Off-duty reason picker */}
      <Modal visible={reasonOpen} transparent animationType="slide" onRequestClose={() => setReasonOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setReasonOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Why are you going off duty?</Text>
          {reasons.map((r) => (
            <Pressable key={r._id} onPress={() => pickReason(r._id)} style={styles.reasonRow}>
              <Text style={styles.reasonText}>{r.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => pickReason(undefined)} style={styles.reasonSkip}>
            <Text style={styles.reasonSkipText}>Go off duty without a reason</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const Row: React.FC<{ icon?: boolean; label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <MapPinIcon size={scale(16)} />
    <View style={{ flex: 1, marginLeft: scale(8) }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: verticalScale(6) },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  sosBtn: { height: scale(40), paddingHorizontal: scale(14), borderRadius: scale(20), backgroundColor: colors.brandRed, alignItems: 'center', justifyContent: 'center' },
  sosText: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.textWhite, letterSpacing: 1 },
  hello: { fontFamily: fonts.bold, fontSize: scale(20), color: colors.textBlack, marginTop: verticalScale(6) },
  roleSub: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.directionsBlue, marginTop: verticalScale(2) },
  bell: { width: scale(46), height: scale(46), borderRadius: scale(23), backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: scale(12), right: scale(13), width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: colors.brandRed },

  dutyCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, padding: scale(18), marginTop: verticalScale(18) },
  dutyOn: { backgroundColor: colors.payGreen },
  dutyOff: { backgroundColor: colors.surface },
  dutyTitle: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack },
  dutySub: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(4) },
  switch: { width: scale(56), height: scale(32), borderRadius: scale(16), padding: scale(3), justifyContent: 'center' },
  switchOn: { backgroundColor: 'rgba(255,255,255,0.4)' },
  switchOff: { backgroundColor: '#D6DBE0' },
  knob: { width: scale(26), height: scale(26), borderRadius: scale(13), backgroundColor: colors.surface },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },

  section: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack, marginTop: verticalScale(22), marginBottom: verticalScale(12) },
  caseCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  waitCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(20), alignItems: 'center', gap: verticalScale(8) },
  waitTitle: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  waitSub: { fontFamily: fonts.regular, fontSize: scale(13), color: colors.inkMuted, textAlign: 'center' },
  caseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: scale(10) },
  casePatient: { flex: 1, fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack },
  caseChip: { backgroundColor: '#EAF1FE', borderRadius: scale(6), paddingHorizontal: scale(10), paddingVertical: verticalScale(3) },
  caseChipText: { fontFamily: fonts.semiBold, fontSize: scale(10), color: colors.directionsBlue },
  caseId: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(6) },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E2E2', marginVertical: verticalScale(12) },
  row: { flexDirection: 'row', marginBottom: verticalScale(10) },
  rowLabel: { fontFamily: fonts.semiBold, fontSize: scale(11), color: colors.inkMuted },
  rowValue: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.textBlack, marginTop: verticalScale(2) },
  caseMeta: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginTop: verticalScale(2) },
  metaItem: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.textBlack },
  dot: { color: colors.metaGray },
  caseCta: { height: verticalScale(44), borderRadius: scale(10), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(14) },
  caseCtaText: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.textWhite },
  caseCtaAlt: { height: verticalScale(44), borderRadius: scale(10), borderWidth: 1.5, borderColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(10) },
  caseCtaAltText: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.directionsBlue },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12) },
  tile: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), gap: verticalScale(10) },
  tileIcon: { width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), paddingHorizontal: spacing.lg, paddingTop: verticalScale(10) },
  handle: { alignSelf: 'center', width: scale(90), height: scale(4), borderRadius: scale(3), backgroundColor: '#C9CDD2', marginBottom: verticalScale(14) },
  sheetTitle: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack, marginBottom: verticalScale(8) },
  reasonRow: { paddingVertical: verticalScale(14), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E2E2' },
  reasonText: { fontFamily: fonts.medium, fontSize: scale(15), color: colors.textBlack },
  reasonSkip: { paddingVertical: verticalScale(16), alignItems: 'center', marginTop: verticalScale(4) },
  reasonSkipText: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.inkMuted },
});
