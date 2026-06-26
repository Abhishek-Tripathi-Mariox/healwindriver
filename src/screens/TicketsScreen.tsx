import React from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { supportApi } from '../api/support';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tickets'>;

const CATEGORIES = ['Shift', 'Payment', 'Vehicle', 'Account', 'Other'];

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const statusStyle = (s: string) => {
  const v = (s || '').toUpperCase();
  if (v === 'OPEN') return { bg: '#EAF1FE', fg: colors.directionsBlue, label: 'Open' };
  if (v === 'IN_PROGRESS') return { bg: '#FFF4E5', fg: '#B26A00', label: 'In progress' };
  if (v === 'WAITING_FOR_USER') return { bg: '#FFF4E5', fg: '#B26A00', label: 'Awaiting you' };
  if (v === 'RESOLVED' || v === 'CLOSED') return { bg: '#EEF1F5', fg: colors.metaGray, label: v === 'RESOLVED' ? 'Resolved' : 'Closed' };
  return { bg: '#EAF1FE', fg: colors.directionsBlue, label: v || 'Open' };
};

export const TicketsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ category: 'Shift', subject: '', message: '' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    supportApi.tickets().then((l: any[]) => setTickets(l || [])).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  useFocusEffect(React.useCallback(() => load(), [load]));

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      Alert.alert('Missing details', 'Please enter a subject and describe your issue.');
      return;
    }
    setSaving(true);
    try {
      await supportApi.createTicket({ category: form.category, subject: form.subject.trim(), message: form.message.trim() });
      setOpen(false);
      setForm({ category: 'Shift', subject: '', message: '' });
      load();
    } catch (e: any) {
      Alert.alert('Could not raise ticket', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Help & Support" onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator color={colors.directionsBlue} style={{ marginTop: verticalScale(40) }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + verticalScale(90) }]}>
          {tickets.length === 0 ? (
            <Text style={styles.empty}>No tickets yet. Raise one and our team will help you.</Text>
          ) : (
            tickets.map((t) => {
              const st = statusStyle(t.status);
              return (
                <Pressable
                  key={t._id}
                  onPress={() => navigation.navigate('TicketDetail', { id: t._id })}
                  style={({ pressed }) => [styles.card, cardShadow, pressed && styles.pressed]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.subject} numberOfLines={1}>{t.subject}</Text>
                    <View style={[styles.chip, { backgroundColor: st.bg }]}>
                      <Text style={[styles.chipText, { color: st.fg }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>{t.ticketId ? `#${t.ticketId} · ` : ''}{t.category} · {fmt(t.createdAt)}</Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      <Pressable style={[styles.fab, { bottom: insets.bottom + verticalScale(20) }]} onPress={() => setOpen(true)}>
        <Text style={styles.fabText}>＋ Raise a ticket</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Raise a ticket</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.cats}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setForm((f) => ({ ...f, category: c }))} style={[styles.cat, form.category === c && styles.catActive]}>
                <Text style={[styles.catText, form.category === c && styles.catTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Subject</Text>
          <TextInput value={form.subject} onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))} placeholder="Brief subject" placeholderTextColor={colors.placeholder} style={styles.input} />

          <Text style={styles.label}>Describe the issue</Text>
          <TextInput value={form.message} onChangeText={(v) => setForm((f) => ({ ...f, message: v }))} placeholder="What went wrong…" placeholderTextColor={colors.placeholder} multiline style={[styles.input, styles.textarea]} />

          <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.submit, (pressed || saving) && styles.pressed]}>
            <Text style={styles.submitText}>{saving ? 'Submitting…' : 'Submit ticket'}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6), gap: verticalScale(12) },
  empty: { textAlign: 'center', marginTop: verticalScale(50), fontFamily: fonts.medium, fontSize: scale(14), color: colors.inkMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16) },
  pressed: { opacity: 0.85 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: scale(10) },
  subject: { flex: 1, fontFamily: fonts.semiBold, fontSize: scale(14.5), color: colors.textBlack },
  chip: { borderRadius: scale(6), paddingHorizontal: scale(9), paddingVertical: verticalScale(3) },
  chipText: { fontFamily: fonts.semiBold, fontSize: scale(10) },
  meta: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(8) },
  fab: { position: 'absolute', alignSelf: 'center', paddingHorizontal: scale(24), height: verticalScale(50), borderRadius: scale(25), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', ...cardShadow },
  fabText: { fontFamily: fonts.bold, fontSize: scale(15), color: colors.textWhite },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), paddingHorizontal: spacing.lg, paddingTop: verticalScale(10) },
  handle: { alignSelf: 'center', width: scale(90), height: scale(4), borderRadius: scale(3), backgroundColor: '#C9CDD2', marginBottom: verticalScale(14) },
  sheetTitle: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack, marginBottom: verticalScale(12) },
  label: { fontFamily: fonts.medium, fontSize: scale(13), color: '#4A4A4A', marginTop: verticalScale(10), marginBottom: verticalScale(6) },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  cat: { paddingHorizontal: scale(14), height: verticalScale(34), borderRadius: scale(17), borderWidth: 1, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  catActive: { backgroundColor: colors.directionsBlue, borderColor: colors.directionsBlue },
  catText: { fontFamily: fonts.medium, fontSize: scale(12.5), color: '#5B5B5B' },
  catTextActive: { color: colors.textWhite },
  input: { borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(14), paddingVertical: verticalScale(10), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  textarea: { height: verticalScale(90), textAlignVertical: 'top' },
  submit: { height: verticalScale(50), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(18) },
  submitText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
