import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function GalleryScreen({ navigation }) {
  const media = [
    { id: 1, type: 'photo', date: 'Today, 2:30 PM', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' },
    { id: 2, type: 'video', date: 'Yesterday', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop' },
    { id: 3, type: 'photo', date: 'Aug 24, 2026', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop' },
    { id: 4, type: 'photo', date: 'Aug 21, 2026', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Evidence Gallery</Text>
      </View>

        <FlatList
          data={media}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', gap: 12 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.desc}>Photos and videos captured during active SOS sessions are securely vaulted here.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.mediaItem}>
              <Image source={{ uri: item.url }} style={styles.image} cachePolicy="disk" />
              <View style={styles.overlay}>
                <Ionicons name={item.type === 'video' ? 'videocam' : 'camera'} size={20} color="#FFF" />
              </View>
              <Text style={styles.mediaDate}>{item.date}</Text>
            </TouchableOpacity>
          )}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  scroll: { padding: 16 },

  desc: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 20, lineHeight: 20 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  mediaItem: { width: '48%', marginBottom: 16 },
  image: { width: '100%', height: 160, borderRadius: 16, backgroundColor: COLORS.primaryBorder },
  overlay: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 8 },
  mediaDate: { fontSize: 11, fontWeight: '700', color: COLORS.textDark, marginTop: 8, paddingHorizontal: 4 },
});
