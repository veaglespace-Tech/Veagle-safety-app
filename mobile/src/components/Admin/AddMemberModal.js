import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const AddMemberModal = ({
  showAddModal,
  setShowAddModal,
  addIdentifier,
  setAddIdentifier,
  addMemberCode,
  setAddMemberCode,
  addDepartment,
  setAddDepartment,
  handleAddMember,
  addLoading
}) => {
  return (
    <Modal visible={showAddModal} transparent animationType="fade">
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="business" size={20} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Enroll Organization Member</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Member Registered Phone or Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email or 10-digit mobile"
                value={addIdentifier}
                onChangeText={setAddIdentifier}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroupRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Roll / Member Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. STU-102"
                  value={addMemberCode}
                  onChangeText={setAddMemberCode}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Department / Branch</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Science"
                  value={addDepartment}
                  onChangeText={setAddDepartment}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitBtn} 
                onPress={handleAddMember}
                disabled={addLoading}
              >
                {addLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>ENROLL MEMBER</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, paddingBottom: 16, marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  modalForm: { gap: 16 },
  
  inputGroup: { gap: 6 },
  inputGroupRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalCancelBtn: { flex: 1, height: 48, backgroundColor: '#FFF0F3', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { color: COLORS.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  modalSubmitBtn: { flex: 1, height: 48, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalSubmitText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});

export default AddMemberModal;
