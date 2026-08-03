import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon, WarningIcon } from '../components/icons';
import { colors, fonts, scale, spacing, verticalScale } from '../theme';
import { cardShadow } from '../theme/shadows';

/**
 * Drop-in replacement for React Native's `Alert.alert` with the app's own
 * design (rounded card, icon, pill buttons) instead of the plain OS dialog.
 * Same call signature, so call sites just swap the import:
 *   Alert.alert(title, message, buttons, options) → AppAlert.alert(...)
 * Render <AlertHost /> once near the app root (see App.tsx).
 */

export interface AppAlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}
interface AppAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}
interface QueuedAlert {
  id: number;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  options?: AppAlertOptions;
}

let queue: QueuedAlert[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => queue[0] ?? null;

const alert = (
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
  options?: AppAlertOptions,
) => {
  const normalized = buttons && buttons.length ? buttons : [{ text: 'OK', style: 'default' as const }];
  queue = [...queue, { id: nextId++, title, message, buttons: normalized, options }];
  emit();
};

const dismissCurrent = () => {
  queue = queue.slice(1);
  emit();
};

export const AppAlert = { alert };

// Titles/messages that read as an error/warning get the red tone automatically
// (matches this codebase's existing copy: "Could not…", "…failed", etc.) so
// call sites don't need to pass an extra "tone" param through the drop-in API.
const WARN_HINT = /error|fail|could not|invalid|denied|not available|not found|wrong|incorrect|expired/i;

export const AlertHost: React.FC = () => {
  const current = React.useSyncExternalStore(subscribe, getSnapshot);
  if (!current) return null;

  const tone: 'warn' | 'ok' =
    current.buttons.some((b) => b.style === 'destructive') ||
    WARN_HINT.test(current.title) ||
    (current.message ? WARN_HINT.test(current.message) : false)
      ? 'warn'
      : 'ok';

  const press = (b: AppAlertButton) => {
    dismissCurrent();
    b.onPress?.();
  };

  const close = () => {
    if (current.options?.cancelable === false) return;
    dismissCurrent();
    current.options?.onDismiss?.();
  };

  const stacked = current.buttons.length >= 3;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.card, cardShadow]} onPress={() => undefined}>
          <View style={styles.iconWrap}>
            {tone === 'warn' ? (
              <WarningIcon size={scale(46)} color={colors.brandRedDark} />
            ) : (
              <CheckCircleIcon size={scale(52)} color={colors.payGreen} />
            )}
          </View>
          <Text style={styles.title}>{current.title}</Text>
          {!!current.message && <Text style={styles.message}>{current.message}</Text>}
          <View style={[styles.btnRow, stacked && styles.btnCol]}>
            {current.buttons.map((b, i) => (
              <Pressable
                key={`${b.text}-${i}`}
                style={({ pressed }) => [
                  styles.btn,
                  b.style === 'cancel'
                    ? styles.btnCancel
                    : b.style === 'destructive'
                      ? styles.btnDestructive
                      : styles.btnDefault,
                  stacked ? styles.btnFull : styles.btnFlex,
                  pressed && styles.pressed,
                ]}
                onPress={() => press(b)}
              >
                <Text style={[styles.btnText, b.style === 'cancel' ? styles.btnTextCancel : styles.btnTextSolid]}>
                  {b.text || 'OK'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(17,20,24,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  card: { width: '100%', maxWidth: scale(340), backgroundColor: colors.surface, borderRadius: scale(22), paddingHorizontal: scale(22), paddingTop: scale(26), paddingBottom: scale(20), alignItems: 'center' },
  iconWrap: { marginBottom: verticalScale(14) },
  title: { fontFamily: fonts.bold, fontSize: scale(18), color: colors.textBlack, textAlign: 'center' },
  message: { fontFamily: fonts.regular, fontSize: scale(13), color: colors.inkMuted, textAlign: 'center', lineHeight: scale(19), marginTop: verticalScale(8) },
  btnRow: { flexDirection: 'row', gap: scale(10), width: '100%', marginTop: verticalScale(22) },
  btnCol: { flexDirection: 'column' },
  btn: { height: verticalScale(48), borderRadius: scale(24), alignItems: 'center', justifyContent: 'center' },
  btnFlex: { flex: 1 },
  btnFull: { width: '100%' },
  btnCancel: { borderWidth: 1.5, borderColor: colors.inputBorder, backgroundColor: 'transparent' },
  btnDefault: { backgroundColor: colors.directionsBlue },
  btnDestructive: { backgroundColor: colors.brandRedDark },
  btnText: { fontFamily: fonts.bold, fontSize: scale(14.5) },
  btnTextCancel: { color: colors.inkMuted, fontFamily: fonts.semiBold },
  btnTextSolid: { color: colors.textWhite },
  pressed: { opacity: 0.85 },
});
