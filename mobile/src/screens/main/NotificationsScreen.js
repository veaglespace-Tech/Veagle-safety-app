import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;

// Dummy Notification Data
const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'SOS',
    title: 'Emergency SOS Triggered',
    message: 'Sarah Jenkins has triggered an SOS alert near your location.',
    timestamp: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'TEAM',
    title: 'Team Meeting Scheduled',
    message: 'Your team leader has scheduled a meeting for tomorrow at 10 AM.',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'SYSTEM',
    title: 'App Update Available',
    message: 'Version 2.4.0 is now available with new safety features.',
    timestamp: 'Yesterday',
    read: true,
  },
  {
    id: '4',
    type: 'SOS',
    title: 'SOS Alert Resolved',
    message: 'The SOS alert for John Doe has been marked as resolved.',
    timestamp: '2 days ago',
    read: true,
  }
];

// Helper to get icon config based on type
const getIconConfig = (type) => {
  switch (type) {
    case 'SOS': return { name: 'warning', color: COLORS.emergency, bg: 'rgba(239, 68, 68, 0.1)' };
    case 'TEAM': return { name: 'chatbubbles', color: COLORS.success, bg: 'rgba(34, 197, 94, 0.1)' };
    case 'SYSTEM': return { name: 'information-circle', color: COLORS.primary, bg: 'rgba(59, 130, 246, 0.1)' };
    default: return { name: 'notifications', color: COLORS.textMuted, bg: COLORS.primaryBorder };
  }
};

// Swipable Notification Item Component
const NotificationItem = React.memo(({ item, onDelete, onMarkRead }) => {
  const iconConfig = getIconConfig(item.type);
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(90); // Approximate height, adjusted dynamically if needed
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping left
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        // Swipe far enough -> Delete
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 });
        itemHeight.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onDelete)(item.id);
          }
        });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const animatedItemStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      height: itemHeight.value,
      opacity: opacity.value,
      marginBottom: itemHeight.value > 0 ? 1 : 0,
    };
  });

  return (
    <Animated.View style={[styles.swipeContainer, animatedContainerStyle]}>
      {/* Background Delete Action */}
      <View style={styles.deleteBackground}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </View>

      {/* Foreground Item */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.notificationCard, !item.read && styles.unreadCard, animatedItemStyle]}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.cardContent}
            onPress={() => {
              if (!item.read) onMarkRead(item.id);
            }}
          >
            {/* Unread Dot */}
            {!item.read && <View style={styles.unreadDot} />}

            {/* Icon */}
            <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
              <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
            </View>

            {/* Text Content */}
            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.timestamp, !item.read && styles.timestampUnread]}>
                  {item.timestamp}
                </Text>
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleDelete = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const handleMarkRead = useCallback((id) => {
    setNotifications((prev) => 
      prev.map((notif) => notif.id === id ? { ...notif, read: true } : notif)
    );
  }, []);

  const markAllAsRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn}>
              <Ionicons name="checkmark-done" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.markReadBtnPlaceholder} />
          )}
        </Animated.View>

        {/* List */}
        <Animated.FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          itemLayoutAnimation={Layout.springify()}
          ListEmptyComponent={() => (
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={48} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>
                You have no new notifications. We'll alert you if anything important happens.
              </Text>
            </Animated.View>
          )}
          renderItem={({ item }) => (
            <NotificationItem 
              item={item} 
              onDelete={handleDelete}
              onMarkRead={handleMarkRead}
            />
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
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
  headerTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  badge: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  markReadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadBtnPlaceholder: { width: 40 },

  // List
  listContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  
  // Swipe Container & Background
  swipeContainer: {
    width: '100%',
    backgroundColor: COLORS.emergency, // Red background for delete
    justifyContent: 'center',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Notification Card
  notificationCard: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  unreadCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.04)', // Subtle blue tint
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  // Elements inside Card
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  textWrap: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
    marginRight: 10,
  },
  titleUnread: {
    fontWeight: '900',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  timestampUnread: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
