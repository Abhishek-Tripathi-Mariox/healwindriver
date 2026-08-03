/**
 * HealWin Driver — bare React Native app entry.
 * @format
 */
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import { authStore } from './src/state/authStore';
import { useIncomingDispatch } from './src/state/dispatchStore';
import { setPushNavigator, subscribeForeground } from './src/services/push';
import { InAppBanner, BannerData } from './src/components/InAppBanner';
import { AlertHost } from './src/services/appAlert';
import { resolveNotifRoute } from './src/utils/notifRoute';
import { NAV_STATE_KEY } from './src/api/storage';
import { colors } from './src/theme';

function App(): React.JSX.Element {
  const incoming = useIncomingDispatch();
  // Restore the navigation stack so reopening returns to the same screen.
  const [navReady, setNavReady] = useState(false);
  const [initialState, setInitialState] = useState<any>(undefined);
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    void authStore.bootstrap();
    // Normalise the backend's route name (aliases + allow-list) so a tapped
    // push actually lands on the right screen instead of silently doing nothing.
    setPushNavigator((route, params) => {
      const { target } = resolveNotifRoute({ route, ...(params || {}) });
      if (target) navigate(target as never, params as never);
    });
    // Foreground push → branded in-app banner (not a plain OS Alert). A ringing
    // dispatch has its own full-screen modal, so don't also banner those.
    const unsub = subscribeForeground((title, body, data) => {
      if ((title || body) && data?.action !== 'incoming_dispatch') {
        setBanner({ title, body, data });
      }
    });
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(NAV_STATE_KEY);
        if (saved) setInitialState(JSON.parse(saved));
      } catch {
        /* ignore corrupt state */
      } finally {
        setNavReady(true);
      }
    })();
    return unsub;
  }, []);

  // Surface a ringing dispatch as the IncomingDispatch modal, wherever we are.
  useEffect(() => {
    if (!incoming) return;
    const current = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
    if (current !== 'IncomingDispatch') navigate('IncomingDispatch');
  }, [incoming]);

  if (!navReady) return <SafeAreaProvider />;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <NavigationContainer
        ref={navigationRef}
        initialState={initialState}
        onStateChange={(state) => {
          AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state)).catch(() => undefined);
        }}
      >
        <RootNavigator />
      </NavigationContainer>
      <InAppBanner
        notif={banner}
        onDismiss={() => setBanner(null)}
        onPress={(data) => {
          setBanner(null);
          const route = (data?.screen || data?.route) as string | undefined;
          if (route) navigate(route as never, data as never);
        }}
      />
      <AlertHost />
    </SafeAreaProvider>
  );
}

export default App;
