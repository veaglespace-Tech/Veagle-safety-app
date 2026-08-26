import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { adminApi } from '../../api/adminApi';

export default function AdminPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPayments();
      setPayments(res.payments || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (p.txnid || '').toLowerCase().includes(q) || (p.user?.fullName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Payments & Revenue</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPayments} disabled={loading}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* SUMMARY CARDS */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              ₹{summary?.totalRevenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={[styles.summaryValue, { color: COLORS.textDark }]}>
              {summary?.successCount || 0}
            </Text>
          </View>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <View style={[styles.summaryCard, { marginTop: 12, marginBottom: 20 }]}>
            <Text style={styles.summaryLabel}>GST Tax Collected</Text>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
              ₹{summary?.totalGstCollected?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.summarySub}>18% GST audit ledger</Text>
          </View>
        </Animated.View>

        {/* FILTERS */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Txn ID or member..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.statusFilters}>
            {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* TRANSACTIONS LIST */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.listContainer}>
          <Text style={styles.listTitle}>Transaction History ({filteredPayments.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filteredPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No payment transactions found.</Text>
            </View>
          ) : (
            <View style={styles.transactionsWrapper}>
              {filteredPayments.map((p) => (
                <TouchableOpacity 
                  key={p.id} 
                  style={styles.txnCard}
                  onPress={() => setSelectedReceipt(p)}
                >
                  <View style={styles.txnHeader}>
                    <View>
                      <Text style={styles.txnId}>{p.txnid}</Text>
                      <Text style={styles.txnDate}>{new Date(p.createdAt).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.txnAmount}>₹{p.amount?.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.txnBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txnMember}>{p.user?.fullName || 'Anonymous Member'}</Text>
                      <Text style={styles.txnPlan}>{p.plan?.name || 'Sakhi Protection Plan'}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      p.status === 'SUCCESS' ? styles.statusSuccess :
                      p.status === 'PENDING' ? styles.statusPending : styles.statusFailed
                    ]}>
                      <Text style={[
                        styles.statusText,
                        p.status === 'SUCCESS' ? { color: COLORS.success } :
                        p.status === 'PENDING' ? { color: '#D97706' } : { color: COLORS.primary }
                      ]}>{p.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

      </ScrollView>

      {/* RECEIPT MODAL */}
      <Modal visible={!!selectedReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReceipt && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Official Receipt</Text>
                    <Text style={styles.modalTxnId}>{selectedReceipt.txnid}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReceipt(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>

                <View style={styles.receiptBody}>
                  <View style={styles.receiptSection}>
                    <Text style={styles.sectionLabel}>Member & Plan Info</Text>
                    <Text style={styles.receiptMember}>{selectedReceipt.user?.fullName || 'Anonymous'}</Text>
                    <Text style={styles.receiptEmail}>{selectedReceipt.user?.email}</Text>
                    <Text style={styles.receiptPlan}>{selectedReceipt.plan?.name}</Text>
                  </View>

                  <View style={[styles.receiptSection, { backgroundColor: '#FFF' }]}>
                    <Text style={styles.sectionLabel}>Itemized Billing</Text>
                    <View style={styles.billRow}>
                      <Text style={styles.billKey}>Base Plan Net Price:</Text>
                      <Text style={styles.billVal}>₹{selectedReceipt.baseAmount?.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.billRow, styles.billRowDashed]}>
                      <Text style={styles.billKey}>GST ({selectedReceipt.gstPercentage}%):</Text>
                      <Text style={styles.billVal}>₹{selectedReceipt.gstAmount?.toFixed(2)}</Text>
                    </View>
                    <View style={styles.billRowTotal}>
                      <Text style={styles.billTotalKey}>Total Paid:</Text>
                      <Text style={styles.billTotalVal}>₹{selectedReceipt.amount?.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.receiptFooter}>
                    <Text style={styles.receiptFooterText}>Status: {selectedReceipt.status}</Text>
                    <Text style={styles.receiptFooterText}>{new Date(selectedReceipt.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedReceipt(null)}>
                  <Text style={styles.modalCloseText}>CLOSE RECEIPT</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  backBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  screenTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark },
  refreshBtn: { padding: 8, backgroundColor: '#FFF0F3', borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  
  summaryGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
  summaryCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 2, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  summaryLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: '900' },
  summarySub: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', marginTop: 4 },

  filterSection: { marginBottom: 24, gap: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F3', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.primaryBorder },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  
  statusFilters: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.primaryBorder },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted },
  filterChipTextActive: { color: '#FFF' },

  listContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: COLORS.primaryBorder },
  listTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginBottom: 16 },
  
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#FFF0F3', borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder, borderStyle: 'dashed' },
  emptyText: { color: COLORS.textMuted, fontSize: 12, fontWeight: 'bold' },

  transactionsWrapper: { gap: 12 },
  txnCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder + '50', paddingBottom: 12 },
  txnId: { fontSize: 12, fontWeight: '900', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  txnDate: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  
  txnBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  txnMember: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  txnPlan: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  statusSuccess: { backgroundColor: COLORS.success + '10', borderColor: COLORS.success + '40' },
  statusPending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  statusFailed: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primaryBorder },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, borderWidth: 2, borderColor: COLORS.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: COLORS.primaryBorder, paddingBottom: 16, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  modalTxnId: { fontSize: 11, fontWeight: '900', color: COLORS.primary, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  closeBtn: { padding: 4, backgroundColor: '#FFF0F3', borderRadius: 100 },
  
  receiptBody: { gap: 16 },
  receiptSection: { backgroundColor: '#FFF0F3', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  receiptMember: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  receiptEmail: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  receiptPlan: { fontSize: 13, fontWeight: '900', color: COLORS.primary, marginTop: 8 },
  
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  billRowDashed: { borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, borderStyle: 'dashed', paddingBottom: 8, marginBottom: 8 },
  billKey: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  billVal: { fontSize: 13, fontWeight: '900', color: COLORS.textDark, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  billRowTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  billTotalKey: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  billTotalVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  receiptFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  receiptFooterText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },

  modalCloseBtn: { marginTop: 24, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 100, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalCloseText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
