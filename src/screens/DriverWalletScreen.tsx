import React from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenHeader } from '../components';
import { driverApi } from '../api/driver';
import { colors, fonts, radius, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DriverWallet'>;

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export const DriverWalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [balance, setBalance] = React.useState<number | null>(null);
  const [txns, setTxns] = React.useState<any[]>([]);
  const [bank, setBank] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [bankOpen, setBankOpen] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [bankForm, setBankForm] = React.useState({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '' });
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      driverApi.wallet().then((d: any) => setBalance(d?.balance ?? 0)).catch(() => setBalance(0)),
      driverApi.walletTransactions().then((l: any[]) => setTxns(l || [])).catch(() => setTxns([])),
      driverApi.bankDetails().then((b: any) => setBank(b || null)).catch(() => setBank(null)),
    ]).finally(() => setLoading(false));
  }, []);

  useFocusEffect(React.useCallback(() => load(), [load]));

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Enter amount', 'Enter a valid amount to withdraw.');
      return;
    }
    if (!bank?.accountNumber) {
      Alert.alert('Add bank details', 'Please add your bank account before withdrawing.');
      return;
    }
    setBusy(true);
    try {
      await driverApi.withdraw(amt);
      setWithdrawOpen(false);
      setAmount('');
      load();
      Alert.alert('Withdrawal requested', `₹${amt} withdrawal initiated to your bank.`);
    } catch (e: any) {
      Alert.alert('Could not withdraw', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const openBank = () => {
    setBankForm({
      accountHolderName: bank?.accountHolderName || '',
      bankName: bank?.bankName || '',
      accountNumber: bank?.accountNumber || '',
      ifscCode: bank?.ifscCode || '',
    });
    setBankOpen(true);
  };

  const saveBank = async () => {
    if (!bankForm.accountHolderName.trim() || !bankForm.accountNumber.trim() || !bankForm.ifscCode.trim()) {
      Alert.alert('Check details', 'Account holder, account number and IFSC are required.');
      return;
    }
    setBusy(true);
    try {
      await driverApi.saveBankDetails({
        accountHolderName: bankForm.accountHolderName.trim(),
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        ifscCode: bankForm.ifscCode.trim().toUpperCase(),
      });
      setBankOpen(false);
      load();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Wallet" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator color={colors.directionsBlue} style={{ marginTop: verticalScale(40) }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + verticalScale(24) }]}>
          <View style={[styles.balanceCard, cardShadow]}>
            <Text style={styles.balanceLabel}>Wallet balance</Text>
            <Text style={styles.balanceValue}>₹{balance ?? 0}</Text>
            <Pressable onPress={() => setWithdrawOpen(true)} style={({ pressed }) => [styles.withdrawBtn, pressed && styles.pressed]}>
              <Text style={styles.withdrawText}>Withdraw to bank</Text>
            </Pressable>
          </View>

          {/* Bank details */}
          <Pressable onPress={openBank} style={[styles.bankCard, cardShadow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankTitle}>Bank account</Text>
              {bank?.accountNumber ? (
                <Text style={styles.bankSub}>
                  {bank.bankName ? `${bank.bankName} · ` : ''}••••{String(bank.accountNumber).slice(-4)} · {bank.ifscCode}
                </Text>
              ) : (
                <Text style={styles.bankSub}>Add your bank account for payouts</Text>
              )}
            </View>
            <Text style={styles.bankAction}>{bank?.accountNumber ? 'Edit' : 'Add'}</Text>
          </Pressable>

          <Text style={styles.section}>Transactions</Text>
          {txns.length === 0 ? (
            <Text style={styles.empty}>No transactions yet.</Text>
          ) : (
            txns.map((t, i) => {
              const credit = (t.type || '').toUpperCase() === 'CREDIT' || (t.amount ?? 0) > 0;
              return (
                <View key={t._id || i} style={[styles.row, cardShadow]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{t.description || t.type || (credit ? 'Credit' : 'Debit')}</Text>
                    <Text style={styles.rowDate}>{fmt(t.createdAt)}</Text>
                  </View>
                  <Text style={[styles.rowAmt, { color: credit ? '#2E9B2E' : colors.brandRedDark }]}>
                    {credit ? '+' : '-'}₹{Math.abs(t.amount ?? 0)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Withdraw modal */}
      <Modal visible={withdrawOpen} transparent animationType="slide" onRequestClose={() => setWithdrawOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setWithdrawOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Withdraw to bank</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Amount (₹)" placeholderTextColor={colors.placeholder} style={styles.input} />
          <Pressable disabled={busy} onPress={withdraw} style={({ pressed }) => [styles.submit, (pressed || busy) && styles.pressed]}>
            <Text style={styles.submitText}>{busy ? 'Processing…' : 'Withdraw'}</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Bank details modal */}
      <Modal visible={bankOpen} transparent animationType="slide" onRequestClose={() => setBankOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setBankOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + verticalScale(16) }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Bank account</Text>
          {([
            ['accountHolderName', 'Account holder name'],
            ['bankName', 'Bank name'],
            ['accountNumber', 'Account number'],
            ['ifscCode', 'IFSC code'],
          ] as [keyof typeof bankForm, string][]).map(([k, label]) => (
            <View key={k}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                value={bankForm[k]}
                onChangeText={(v) => setBankForm((f) => ({ ...f, [k]: v }))}
                placeholder={label}
                placeholderTextColor={colors.placeholder}
                autoCapitalize={k === 'ifscCode' ? 'characters' : 'words'}
                keyboardType={k === 'accountNumber' ? 'number-pad' : 'default'}
                style={styles.input}
              />
            </View>
          ))}
          <Pressable disabled={busy} onPress={saveBank} style={({ pressed }) => [styles.submit, (pressed || busy) && styles.pressed]}>
            <Text style={styles.submitText}>{busy ? 'Saving…' : 'Save bank account'}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: verticalScale(6) },
  balanceCard: { backgroundColor: colors.directionsBlue, borderRadius: radius.card, padding: scale(22), alignItems: 'center' },
  balanceLabel: { fontFamily: fonts.medium, fontSize: scale(13), color: 'rgba(255,255,255,0.85)' },
  balanceValue: { fontFamily: fonts.bold, fontSize: scale(34), color: colors.textWhite, marginTop: verticalScale(4) },
  withdrawBtn: { marginTop: verticalScale(16), paddingHorizontal: scale(28), height: verticalScale(44), borderRadius: scale(22), backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  withdrawText: { fontFamily: fonts.bold, fontSize: scale(14), color: colors.textWhite },
  bankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(16), marginTop: verticalScale(14) },
  bankTitle: { fontFamily: fonts.semiBold, fontSize: scale(14), color: colors.textBlack },
  bankSub: { fontFamily: fonts.regular, fontSize: scale(12), color: colors.inkMuted, marginTop: verticalScale(4) },
  bankAction: { fontFamily: fonts.semiBold, fontSize: scale(13), color: colors.directionsBlue },
  section: { fontFamily: fonts.semiBold, fontSize: scale(15), color: colors.textBlack, marginTop: verticalScale(22), marginBottom: verticalScale(12) },
  empty: { textAlign: 'center', marginTop: verticalScale(20), fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, padding: scale(14), marginBottom: verticalScale(10) },
  rowTitle: { fontFamily: fonts.medium, fontSize: scale(13.5), color: colors.textBlack },
  rowDate: { fontFamily: fonts.regular, fontSize: scale(11), color: colors.inkMuted, marginTop: verticalScale(3) },
  rowAmt: { fontFamily: fonts.bold, fontSize: scale(14) },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopLeftRadius: scale(18), borderTopRightRadius: scale(18), paddingHorizontal: spacing.lg, paddingTop: verticalScale(10) },
  handle: { alignSelf: 'center', width: scale(90), height: scale(4), borderRadius: scale(3), backgroundColor: '#C9CDD2', marginBottom: verticalScale(14) },
  sheetTitle: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textBlack, marginBottom: verticalScale(8) },
  label: { fontFamily: fonts.medium, fontSize: scale(13), color: '#4A4A4A', marginTop: verticalScale(10), marginBottom: verticalScale(6) },
  input: { height: verticalScale(46), borderRadius: scale(10), borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: scale(14), fontFamily: fonts.regular, fontSize: scale(14), color: colors.textBlack, marginBottom: verticalScale(4) },
  submit: { height: verticalScale(50), borderRadius: scale(12), backgroundColor: colors.directionsBlue, alignItems: 'center', justifyContent: 'center', marginTop: verticalScale(18) },
  pressed: { opacity: 0.85 },
  submitText: { fontFamily: fonts.bold, fontSize: scale(16), color: colors.textWhite },
});
