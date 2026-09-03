import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../theme/colors';

// Example dummy data
const DUMMY_POSTS = [
  {
    id: '1',
    author: 'Sarah Jenkins',
    role: 'Admin',
    avatarText: 'S',
    timestamp: '2 hours ago',
    content: 'Please ensure your emergency contacts are up to date before the long weekend. Stay safe!',
    image: null,
    likes: 12,
    comments: 4,
    likedByMe: false,
  },
  {
    id: '2',
    author: 'David Chen',
    role: 'Team Leader',
    avatarText: 'D',
    timestamp: '5 hours ago',
    content: 'We are rolling out a new journey tracking feature next week. I will schedule a brief meeting to go over the details.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    likes: 34,
    comments: 8,
    likedByMe: true,
  },
  {
    id: '3',
    author: 'Safety System',
    role: 'System',
    avatarText: '⚙️',
    timestamp: '1 day ago',
    content: 'Routine server maintenance scheduled for tonight at 2 AM EST. The app will be in offline mode for 30 minutes.',
    image: null,
    likes: 5,
    comments: 0,
    likedByMe: false,
  },
];

// Interactive Post Component
const PostCard = React.memo(({ post }) => {
  const [isLiked, setIsLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likes);
  
  const heartScale = useSharedValue(1);

  const heartAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: heartScale.value }],
    };
  });

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Spring animation for the heart icon
    heartScale.value = withSequence(
      withSpring(1.5, { damping: 2, stiffness: 80 }),
      withSpring(1)
    );

    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.avatarText}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.authorRole}>{post.role}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.optionsBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.image }} style={styles.postImage} />
        </View>
      )}

      {/* Interactions Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={handleLike}
          activeOpacity={0.8}
        >
            <Animated.View style={heartAnimatedStyle}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={22} 
                color={isLiked ? COLORS.emergency : COLORS.textMuted} 
              />
            </Animated.View>
            <Text style={[styles.actionText, isLiked && { color: COLORS.emergency }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default function AnnouncementsScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  
  // Conditionally render FAB based on role
  const role = user?.role?.toLowerCase() || 'member';
  const canCreatePost = role === 'admin' || role === 'team-leader' || role === 'org';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSub}>Latest updates from your organization</Text>
      </Animated.View>

      {/* Feed */}
      <FlatList
        data={DUMMY_POSTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PostCard post={item} />}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      />

      {/* Floating Action Button (FAB) for Admins & Team Leaders */}
      {canCreatePost && (
        <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.fab} 
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Navigate to a CreatePostScreen (not implemented yet)
            }}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },
  
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100, // padding for FAB
    gap: 20,
  },
  
  // Post Card Styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  authorRole: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  optionsBtn: {
    padding: 4,
  },
  
  postContent: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.primaryBg,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryBorder,
    paddingTop: 14,
    gap: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
