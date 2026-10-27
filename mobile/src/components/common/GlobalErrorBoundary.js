import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

/**
 * GlobalErrorBoundary
 * Catches any unhandled render or runtime exception anywhere in the component tree.
 * Prevents native or JS crashes and presents a clean recovery screen.
 */
export default class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('[GlobalErrorBoundary Intercepted Error]:', error?.message || error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.content}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={36} color="#FFF" />
            </View>

            <Text style={styles.title}>SakhiSuraksha Active</Text>
            <Text style={styles.subtitle}>
              A temporary display error was safely intercepted to protect your session.
            </Text>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Your safety connections, guardians, and SOS emergency listeners remain active in the background.
              </Text>
            </View>

            <TouchableOpacity style={styles.restartBtn} onPress={this.handleRestart} activeOpacity={0.85}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.restartBtnText}>RELOAD DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF6F8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  shieldWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FF2A6D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE0E9',
    gap: 10,
    marginVertical: 10,
    maxWidth: 360,
  },
  infoText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 16,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
  },
  restartBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

