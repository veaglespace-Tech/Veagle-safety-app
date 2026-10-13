import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';

// ---------------------------------------------------------------------------
// Constants — gradient arrays are stable references so they don't cause
// LinearGradient to remount on every render.
// ---------------------------------------------------------------------------

const BG_GRADIENT  = ['#FFF0F3', '#FFE4ED', '#FFF0F3'];
const ANIM_CONFIG  = { useNativeDriver: true };

export default function SplashScreen() {
  // Animated values
  const scale    = useRef(new Animated.Value(0.65)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const ring1    = useRef(new Animated.Value(0.85)).current;
  const ring2    = useRef(new Animated.Value(0.75)).current;
  const slideY   = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 70, friction: 7, ...ANIM_CONFIG }),
      Animated.timing(opacity, { toValue: 1, duration: 550, ...ANIM_CONFIG }),
      Animated.spring(slideY,  { toValue: 0, tension: 80, friction: 8, ...ANIM_CONFIG }),
    ]).start();

    // Two staggered pulsing rings for depth
    const ring1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring1, { toValue: 1.25, duration: 1400, ...ANIM_CONFIG }),
        Animated.timing(ring1, { toValue: 0.85, duration: 1400, ...ANIM_CONFIG }),
      ]),
    );
    const ring2Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring2, { toValue: 1.15, duration: 1800, ...ANIM_CONFIG }),
        Animated.timing(ring2, { toValue: 0.75, duration: 1800, ...ANIM_CONFIG }),
      ]),
    );

    ring1Loop.start();
    // Slight delay so the two rings are never in sync
    const delay = setTimeout(() => ring2Loop.start(), 600);

    return () => {
      clearTimeout(delay);
      ring1Loop.stop();
      ring2Loop.stop();
    };
  }, []);

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.container}>

      {/* Outer pulsing ring */}
      <Animated.View
        style={[styles.ring, styles.ringOuter, { transform: [{ scale: ring1 }] }]}
      />

      {/* Inner pulsing ring */}
      <Animated.View
        style={[styles.ring, styles.ringInner, { transform: [{ scale: ring2 }] }]}
      />

      {/* Logo + text */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity,
            transform: [{ scale }, { translateY: slideY }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('../../../assets/logo.jpeg')}
            style={styles.logoImg}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.brandName}>SakhiSuraksha</Text>
        <Text style={styles.tagline}>Your 24/7 Safety Guardian</Text>

        {/* Loading indicator dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <PulsingDot key={i} delay={i * 200} />
          ))}
        </View>
      </Animated.View>

    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Pulsing dot — each dot fades in/out with a staggered delay
// ---------------------------------------------------------------------------

function PulsingDot({ delay }) {
  const dotOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 1,   duration: 500, delay, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 0.3, duration: 500,        useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rings
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderStyle: 'solid',
  },
  ringOuter: {
    width: 280,
    height: 280,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    opacity: 0.4,
  },
  ringInner: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.15,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },

  // Text
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 22,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 6,
    letterSpacing: 0.4,
  },

  // Loading dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
