import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchContacts, addContact, updateContact, deleteContact,
} from '../../redux/slices/contactsSlice';
import { COLORS } from '../../theme/colors';
import { RELATIONSHIPS } from '../../utils/constants';

const MAX_CONTACTS = 5;

export default function ContactsScreen() {
  const dispatch = useDispatch();
  const { contacts = [], isLoading } = useSelector((state) => state.contacts);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Sister');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingContact(null);
    setName(''); setRelationship('Sister'); setPhone(''); setEmail('');
    setSaved(false);
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setName(contact.name || ''); setRelationship(contact.relationship || 'Sister');
    setPhone(contact.phone || ''); setEmail(contact.email || '');
    setSaved(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert('Required', 'Name and mobile number are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingContact) {
        await dispatch(updateContact({ id: editingContact.id, name, relationship, phone, email })).unwrap();
      } else {
        await dispatch(addContact({ name, relationship, phone, email })).unwrap();
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
      }, 1000);
    } catch (err) {
      Alert.alert('Error', err || 'Could not save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Remove Contact',
      'They will no longer receive emergency alerts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => dispatch(deleteContact(id)) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Trusted Contacts</Text>
            <Text style={styles.subtitle}>
              {contacts.length > 0
                ? `${contacts.length} of ${MAX_CONTACTS} emergency contacts connected`
                : 'Add contacts to enable emergency alerts'}
            </Text>
          </View>
          {contacts.length < MAX_CONTACTS && (
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CONTACTS LIST */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="shield-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Contacts Added</Text>
            <Text style={styles.emptySub}>
              Add trusted family members or friends. They'll receive instant emergency emails with your live location link when SOS is activated.
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={openAddModal} activeOpacity={0.85}>
              <Text style={styles.addFirstBtnText}>+ Add First Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{(contact.name || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelLine}>{contact.relationship} · {contact.phone}</Text>
                  {contact.email ? <Text style={styles.contactEmail}>{contact.email}</Text> : null}
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${contact.phone}`)} style={styles.actionBtn}>
                    <Ionicons name="call" size={17} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditModal(contact)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={17} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(contact.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={17} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {contacts.length < MAX_CONTACTS && (
              <TouchableOpacity style={styles.addMoreBtn} onPress={openAddModal} activeOpacity={0.85}>
                <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
                <Text style={styles.addMoreText}>Add Another Trusted Contact</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PRIVACY NOTE */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyTitle}>🔒 Privacy & Safety</Text>
          <Text style={styles.privacyText}>
            Emergency alerts are sent only to people you explicitly add here. Location is only shared during active SOS sessions — not in the background.
          </Text>
        </View>

      </ScrollView>

      {/* ADD/EDIT MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingContact ? 'Edit Trusted Contact' : 'Add Trusted Contact'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {saved ? (
              <View style={styles.savedWrap}>
                <Text style={{ fontSize: 52 }}>✅</Text>
                <Text style={styles.savedTitle}>{editingContact ? 'Contact Updated!' : 'Contact Saved!'}</Text>
                <Text style={styles.savedSub}>They'll receive emergency alerts when SOS is activated.</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="Ananya Sharma" placeholderTextColor={COLORS.primaryBorder} />

                <Text style={styles.fieldLabel}>Relationship</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relPillRow}>
                  {RELATIONSHIPS.map(r => (
                    <TouchableOpacity key={r} onPress={() => setRelationship(r)}
                      style={[styles.relPill, relationship === r && styles.relPillActive]}>
                      <Text style={[styles.relPillText, relationship === r && styles.relPillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>Mobile Number *</Text>
                <TextInput style={styles.fieldInput} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor={COLORS.primaryBorder} keyboardType="phone-pad" />

                <Text style={styles.fieldLabel}>Email <Text style={styles.fieldLabelNote}>(For SOS alerts & live link)</Text></Text>
                <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} placeholder="contact@example.com" placeholderTextColor={COLORS.primaryBorder} keyboardType="email-address" autoCapitalize="none" />

                <TouchableOpacity
                  style={[styles.saveBtn, (saving || !name || !phone) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving || !name || !phone}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>{editingContact ? 'UPDATE TRUSTED CONTACT' : 'SAVE TRUSTED CONTACT'}</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  addBtnText: { fontSize: 12, fontWeight: '900', color: '#fff' },

  emptyCard: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 28, padding: 30, alignItems: 'center', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 6 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  emptySub: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 },
  addFirstBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, marginTop: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.38, shadowRadius: 14, elevation: 8 },
  addFirstBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 20, padding: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  contactAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  contactName: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  contactRelLine: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  contactEmail: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, marginTop: 1 },
  contactActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },

  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primaryBorder, borderRadius: 16, paddingVertical: 16, backgroundColor: COLORS.surface },
  addMoreText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },

  privacyNote: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 18, padding: 14 },
  privacyTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textDark, marginBottom: 6 },
  privacyText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 2, borderColor: COLORS.primaryBorder, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  modalTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textDark },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: 20, paddingBottom: 32 },
  fieldLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 7 },
  fieldLabelNote: { fontWeight: '600', color: COLORS.textMuted, textTransform: 'none' },
  fieldInput: { backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  relPillRow: { flexDirection: 'row', marginBottom: 2 },
  relPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.primaryBorder, backgroundColor: COLORS.surface, marginRight: 8 },
  relPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  relPillText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  relPillTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.38, shadowRadius: 14, elevation: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  savedWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  savedTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textDark },
  savedSub: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' },
});
