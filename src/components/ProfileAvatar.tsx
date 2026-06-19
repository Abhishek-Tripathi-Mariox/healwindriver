import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

import { EditIcon, PersonIcon } from './icons';
import { colors, scale } from '../theme';

export interface ProfileAvatarProps {
  /** Remote photo URL; falls back to a person icon when absent. */
  uri?: string;
  size?: number;
  /** Show the edit badge + make it tappable. */
  editable?: boolean;
  busy?: boolean;
  onPress?: () => void;
}

/** Round profile photo with a fallback icon, an edit badge, and a busy spinner. */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  uri,
  size = scale(80),
  editable = false,
  busy = false,
  onPress,
}) => {
  const r = size / 2;
  const inner = (
    <View style={[styles.circle, { width: size, height: size, borderRadius: r }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r }} />
      ) : (
        <PersonIcon size={size * 0.5} color={colors.directionsBlue} />
      )}
      {busy && (
        <View style={[styles.overlay, { borderRadius: r }]}>
          <ActivityIndicator color={colors.textWhite} />
        </View>
      )}
      {editable && !busy && (
        <View style={styles.badge}>
          <EditIcon size={scale(14)} color={colors.textWhite} />
        </View>
      )}
    </View>
  );

  if (!editable) return inner;
  return (
    <Pressable onPress={onPress} disabled={busy} hitSlop={8}>
      {inner}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: colors.directionsBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
