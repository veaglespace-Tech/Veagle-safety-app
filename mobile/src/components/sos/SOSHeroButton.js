import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { startEmergencySos } from '../../redux/slices/sosSlice';
import { store } from '../../redux/store';

import { useNavigation } from '@react-navigation/native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function SOSHeroButton() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { activeSession, isTriggering } = useSelector((state) => state.sos);
  
  const [holding, setHolding] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const [isSilent, setIsSilent] = useState(false);
  
  const holdProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const holdAnimRef = useRef(null);

  const HOLD_DURATION = 2000;
  
  // Progress stroke
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = holdProgress.interpolate({
    inputRange: [0, HOLD_DURATION],
    outputRange: [circumference, 0],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    // idle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    const listenerId = holdProgress.addListener(({ value }) => {
      const remainingSecs = Math.max(Math.ceil((HOLD_DURATION - value) / 1000), 1);
      setCountdown(remainingSecs);
    });
    return () => holdProgress.removeListener(listenerId);
  }, []);

  const handlePressIn = () => {
    if (activeSession) {
      navigation.navigate('ActiveSOS');
      return;
    }
    if (isTriggering) return;
    setHolding(true);
    setCountdown(2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();

    holdAnimRef.current = Animated.timing(holdProgress, {
      toValue: HOLD_DURATION,
      duration: HOLD_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    
    holdAnimRef.current.start(({ finished }) => {
      if (finished) {
        handleTriggered();
      }
    });
  };

  const handlePressOut = () => {
    if (activeSession || isTriggering || !holding) return;
    setHolding(false);
    if (holdAnimRef.current) holdAnimRef.current.stop();
    
    Animated.parallel([
      Animated.timing(holdProgress, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const handleTriggered = () => {
    setHolding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Vibration.vibrate([0, 500, 200, 500]);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    holdProgress.setValue(0);
    
    const { latitude, longitude, accuracy } = store.getState().location;
    
    dispatch(startEmergencySos({
      initialLat: latitude || 18.5204,
      initialLng: longitude || 73.8567,
      accuracy: accuracy || 10,
      isSilent
    }));
  };

  return (
    <View style={styles.container}>
      {/* 3D EMBLEM DYNAMIC CONTAINER */}
      <View style={styles.buttonWrapper}>
        
        {/* Pulsing Backlight */}
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: holding ? 1.2 : pulseAnim }] }]} pointerEvents="none" />
        
        {/* High Precision SVG Timer Ring */}
        <View style={styles.svgWrapper} pointerEvents="none">
          <Svg width={260} height={260} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Defs>
              <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF2A6D" />
                <Stop offset="50%" stopColor="#FF5C8A" />
                <Stop offset="100%" stopColor="#FFD700" />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="130" cy="130" r={radius} stroke="rgba(255, 204, 225, 0.4)" strokeWidth="6" fill="transparent" />
            <AnimatedCircle 
              cx="130" cy="130" r={radius} 
              stroke="url(#grad)" strokeWidth="10" 
              fill="transparent" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>
        </View>

        <TouchableOpacity 
          activeOpacity={1} 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut}
          disabled={isTriggering}
          style={{ zIndex: 10 }}
        >
          <Animated.View style={[styles.mainButton, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={
                activeSession ? ['#FF2A6D', '#E01A4F', '#2A0826'] :
                holding ? ['#E01A4F', '#FF2A6D', '#FFD700'] :
                isTriggering ? ['#FF5C8A', '#E01A4F', '#FF5C8A'] :
                ['#FF5C8A', '#FF2A6D', '#E01A4F']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBg}
            >
              <Ionicons name={isTriggering ? "hourglass-outline" : "shield-checkmark"} size={38} color={holding ? "#FFD700" : "#FFF"} style={{ marginBottom: 4 }} />
              <Text style={styles.buttonText}>{holding ? `${countdown}s` : isTriggering ? 'WAIT' : 'SOS'}</Text>
              <View style={[styles.badge, (holding || isTriggering) && styles.badgeHolding]}>
                <View style={[styles.badgeDot, (holding || isTriggering) && { backgroundColor: '#FFD700' }]} />
                <Text style={styles.badgeText}>
                  {holding ? 'DISPATCHING...' : isTriggering ? 'CONNECTING...' : activeSession ? 'VIEW STATUS' : 'HOLD 2 SECS'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.silentToggleWrap}>
        <View style={styles.infoBox}>
          <Ionicons name="radio" size={14} color="#FF2A6D" />
          <Text style={styles.infoBoxText}>Press & hold for 2 seconds to broadcast GPS location</Text>
        </View>
        <TouchableOpacity 
          style={[styles.silentToggle, isSilent ? styles.silentToggleOn : styles.silentToggleOff]}
          onPress={() => setIsSilent(!isSilent)}
          activeOpacity={0.8}
        >
          <Ionicons name={isSilent ? "volume-mute" : "volume-high"} size={16} color={isSilent ? "#FFF" : "#FF2A6D"} />
          <Text style={[styles.silentToggleText, isSilent ? { color: '#FFF' } : { color: '#2A0826' }]}>
            Silent Mode: {isSilent ? 'ON (Discreet)' : 'OFF (Loud Siren)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonWrapper: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF2A6D',
    opacity: 0.15,
  },
  svgWrapper: {
    position: 'absolute',
    width: 260,
    height: 260,
  },
  mainButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  gradientBg: {
    flex: 1,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeHolding: {
    backgroundColor: '#FF2A6D',
    borderColor: '#FFF',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  silentToggleWrap: {
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 6,
  },
  infoBoxText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#684E67',
  },
  silentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  silentToggleOff: {
    backgroundColor: '#FFF',
    borderColor: '#FFCCE1',
  },
  silentToggleOn: {
    backgroundColor: '#FF2A6D',
    borderColor: '#FF2A6D',
  },
  silentToggleText: {
    fontSize: 11,
    fontWeight: '800',
  }
});
