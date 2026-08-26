// API Constants — matching the web app's server connection
import { Platform } from 'react-native';

// For online backend:
export const SERVER_URL = 'https://sakhisuraksha.veaglespace.com';

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
