import React from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { svgs } from '../svgAssets';
import {
  BellIcon,
  BookingIcon,
  ClockIcon,
  IconProps,
  LogoutIcon,
  MapPinIcon,
  PersonIcon,
  WalletIcon,
  WarningIcon,
} from '../components/icons';
import { useDuty, dutyStore } from '../state/dutyStore';
import { useActiveDispatch, dispatchStore } from '../state/dispatchStore';
import { authStore, useAuth } from '../state/authStore';
import { ensureAppPermissions } from '../services/permissions';
import { locationService } from '../services/location';
import { driverApi } from '../api/driver';
import { staffApi } from '../api/staff';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DriverHome'>;

interface Tile {
  key: string;
  label: string;
  Icon: React.FC<IconProps>;
  route: keyof RootStackParamList;
}
const TILES: Tile[] = [
  { key: 'trips', label: 'My Trips', Icon: BookingIcon, route: 'Trips' },
  { key: 'earnings', label: 'Earnings', Icon: WalletIcon, route: 'Earnings' },
  { key: 'wallet', label: 'Wallet & Bank', Icon: WalletIcon, route: 'DriverWallet' },
  { key: 'shifts', label: 'My Shifts', Icon: ClockIcon, route: 'Shifts' },
  { key: 'profile', label: 'Profile', Icon: PersonIcon, route: 'Profile' },
];

export const DriverHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const onDuty = useDuty();
  const active = useActiveDispatch();
  const { profile, role } = useAuth();
  const driverName =
    profile?.driver?.fullName || profile?.fullName || profile?.name || 'Driver';
  const [unread, setUnread] = React.useState(0);
  // Off-duty reason picker.
  const [reasonOpen, setReasonOpen] = React.useState(false);
  const [reasons, setReasons] = React.useState<{ _id: string; label: string }[]>([]);
  const [loadingReasons, setLoadingReasons] = React.useState(false);

  // Tapping the toggle: going ON is instant; going OFF asks for a reason first.
  const onDutyPress = () => {
    if (!onDuty) {
      void dutyStore.set(true);
      return;
    }
    setReasonOpen(true);
    setLoadingReasons(true);
    staffApi
      .offDutyReasons()
      .then((list: any[]) => setReasons(list.map((r) => ({ _id: r._id || r.id, label: r.label || r.name })).filter((r) => r._id)))
      .catch(() => setReasons([]))
      .finally(() => setLoadingReasons(false));
  };
  const goOffDuty = async (reasonId?: string) => {
    setReasonOpen(false);
    const ok = await dutyStore.set(false, true, reasonId);
    if (!ok) Alert.alert('Could not go off duty', 'Please check your connection and try again.');
  };

  useFocusEffect(
    React.useCallback(() => {
      void dispatchStore.hydrate(role);
      driverApi
        .notifications()
        .then((r) => setUnread(r.unread || 0))
        .catch(() => setUnread(0));
    }, [role]),
  );

  // Request permissions up front, then push one location fix so the vehicle has
  // a real position (and a real distance from the patient) right away.
  React.useEffect(() => {
    void ensureAppPermissions().then(() => locationService.sendOnce('driver'));
  }, []);

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
            <Text style={styles.hello}>Hi, {driverName}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={[styles.bell, cardShadow]} onPress={() => navigation.navigate('Notifications')} hitSlop={8}>
              <BellIcon size={scale(22)} color={colors.textPrimary} />
              {unread > 0 && <View style={styles.bellDot} />}
            </Pressable>
            <Pressable style={[styles.bell, cardShadow]} onPress={onLogout} hitSlop={8} accessibilityLabel="Log out">
              <LogoutIcon size={scale(22)} color={colors.brandRed} />
            </Pressable>
          </View>
        </View>

        {/* Duty toggle */}
        <View style={[styles.dutyCard, cardShadow, onDuty ? styles.dutyOn : styles.dutyOff]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dutyTitle, onDuty && { color: colors.textWhite }]}>
              {onDuty ? 'You are On Duty' : 'You are Off Duty'}
            </Text>
            <Text style={[styles.dutySub, onDuty && { color: 'rgba(255,255,255,0.85)' }]}>
              {onDuty ? 'You are receiving dispatches.' : 'Go on duty to receive dispatches.'}
            </Text>
          </View>
          <Pressable
            onPress={onDutyPress}
            style={[styles.switch, onDuty ? styles.switchOn : styles.switchOff]}
          >
            <View style={[styles.knob, onDuty ? styles.knobOn : styles.knobOff]} />
          </Pressable>
        </View>

        {/* Off-duty reason picker */}
        <Modal visible={reasonOpen} transparent animationType="fade" onRequestClose={() => setReasonOpen(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setReasonOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <Text style={styles.sheetTitle}>Why are you going off duty?</Text>
              {loadingReasons ? (
                <ActivityIndicator color={colors.brandRed} style={{ marginVertical: verticalScale(16) }} />
              ) : (
                <>
                  {reasons.map((r) => (
                    <Pressable key={r._id} style={styles.reasonRow} onPress={() => goOffDuty(r._id)}>
                      <Text style={styles.reasonText}>{r.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable style={styles.reasonRow} onPress={() => goOffDuty(undefined)}>
                    <Text style={[styles.reasonText, { color: colors.inkMuted }]}>Skip / Other</Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Active dispatch OR waiting state */}
        {active ? (
          <Pressable style={[styles.activeCard, cardShadow]} onPress={() => navigation.navigate('ActiveDispatch')}>
            <View style={styles.activeRow}>
              <View style={styles.activeIcon}>
                <WarningIcon size={scale(20)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>Active Dispatch · {active.status.replace('_', ' ')}</Text>
                <Text style={styles.activeSub} numberOfLines={1}>{active.patient} · {active.km} km · ETA {active.eta} min</Text>
              </View>
            </View>
            <Text style={styles.activeCta}>Open dispatch →</Text>
          </Pressable>
        ) : onDuty ? (
          <View style={[styles.waitCard, cardShadow]}>
            <MapPinIcon size={scale(26)} />
            <Text style={styles.waitTitle}>Waiting for dispatches…</Text>
            <Text style={styles.waitSub}>You will be alerted when a nearby emergency comes in.</Text>
          </View>
        ) : (
          <View style={[styles.waitCard, cardShadow]}>
            <Text style={styles.waitSub}>Turn on duty to start receiving emergency dispatches.</Text>
          </View>
        )}

        {/* Quick tiles */}
        <View style={styles.tiles}>
          {TILES.map((t) => (
            <Pressable key={t.key} style={[styles.tile, cardShadow]} onPress={() => navigation.navigate(t.route as never)}>
              <View style={styles.tileIcon}>
                <t.Icon size={scale(24)} color={colors.directionsBlue} />
              </View>
              <Text style={styles.tileLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), padding: spacing.lg, paddingBottom: verticalScale(28) },
  sheetTitle: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.ink, marginBottom: verticalScale(10) },
  reasonRow: { paddingVertical: verticalScale(14), borderBottomWidth: 1, borderBottomColor: colors.dashBorder },
  reasonText: { fontFamily: fonts.medium, fontSize: scale(15), color: colors.textPrimary },
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: verticalScale(6) },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  hello: { fontFamily: fonts.bold, fontSize: scale(20), color: colors.textBlack, marginTop: verticalScale(6) },
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

  activeCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), marginTop: verticalScale(16), borderWidth: 1, borderColor: '#FAD4D4' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  activeIcon: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: '#FCE9E9', alignItems: 'center', justifyContent: 'center' },
  activeTitle: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.brandRedDark },
  activeSub: { fontFamily: fonts.medium, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(3) },
  activeCta: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.directionsBlue, marginTop: verticalScale(12), textAlign: 'right' },

  waitCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(20), marginTop: verticalScale(16), alignItems: 'center', gap: verticalScale(8) },
  waitTitle: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack },
  waitSub: { fontFamily: fonts.regular, fontSize: scale(13), color: colors.inkMuted, textAlign: 'center' },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12), marginTop: verticalScale(20) },
  tile: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), gap: verticalScale(10) },
  tileIcon: { width: scale(44), height: scale(44), borderRadius: scale(12), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
});
