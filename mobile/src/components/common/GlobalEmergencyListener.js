import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import { API_URL } from '../../utils/constants';

export default function GlobalEmergencyListener() {
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const role = user?.role?.toUpperCase();
    if (!user || (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'ORGANIZATION')) return;

    const socket = io(API_URL.replace('/api', ''));
    
    socket.on('connect', () => {
      // Ensure exact room string matching
      if (user.organizationId) {
        socket.emit('joinRoom', `org_${user.organizationId}`);
      }
      socket.emit('joinRoom', 'admin-ops');
    });

    socket.on('SOS_ALARM_BROADCAST', async (data) => {
      Vibration.vibrate([500, 1000, 500, 1000], true);
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/police_siren.ogg' },
          { shouldPlay: true, isLooping: true }
        );
        setTimeout(() => {
          sound.stopAsync();
          Vibration.cancel();
        }, 10000);
      } catch (e) {
        console.log('Siren play failed', e);
      }
    });

    return () => {
      socket.disconnect();
      Vibration.cancel();
    };
  }, [user]);

  return null;
}
