import './ignoreWarnings';
import 'react-native-gesture-handler';
import './src/services/notificationService';
import './src/services/backgroundLocationService';
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
