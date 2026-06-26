import React from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { supportApi } from '../api/support';
import { socketService } from '../services/socket';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TicketDetail'>;
type Rt = RouteProp<RootStackParamList, 'TicketDetail'>;

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export const TicketDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const scrollRef = React.useRef<ScrollView>(null);
  const [ticket, setTicket] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [reopening, setReopening] = React.useState(false);

  const load = React.useCallback(() => {
    supportApi
      .ticket(params.id)
      .then((d: any) => {
        setTicket(d?.ticket || null);
        setMessages(d?.messages || []);
      })
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  React.useEffect(() => load(), [load]);

  // Live updates: the backend pushes `support:message` to this driver/staff
  // whenever the support team replies / changes status — reload instantly.
  React.useEffect(() => {
    void socketService.connect();
    const off = socketService.on('support:message', (d: any) => {
      if (!d?.ticketObjId || d.ticketObjId === params.id) load();
    });
    return off;
  }, [params.id, load]);

  const closed = ['RESOLVED', 'CLOSED'].includes(String(ticket?.status || '').toUpperCase());

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await supportApi.addMessage(params.id, text.trim());
      setText('');
      setReopening(false);
      load();
    } catch (e: any) {
      Alert.alert('Could not send', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    Alert.alert('Close ticket?', 'Mark this ticket as resolved?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          try {
            await supportApi.closeTicket(params.id);
            load();
          } catch {
            Alert.alert('Could not close', 'Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Ticket" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.directionsBlue} style={{ marginTop: verticalScale(40) }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={ticket?.subject || 'Ticket'} onBack={() => navigation.goBack()} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.thread, { paddingBottom: verticalScale(16) }]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {!!ticket && (
          <View style={styles.metaBar}>
            <Text style={styles.metaText}>
              {ticket.ticketId ? `#${ticket.ticketId} · ` : ''}{ticket.category} · {String(ticket.status || '').replace(/_/g, ' ')}
            </Text>
          </View>
        )}
        {messages.map((m, i) => {
          // senderType is UPPERCASE. SYSTEM = status/automated note → centred;
          // my own messages (DRIVER/STAFF) → right; support (ADMIN) → left.
          const type = String(m.senderType || m.sender || '').toUpperCase();
          if (type === 'SYSTEM') {
            return (
              <View key={m._id || i} style={styles.systemWrap}>
                <Text style={styles.systemText}>{m.message || m.content}</Text>
              </View>
            );
          }
          const mine = type === 'DRIVER' || type === 'STAFF';
          return (
            <View key={m._id || i} style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.themWrap]}>
              {!mine && <Text style={styles.senderLabel}>Support</Text>}
              <View style={[styles.bubble, mine ? styles.mine : styles.them]}>
                <Text style={[styles.bubbleText, mine && { color: colors.textWhite }]}>{m.message || m.content}</Text>
              </View>
              <Text style={styles.time}>{fmt(m.createdAt)}</Text>
            </View>
          );
        })}
        {messages.length === 0 && <Text style={styles.empty}>No replies yet. Our team will respond soon.</Text>}
      </ScrollView>

      {closed && !reopening ? (
        <View style={[styles.closedBar, { paddingBottom: insets.bottom + verticalScale(10) }]}>
          <Text style={styles.closedText}>
            This ticket is {String(ticket?.status || 'closed').toLowerCase()}.
          </Text>
          <Pressable onPress={() => setReopening(true)} style={styles.reopenBtn}>
            <Text style={styles.reopenText}>Reopen ticket</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.composer, { paddingBottom: insets.bottom + verticalScale(8) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={closed ? 'Type why you’re reopening…' : 'Type a reply…'}
            placeholderTextColor={colors.placeholder}
            style={styles.composerInput}
            multiline
          />
          <Pressable onPress={send} disabled={busy || !text.trim()} style={[styles.sendBtn, (busy || !text.trim()) && styles.disabled]}>
            <Text style={styles.sendText}>{closed ? 'Reopen' : 'Send'}</Text>
          </Pressable>
          {!closed && (
            <Pressable onPress={close} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  thread: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(8), gap: verticalScale(4) },
  metaBar: { alignSelf: 'center', backgroundColor: '#EEF1F5', borderRadius: scale(8), paddingHorizontal: scale(12), paddingVertical: verticalScale(5), marginBottom: verticalScale(10) },
  metaText: { fontFamily: fonts.medium, fontSize: scale(11.5), color: colors.inkMuted, textTransform: 'capitalize' },
  empty: { textAlign: 'center', marginTop: verticalScale(30), fontFamily: fonts.regular, fontSize: scale(13), color: colors.inkMuted },
  systemWrap: { alignSelf: 'center', backgroundColor: '#F1F3F6', borderRadius: scale(8), paddingHorizontal: scale(12), paddingVertical: verticalScale(6), marginVertical: verticalScale(6), maxWidth: '90%' },
  systemText: { fontFamily: fonts.medium, fontSize: scale(11.5), color: colors.inkMuted, textAlign: 'center' },
  senderLabel: { fontFamily: fonts.semiBold, fontSize: scale(10.5), color: colors.inkMuted, marginBottom: verticalScale(2), marginLeft: scale(4) },
  bubbleWrap: { maxWidth: '82%', marginVertical: verticalScale(5) },
  mineWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  themWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: scale(14), paddingHorizontal: scale(14), paddingVertical: verticalScale(10) },
  mine: { backgroundColor: colors.directionsBlue, borderBottomRightRadius: scale(4) },
  them: { backgroundColor: colors.surface, borderBottomLeftRadius: scale(4) },
  bubbleText: { fontFamily: fonts.regular, fontSize: scale(13.5), color: colors.textBlack, lineHeight: scale(19) },
  time: { fontFamily: fonts.regular, fontSize: scale(10), color: '#A6ADB4', marginTop: verticalScale(3) },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: scale(8), paddingHorizontal: spacing.lg, paddingTop: verticalScale(8), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E2E2', backgroundColor: colors.surface },
  composerInput: { flex: 1, maxHeight: verticalScale(100), minHeight: verticalScale(42), borderRadius: scale(20), borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: scale(14), paddingVertical: verticalScale(9), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack },
  sendBtn: { paddingHorizontal: scale(16), height: verticalScale(42), borderRadius: scale(21), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  sendText: { fontFamily: fonts.bold, fontSize: scale(13), color: colors.textWhite },
  closeBtn: { paddingHorizontal: scale(12), height: verticalScale(42), alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontFamily: fonts.semiBold, fontSize: scale(12), color: colors.brandRedDark },
  closedBar: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(12), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E2E2', alignItems: 'center', gap: verticalScale(10) },
  closedText: { textAlign: 'center', fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted, textTransform: 'capitalize' },
  reopenBtn: { paddingHorizontal: scale(20), height: verticalScale(42), borderRadius: scale(21), borderWidth: 1, borderColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center' },
  reopenText: { fontFamily: fonts.bold, fontSize: scale(13), color: colors.directionsBlue },
});
