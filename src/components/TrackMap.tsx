import React, { useEffect, useRef } from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import type { LatLng } from '../services/geo';
import { colors, fonts, scale } from '../theme';

export interface TrackMapProps {
  /** Ambulance / crew live position. */
  driver?: LatLng | null;
  /** Patient pickup location. */
  patient?: LatLng | null;
  style?: StyleProp<ViewStyle>;
}

// Centre of India — only used as a last resort before any real fix arrives.
const FALLBACK: Region = { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 12, longitudeDelta: 12 };
const toCoord = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

/**
 * Live tracking map for an active dispatch: shows the ambulance and the patient
 * as markers, a straight line between them, and keeps both framed as the crew
 * moves. Replaces the old static illustration so distance/position are real.
 */
export const TrackMap: React.FC<TrackMapProps> = ({ driver, patient, style }) => {
  const ref = useRef<MapView>(null);
  const points = [driver, patient].filter(Boolean) as LatLng[];

  // Keep the visible region framed around whatever points we have, and re-frame
  // as the driver's GPS updates.
  useEffect(() => {
    const map = ref.current;
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.animateToRegion(
        { ...toCoord(points[0]), latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    } else {
      map.fitToCoordinates(points.map(toCoord), {
        edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
        animated: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.lat, driver?.lng, patient?.lat, patient?.lng]);

  const initialRegion: Region = points[0]
    ? { ...toCoord(points[0]), latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : FALLBACK;

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        // Apple Maps on iOS (no key); Google Maps on Android (needs the key set
        // in gradle.properties — see AndroidManifest meta-data).
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        {patient && (
          <Marker coordinate={toCoord(patient)} title="Patient" pinColor={colors.brandRed} />
        )}
        {driver && (
          <Marker coordinate={toCoord(driver)} title="Ambulance" pinColor={colors.directionsBlue} />
        )}
        {driver && patient && (
          <Polyline
            coordinates={[toCoord(driver), toCoord(patient)]}
            strokeColor={colors.directionsBlue}
            strokeWidth={3}
          />
        )}
      </MapView>

      {points.length === 0 && (
        <View style={styles.placeholder} pointerEvents="none">
          <Text style={styles.placeholderText}>Locating…</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarCircle,
  },
  placeholderText: { fontFamily: fonts.medium, fontSize: scale(13), color: colors.inkMuted },
});
