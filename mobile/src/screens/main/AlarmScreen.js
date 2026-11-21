import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';
import { playEmergencySiren, stopEmergencySiren } from '../../utils/soundPlayer';

export default function AlarmScreen() {
  const [isSirenActive, setIsSirenActive] = useState(false);
  
  // Animation values for Siren
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  const startSiren = () => {
    setIsSirenActive(true);
    playEmergencySiren(true);
    
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 500 }), withTiming(0.5, { duration: 500 })),
      -1,
      true
    );
  };

  const stopSiren = () => {
    setIsSirenActive(false);
    stopEmergencySiren();
    pulseScale.value = withTiming(1);
    pulseOpacity.value = withTiming(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEmergencySiren();
    };
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Siren</Text>
          <Text style={styles.subtitle}>High-decibel acoustic deterrence to summon help immediately.</Text>
        </View>

        {/* LOUD SIREN TOOL */}
        <View style={styles.toolCard}>
          <View style={[styles.toolHeader, isSirenActive ? { backgroundColor: COLORS.primary } : { backgroundColor: '#FFF0F3' }]}>
            <View style={[styles.statusDot, isSirenActive && styles.statusDotActive]} />
            <Text style={[styles.toolStatus, isSirenActive ? { color: '#FFF' } : { color: COLORS.primary }]}>
              {isSirenActive ? 'ALARM ACTIVE — BROADCASTING' : 'ALARM STANDBY'}
            </Text>
          </View>

          <View style={styles.sirenContainer}>
            {isSirenActive && (
              <Animated.View style={[styles.pulseRing, animatedRingStyle, { borderColor: COLORS.primary }]} />
            )}
            {isSirenActive && (
              <Animated.View style={[styles.pulseRingInner, animatedRingStyle, { backgroundColor: COLORS.primary }]} />
            )}
            
            <TouchableOpacity 
              onPress={isSirenActive ? stopSiren : startSiren}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={isSirenActive ? ['#FF2A6D', '#D91B55'] : ['#2A0826', '#3D0C38']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.sirenBtn}
              >
                <Ionicons name={isSirenActive ? "volume-mute" : "volume-high"} size={48} color="#FFF" />
                <Text style={styles.sirenBtnText}>{isSirenActive ? 'STOP' : 'ACTIVATE'}</Text>
                <Text style={styles.sirenBtnSub}>{isSirenActive ? 'TAP TO MUTE' : 'LOUD ALARM'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>Use the alarm in public spaces to draw attention. The device will vibrate intensely and flash.</Text>
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 20 },
  header: { marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textDark },
  subtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },

  toolCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 2, borderColor: COLORS.primaryBorder, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  toolHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.textMuted },
  statusDotActive: { backgroundColor: '#FFF' },
  toolStatus: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  sirenContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, position: 'relative' },
  pulseRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 4, zIndex: 0 },
  pulseRingInner: { position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: 0.1, zIndex: 0 },
  sirenBtn: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  sirenBtnInactive: { backgroundColor: COLORS.textDark },
  sirenBtnActive: { backgroundColor: COLORS.primary },
  sirenBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  sirenBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', marginTop: 2 },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, backgroundColor: '#FFF0F3', gap: 8 },
  infoText: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textDark, lineHeight: 16 }
});
