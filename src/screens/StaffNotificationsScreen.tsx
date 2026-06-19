import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { NotesIcon } from '../components/icons';
import { staffApi } from '../api/staff';
import { socketService } from '../services/socket';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

interface Notif {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

const relTime = (iso?: string) => {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'StaffNotifications'>;

export const StaffNotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [items, setItems] = React.useState<Notif[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Live: prepend notifications pushed over the socket while the screen is open.
  React.useEffect(() => {
    const off = socketService.on('notification:new', (n: any) => {
      if (!n?._id) return;
      setItems((prev) =>
        prev.some((p) => p.id === String(n._id))
          ? prev
          : [
              {
                id: String(n._id),
                title: n.title || 'Notification',
                body: n.body || n.message || '',
                time: relTime(n.createdAt),
                unread: true,
              },
              ...prev,
            ],
      );
    });
    return off;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      setLoading(true);
      staffApi
        .notifications()
        .then(({ items: list }) => {
          if (!alive) return;
          setItems(
            (list as any[]).map((n, i) => ({
              id: String(n._id || n.id || i),
              title: n.title || n.heading || 'Notification',
              body: n.body || n.message || n.description || '',
              time: relTime(n.createdAt || n.created_at || n.date),
              unread: n.isRead === false || n.read === false || n.unread === true,
            })),
          );
        })
        .catch(() => alive && setItems([]))
        .finally(() => alive && setLoading(false));
      void staffApi.markAllRead();
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: verticalScale(40) }} color={colors.directionsBlue} />
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(24) }]}>
          {items.length === 0 ? (
            <Text style={styles.empty}>No notifications yet.</Text>
          ) : (
            items.map((n) => (
              <View key={n.id} style={[styles.card, cardShadow]}>
                <View style={[styles.icon, { backgroundColor: '#EAF1FE' }]}><NotesIcon size={scale(20)} /></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{n.title}</Text>
                    {n.unread && <View style={styles.dot} />}
                  </View>
                  {!!n.body && <Text style={styles.body}>{n.body}</Text>}
                  {!!n.time && <Text style={styles.time}>{n.time}</Text>}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6), gap: verticalScale(12) },
  empty: { textAlign: 'center', fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted, marginTop: verticalScale(40) },
  card: { flexDirection: 'row', gap: scale(12), backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(14) },
  icon: { width: scale(40), height: scale(40), borderRadius: scale(20), alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  title: { flex: 1, fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  dot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: colors.brandRed },
  body: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(4) },
  time: { fontFamily: fonts.regular, fontSize: scale(11), color: '#A6ADB4', marginTop: verticalScale(6) },
});
