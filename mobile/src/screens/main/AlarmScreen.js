import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const { height, width } = Dimensions.get('window');

export default function AlarmScreen() {
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  
  // Animation values for Siren
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  const startSiren = () => {
    setIsSirenActive(true);
    // Vibrate pattern: wait 0, vibrate 500ms, wait 200ms, vibrate 500ms... repeat
    Vibration.vibrate([0, 500, 200, 500], true); 
    
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
    Vibration.cancel();
    pulseScale.value = withTiming(1);
    pulseOpacity.value = withTiming(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Vibration.cancel();
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
          <Text style={styles.title}>Safety Tools</Text>
          <Text style={styles.subtitle}>Discreet and loud tools to deter threats.</Text>
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
              style={[styles.sirenBtn, isSirenActive ? styles.sirenBtnActive : styles.sirenBtnInactive]}
              onPress={isSirenActive ? stopSiren : startSiren}
              activeOpacity={0.8}
            >
              <Ionicons name={isSirenActive ? "volume-mute" : "volume-high"} size={48} color="#FFF" />
              <Text style={styles.sirenBtnText}>{isSirenActive ? 'STOP' : 'ACTIVATE'}</Text>
              <Text style={styles.sirenBtnSub}>{isSirenActive ? 'TAP TO MUTE' : 'LOUD ALARM'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>Use the alarm in public spaces to draw attention. The device will vibrate intensely and flash.</Text>
          </View>
        </View>

        {/* FAKE CALL TOOL */}
        <View style={styles.toolCard}>
          <View style={styles.fakeCallContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={28} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Fake Phone Call</Text>
              <Text style={styles.cardDesc}>Simulate an incoming phone call to excuse yourself from uncomfortable situations.</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.fakeCallBtn}
            onPress={() => {
              // Vibrate briefly to simulate phone ringing, then show fake call overlay
              Vibration.vibrate([0, 1000, 2000, 1000], true);
              setShowFakeCall(true);
            }}
          >
            <Text style={styles.fakeCallBtnText}>TRIGGER FAKE CALL NOW</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>

      {/* FAKE CALL OVERLAY */}
      {showFakeCall && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.fakeCallOverlay}>
          <View style={styles.callTop}>
            <Text style={styles.callCaller}>Dad</Text>
            <Text style={styles.callType}>Mobile</Text>
          </View>
          
          <View style={styles.callActions}>
            <View style={styles.callActionWrapper}>
              <TouchableOpacity 
                style={[styles.callBtn, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  Vibration.cancel();
                  setShowFakeCall(false);
                }}
              >
                <Ionicons name="call" size={32} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.callBtnLabel}>Decline</Text>
            </View>
            
            <View style={styles.callActionWrapper}>
              <TouchableOpacity 
                style={[styles.callBtn, { backgroundColor: '#34C759' }]}
                onPress={() => {
                  // Actually answering it? Just stop vibration and pretend to be on call, or just close it.
                  Vibration.cancel();
                  setShowFakeCall(false);
                }}
              >
                <Ionicons name="call" size={32} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.callBtnLabel}>Accept</Text>
            </View>
          </View>
        </Animated.View>
      )}

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
  infoText: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textDark, lineHeight: 16 },

  fakeCallContent: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  cardDesc: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 4, lineHeight: 16 },
  fakeCallBtn: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 100, alignItems: 'center', shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fakeCallBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  fakeCallOverlay: { position: 'absolute', top: 0, left: 0, width, height, backgroundColor: '#1C1C1E', zIndex: 999, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 60 },
  callTop: { alignItems: 'center' },
  callCaller: { color: '#FFF', fontSize: 36, fontWeight: '300' },
  callType: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: 8 },
  callActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40 },
  callActionWrapper: { alignItems: 'center', gap: 12 },
  callBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  callBtnLabel: { color: '#FFF', fontSize: 16, fontWeight: '500' }
});
