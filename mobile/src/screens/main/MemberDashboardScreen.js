import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../theme/colors';
import { startEmergencySos } from '../../redux/slices/sosSlice';

export default function MemberDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { latitude, longitude, accuracy } = useSelector((state) => state.location);
  const firstName = (user?.fullName || user?.name || 'Member').split(' ')[0];

  const sosScale = useSharedValue(1);

  const animatedSosStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: sosScale.value }] };
  });

  const handleSOSPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Vibration.vibrate([0, 500, 200, 500]);
    sosScale.value = withSpring(0.9, {}, () => { sosScale.value = withSpring(1); });
    
    dispatch(startEmergencySos({
      latitude: latitude || 18.5204,
      longitude: longitude || 73.8567,
      accuracy: accuracy || 10,
    }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Animated Welcome Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Organization Member</Text>
            <Text style={styles.name}>Welcome, {firstName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
          </View>
        </Animated.View>

        {/* SOS Quick Action */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.sosCard}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleSOSPress} style={{ width: '100%', alignItems: 'center' }}>
            <Animated.View style={[styles.sosButton, animatedSosStyle]}>
              <Ionicons name="warning" size={40} color="#fff" />
              <Text style={styles.sosButtonText}>TAP FOR SOS</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Glassmorphism Summary Cards */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.statsContainer}>
          <View style={styles.glassCard}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Safety Score</Text>
          </View>
          <View style={styles.glassCard}>
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>Ready</Text>
            <Text style={styles.statLabel}>Journey Tracking</Text>
          </View>
        </Animated.View>

        {/* Personal Resources */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>My Safety Tools</Text>
          </View>
          
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Journey')}>
            <Ionicons name="map" size={20} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionTitle}>Start Journey</Text>
              <Text style={styles.actionSub}>Share live location with team leader</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Contacts')}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionTitle}>My Guardians</Text>
              <Text style={styles.actionSub}>Manage personal emergency contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 16 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  greeting: { fontSize: 13, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatarText: { fontSize: 20, fontWeight: '900', color: COLORS.primary },

  sosCard: { backgroundColor: COLORS.surface, borderRadius: 28, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
  sosButton: { backgroundColor: COLORS.primary, width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  sosButtonText: { color: '#fff', fontWeight: '900', fontSize: 12, marginTop: 8, letterSpacing: 1 },

  statsContainer: { flexDirection: 'row', gap: 12 },
  glassCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, alignItems: 'flex-start' },
  statValue: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, marginTop: 12 },
  statLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
  
  card: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, marginTop: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  actionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  actionSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
});
