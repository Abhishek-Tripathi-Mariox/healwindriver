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
import { setPushNavigator } from './src/services/push';
import { NAV_STATE_KEY } from './src/api/storage';
import { colors } from './src/theme';

function App(): React.JSX.Element {
  const incoming = useIncomingDispatch();
  // Restore the navigation stack so reopening returns to the same screen.
  const [navReady, setNavReady] = useState(false);
  const [initialState, setInitialState] = useState<any>(undefined);

  useEffect(() => {
    void authStore.bootstrap();
    setPushNavigator((route, params) => navigate(route as never, params as never));
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
    </SafeAreaProvider>
  );
}

export default App;
