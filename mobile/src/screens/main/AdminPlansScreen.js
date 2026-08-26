import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { adminApi } from '../../api/adminApi';

export default function AdminPlansScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [gstPercentage, setGstPercentage] = useState('18');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [planForm, setPlanForm] = useState({
    id: null,
    name: '',
    description: '',
    basePrice: '',
    gstPercentage: 18,
    durationDays: '365',
    features: [],
    isActive: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [plansData, gstData] = await Promise.all([
        adminApi.getPlans(),
        adminApi.getGst().catch(() => ({ gstPercentage: 18 }))
      ]);
      setPlans(plansData.plans || []);
      if (gstData.gstPercentage !== undefined) {
        setGstPercentage(gstData.gstPercentage.toString());
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateGst = async () => {
    if (!gstPercentage || isNaN(gstPercentage)) return;
    try {
      const res = await adminApi.updateGst(parseFloat(gstPercentage));
      Alert.alert('Success', res.message || 'GST updated successfully');
      fetchSettings();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update GST rate');
    }
  };

  const handleToggleActive = async (planId) => {
    try {
      const res = await adminApi.togglePlanStatus(planId);
      Alert.alert('Success', res.message || 'Plan status toggled');
      fetchSettings();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.description || !planForm.basePrice || !planForm.durationDays) {
      Alert.alert('Required', 'Please fill out all required fields.');
      return;
    }

    try {
      setSaveLoading(true);
      const payload = {
        ...planForm,
        durationDays: parseInt(planForm.durationDays, 10) || 0,
        basePrice: parseFloat(planForm.basePrice) || 0,
        features: planForm.features.filter(f => f.trim().length > 0),
      };
      const res = await adminApi.savePlan(payload);
      Alert.alert('Success', res.message || 'Plan saved successfully');
      setShowModal(false);
      fetchSettings();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save plan');
    } finally {
      setSaveLoading(false);
    }
  };

  const openCreateModal = () => {
    setPlanForm({
      id: null,
      name: '',
      description: '',
      basePrice: '',
      gstPercentage: parseFloat(gstPercentage),
      durationDays: '365',
      features: [
        'Instant 3-Second Hold Emergency SOS',
        '5 Guardian Emergency Alerts (SMS & Push)',
        'Encrypted Real-Time Live GPS Map Sharing',
        'High-Decibel Siren Alarm & Siren Control'
      ],
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    let parsedFeats = [];
    if (p.features) {
      try {
        parsedFeats = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
      } catch (e) {
        parsedFeats = [];
      }
    }
    setPlanForm({
      id: p.id,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice.toString(),
      gstPercentage: p.gstPercentage || parseFloat(gstPercentage),
      durationDays: p.durationDays.toString(),
      features: parsedFeats,
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const activePlansCount = plans.filter(p => p.isActive).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Plan Management</Text>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>{activePlansCount} Active</Text>
          </View>
        </View>

        {/* GST CONTROL */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="options" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Global GST Rate</Text>
              <Text style={styles.cardSub}>Updates all plans instantly</Text>
            </View>
          </View>
          <View style={styles.gstRow}>
            <View style={styles.gstInputWrapper}>
              <Text style={styles.gstLabel}>GST %</Text>
              <TextInput
                style={styles.gstInput}
                value={gstPercentage}
                onChangeText={setGstPercentage}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateGst}>
              <Text style={styles.updateBtnText}>UPDATE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* PLANS LIST */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Subscription Plans</Text>
            <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.createBtnText}>NEW</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No plans found in database.</Text>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              {plans.map((p) => {
                const base = parseFloat(p.basePrice || 0);
                const gst = base === 0 ? 0 : parseFloat(p.gstPercentage || gstPercentage);
                const total = base === 0 ? 0 : parseFloat((base + (base * gst) / 100).toFixed(2));
                const planFeats = Array.isArray(p.features) ? p.features : [];

                return (
                  <View key={p.id} style={[styles.planCard, p.isActive ? styles.planCardActive : styles.planCardInactive]}>
                    <View style={styles.planHeader}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={[styles.statusBadge, p.isActive ? styles.statusActive : styles.statusInactive]}>
                          <Text style={[styles.statusText, p.isActive ? { color: COLORS.success } : { color: COLORS.textMuted }]}>
                            {p.isActive ? 'ENABLED' : 'DISABLED'}
                          </Text>
                        </View>
                        <Text style={styles.planName}>{p.name}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.totalPrice}>₹{total}</Text>
                        <Text style={styles.basePriceText}>{base === 0 ? 'FREE TRIAL' : `₹${base} + ${gst}%`}</Text>
                      </View>
                    </View>

                    <Text style={styles.planDesc}>{p.description}</Text>

                    {planFeats.length > 0 && (
                      <View style={styles.featuresList}>
                        <Text style={styles.featuresTitle}>Key Features:</Text>
                        {planFeats.slice(0, 3).map((f, i) => (
                          <View key={i} style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText} numberOfLines={1}>{f}</Text>
                          </View>
                        ))}
                        {planFeats.length > 3 && (
                          <Text style={styles.moreFeaturesText}>+ {planFeats.length - 3} more</Text>
                        )}
                      </View>
                    )}

                    <View style={styles.planActions}>
                      <Text style={styles.durationText}>Validity: {p.durationDays} Days</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(p)}>
                          <Text style={styles.editBtnText}>EDIT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.toggleBtn, p.isActive ? styles.toggleBtnOff : styles.toggleBtnOn]}
                          onPress={() => handleToggleActive(p.id)}
                        >
                          <Text style={[styles.toggleBtnText, p.isActive ? { color: COLORS.primary } : { color: COLORS.success }]}>
                            {p.isActive ? 'DISABLE' : 'ENABLE'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* CREATE / EDIT PLAN MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{planForm.id ? 'Edit Plan' : 'Create Plan'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
              <View>
                <Text style={styles.inputLabel}>Plan Name *</Text>
                <TextInput style={styles.input} value={planForm.name} onChangeText={(t) => setPlanForm({...planForm, name: t})} />
              </View>

              <View>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  value={planForm.description} 
                  onChangeText={(t) => setPlanForm({...planForm, description: t})} 
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Base Price (₹) *</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={planForm.basePrice} onChangeText={(t) => setPlanForm({...planForm, basePrice: t})} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Duration (Days) *</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={planForm.durationDays} onChangeText={(t) => setPlanForm({...planForm, durationDays: t})} />
                </View>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Features</Text>
                  <TouchableOpacity onPress={() => setPlanForm({...planForm, features: [...planForm.features, '']})}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary }}>+ Add Feature</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 8 }}>
                  {planForm.features.map((f, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput 
                        style={[styles.input, { flex: 1 }]} 
                        value={f} 
                        onChangeText={(t) => {
                          const nf = [...planForm.features];
                          nf[idx] = t;
                          setPlanForm({...planForm, features: nf});
                        }} 
                      />
                      <TouchableOpacity onPress={() => {
                        const nf = planForm.features.filter((_, i) => i !== idx);
                        setPlanForm({...planForm, features: nf});
                      }}>
                        <Ionicons name="trash" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSavePlan} disabled={saveLoading}>
                {saveLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalSubmitText}>SAVE PLAN</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, gap: 20 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  screenTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark },
  statsBadge: { backgroundColor: COLORS.success + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statsText: { color: COLORS.success, fontSize: 12, fontWeight: '900' },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  cardSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  
  gstRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gstInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F3', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.primaryBorder },
  gstLabel: { fontSize: 12, fontWeight: '900', color: COLORS.textDark, marginRight: 8 },
  gstInput: { flex: 1, fontSize: 16, fontWeight: '900', color: COLORS.primary },
  updateBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  updateBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, gap: 4 },
  createBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  emptyState: { padding: 40, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: COLORS.primaryBorder, borderStyle: 'dashed' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, fontWeight: 'bold' },

  plansContainer: { gap: 16 },
  planCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 2 },
  planCardActive: { borderColor: COLORS.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  planCardInactive: { borderColor: COLORS.primaryBorder, opacity: 0.7 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, alignSelf: 'flex-start', marginBottom: 8, borderWidth: 1 },
  statusActive: { backgroundColor: COLORS.success + '10', borderColor: COLORS.success + '40' },
  statusInactive: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  planName: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  totalPrice: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  basePriceText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted },
  planDesc: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, lineHeight: 18, marginBottom: 16 },
  
  featuresList: { borderTopWidth: 1, borderTopColor: COLORS.primaryBorder, paddingTop: 12, marginBottom: 16, gap: 6 },
  featuresTitle: { fontSize: 10, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
  featureText: { fontSize: 11, fontWeight: '700', color: COLORS.textDark, flex: 1 },
  moreFeaturesText: { fontSize: 10, fontWeight: '900', color: COLORS.primary, marginLeft: 10 },

  planActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.primaryBorder, paddingTop: 16 },
  durationText: { fontSize: 11, fontWeight: '900', color: COLORS.textDark },
  editBtn: { backgroundColor: '#FFF0F3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  editBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '900' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  toggleBtnOn: { backgroundColor: COLORS.success + '10', borderColor: COLORS.success + '40' },
  toggleBtnOff: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primaryBorder },
  toggleBtnText: { fontSize: 11, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark },
  inputLabel: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, marginBottom: 6 },
  input: { backgroundColor: '#FFF0F3', borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.primaryBorder },
  modalCancelBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 16, borderRadius: 100, alignItems: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  modalSubmitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 100, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalSubmitText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
