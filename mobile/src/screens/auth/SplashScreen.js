import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.2, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={['#FFF0F3', '#FFE4ED', '#FFF0F3']} style={styles.container}>
      <Animated.View style={[styles.ring, { transform: [{ scale: ringAnim }] }]} />
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={styles.logoCircle}>
          <Image
            source={require('../../../assets/logo.jpeg')}
            style={styles.logoImg}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.brandName}>Veagle Safety</Text>
        <Text style={styles.tagline}>Your 24/7 Safety Guardian</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBg,
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    opacity: 0.5,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 26 },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 20,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
