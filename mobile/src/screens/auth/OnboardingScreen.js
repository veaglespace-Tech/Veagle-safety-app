import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    useLogo: true,
    emoji: '🛡️',
    title: 'Your Safety Guardian',
    subtitle: 'Veagle Safety keeps you protected 24/7 with real-time GPS tracking and instant emergency alerts.',
    bg: '#FFF0F3',
  },
  {
    id: '2',
    useLogo: false,
    emoji: '🆘',
    title: 'One-Touch Emergency SOS',
    subtitle: 'Hold the SOS button for 3 seconds to instantly broadcast your live location to all trusted guardians.',
    bg: '#FFF5F8',
  },
  {
    id: '3',
    useLogo: false,
    emoji: '👥',
    title: 'Trusted Guardian Network',
    subtitle: 'Add up to 5 trusted contacts. They\'ll receive instant alerts with your live GPS link during emergencies.',
    bg: '#FFF0F3',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => navigation.replace('Login');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <View style={styles.emojiWrap}>
              {item.useLogo ? (
                <Image
                  source={require('../../../assets/logo.jpeg')}
                  style={styles.logoImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.emoji}>{item.emoji}</Text>
              )}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsWrap}>
        {SLIDES.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth }, i === currentIndex && styles.dotActive]}
            />
          );
        })}
      </View>

      <View style={styles.bottomWrap}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 10 },
  skipText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emojiWrap: {
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 36,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 34 },
  emoji: { fontSize: 64 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryBorder,
  },
  dotActive: { backgroundColor: COLORS.primary },
  bottomWrap: { paddingHorizontal: 24, paddingBottom: 16 },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 16,
  },
  nextText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  loginLinkBold: { fontWeight: '800', color: COLORS.primary },
});
