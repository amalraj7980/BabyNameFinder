/**
 * @format
 */

// Silence RN Firebase v22 namespaced-API migration warnings (noisy on every fetch).
// See: https://rnfirebase.io/migrating-to-v22
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
