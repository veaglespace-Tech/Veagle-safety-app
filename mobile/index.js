import './ignoreWarnings';
import 'react-native-gesture-handler';
import { setupFirebaseBackgroundMessageHandler } from './src/services/notificationService';
import './src/services/backgroundLocationService';
import { registerRootComponent } from 'expo';
import App from './App';

// Register headless native background handler early before AppRegistry initialization
setupFirebaseBackgroundMessageHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
