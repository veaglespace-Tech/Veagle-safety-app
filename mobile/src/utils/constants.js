// API Constants — matching the web app's server connection
import { Platform } from 'react-native';

// For web browser: defaults to http://localhost:5000
// For physical phone: change 192.168.1.5 to your computer's local IP (cmd > ipconfig)
export const SERVER_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : 'http://192.168.1.5:5000';

export const API_URL = `${SERVER_URL}/api`;

export const TOKEN_KEY = 'tichi_token';

export const RELATIONSHIPS = [
  'Sister', 'Mother', 'Father', 'Brother',
  'Friend', 'Spouse', 'Guardian', 'Colleague'
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EMERGENCY_RELATIONS = [
  'Parent', 'Spouse', 'Sibling', 'Friend', 'Guardian'
];
