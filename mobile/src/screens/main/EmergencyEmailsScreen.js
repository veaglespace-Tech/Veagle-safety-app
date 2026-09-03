import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Layout,
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmergencyEmails,
  addEmergencyEmail,
  deleteEmergencyEmail,
  toggleEmailActiveStatus,
} from '../../redux/slices/emergencyEmailsSlice';

export default function EmergencyEmailsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { emails, isLoading } = useSelector((state) => state.emergencyEmails);

  const [newEmail, setNewEmail] = useState('');

  // Pulsing animation for the Add button
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Fetch emails on mount
    dispatch(fetchEmergencyEmails());
  }, [dispatch, pulseScale]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const handleAddEmail = () => {
    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Invalid Email', 'Please enter a properly formatted email address.');
      return;
    }

    const emailPayload = {
      email: newEmail.trim().toLowerCase(),
    };

    dispatch(addEmergencyEmail(emailPayload));
    setNewEmail('');
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Remove Email',
      'Are you sure you want to stop sending SOS alerts to this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(deleteEmergencyEmail(id)),
        },
      ]
    );
  };

  const toggleActive = (id) => {
    dispatch(toggleEmailActiveStatus(id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Emergency Emails</Text>
            <Text style={styles.headerSub}>Manage SOS alert recipients</Text>
          </View>
        </Animated.View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Add new email address..."
              placeholderTextColor={COLORS.textMuted}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddEmail}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* List Section */}
        <Animated.FlatList
          data={emails}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          itemLayoutAnimation={Layout.springify()}
          ListEmptyComponent={() => (
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="mail-unread-outline" size={48} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>No Emails Added</Text>
              <Text style={styles.emptySub}>
                Add organization or team emails to ensure they receive instant alerts when you trigger an SOS.
              </Text>
            </Animated.View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInUp.delay(200 + (index * 100)).duration(400)}
              exiting={FadeOut.duration(300)}
              style={styles.emailCard}
            >
              <View style={styles.emailInfo}>
                <View style={[styles.avatar, !item.active && { backgroundColor: COLORS.textMuted }]}>
                  <Text style={styles.avatarText}>{item.email[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emailText, !item.active && styles.emailTextInactive]} numberOfLines={1}>
                    {item.email}
                  </Text>
                  <Text style={[styles.statusText, item.active ? styles.statusActive : styles.statusInactive]}>
                    {item.active ? 'Receiving Alerts' : 'Alerts Paused'}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Switch
                  value={item.active}
                  onValueChange={() => toggleActive(item.id)}
                  trackColor={{ false: COLORS.primaryBorder, true: COLORS.primaryLight }}
                  thumbColor={item.active ? COLORS.primary : '#f4f3f4'}
                  ios_backgroundColor={COLORS.primaryBorder}
                  style={{ transform: [{ scale: 0.8 }] }}
                />
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.emergency} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16 
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  emailTextInactive: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statusActive: {
    color: COLORS.success,
  },
  statusInactive: {
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red background
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
