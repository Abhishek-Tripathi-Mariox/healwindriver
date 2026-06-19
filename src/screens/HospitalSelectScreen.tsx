import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { MapPinIcon } from '../components/icons';
import { centresApi, Centre } from '../api/centres';
import { staffApi } from '../api/staff';
import { getCurrentPositionOnce } from '../services/location';
import { dispatchStore, useActiveDispatch } from '../state/dispatchStore';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HospitalSelect'>;

export const HospitalSelectScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const active = useActiveDispatch();
  const [list, setList] = React.useState<Centre[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const pos = await getCurrentPositionOnce();
      if (!pos) {
        if (alive) setLoading(false);
        return;
      }
      try {
        const c = await centresApi.nearby(pos.lat, pos.lng);
        if (alive) setList(c);
      } catch {
        if (alive) setList([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const choose = async (c: Centre) => {
    if (saving || !active) return;
    setSaving(c._id);
    const coords = c.location?.coordinates;
    const dest = {
      address: c.name + (c.address ? `, ${c.address}` : ''),
      lat: coords?.[1],
      lng: coords?.[0],
    };
    try {
      if (active.kind === 'request') await staffApi.requestDestination(active.id, dest);
      else if (active.kind === 'dispatch') await staffApi.dispatchDestination(active.id, dest);
    } catch {
      /* best-effort — still reflect locally */
    } finally {
      dispatchStore.setActiveDrop(dest.address);
      setSaving(null);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Select Drop-off Hospital" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: verticalScale(40) }} color={colors.directionsBlue} />
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(24) }]}>
          {list.length === 0 ? (
            <Text style={styles.empty}>No nearby hospitals found. Enable location and retry.</Text>
          ) : (
            list.map((c) => (
              <Pressable key={c._id} disabled={!!saving} onPress={() => choose(c)} style={[styles.card, cardShadow, saving === c._id && styles.pressed]}>
                <View style={styles.icon}><MapPinIcon size={scale(20)} color={colors.directionsBlue} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  {!!c.address && <Text style={styles.addr} numberOfLines={2}>{c.address}</Text>}
                </View>
                {c.distanceKm != null && <Text style={styles.km}>{c.distanceKm} km</Text>}
              </Pressable>
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
  card: { flexDirection: 'row', alignItems: 'center', gap: scale(12), backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(14) },
  icon: { width: scale(40), height: scale(40), borderRadius: scale(12), backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  addr: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(3) },
  km: { fontFamily: fonts.semiBold, fontSize: scale(12), color: colors.directionsBlue },
  pressed: { opacity: 0.7 },
});
