/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Background / quit-state FCM handler. Guarded so the app still runs when
// Firebase isn't configured (no/placeholder google-services.json).
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {getApp} = require('@react-native-firebase/app');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    getMessaging,
    setBackgroundMessageHandler,
  } = require('@react-native-firebase/messaging');
  setBackgroundMessageHandler(getMessaging(getApp()), async () => {});
} catch (e) {
  // Firebase not configured — push disabled, app continues normally.
}

AppRegistry.registerComponent(appName, () => App);
