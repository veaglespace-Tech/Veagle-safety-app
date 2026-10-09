'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../components/admin/AdminHeaderNav.js';
import { api } from '../../../utils/api.js';
import {
  CreditCard,
  Search,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  X,
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect.js';

export default function AdminPaymentsPage() {
  const [mounted, setMounted] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // SEARCH, FILTER & PAGINATION
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentPage, setPaymentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const paymentsPerPage = 8;

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPaymentsData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/payments');
      setPayments(res.data.payments || []);
      setPaymentSummary(res.data.summary || null);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to fetch payment transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchPaymentsData();
  }, []);

  if (!mounted) return null;

  // FILTER & PAGINATION COMPUTATIONS FOR PAYMENTS
  const filteredPayments = payments.filter((p) => {
    const q = paymentSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.txnid || '').toLowerCase().includes(q) ||
      (p.user?.fullName || '').toLowerCase().includes(q) ||
      (p.user?.email || '').toLowerCase().includes(q) ||
      (p.plan?.name || '').toLowerCase().includes(q);

    const matchesStatus = paymentStatusFilter === 'ALL' || p.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaymentPages = Math.ceil(filteredPayments.length / paymentsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (paymentPage - 1) * paymentsPerPage,
    paymentPage * paymentsPerPage
  );

  const metrics = {
    paymentsCount: payments.length,
    totalRevenue: paymentSummary?.totalRevenue || 0,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* HEADER NAVIGATION */}
        <AdminHeaderNav
          metrics={metrics}
          onRefresh={fetchPaymentsData}
          toast={toast}
          activeTabOverride="payments"
        />

        {/* PAYMENTS CONTENT */}
        <div className="space-y-6 animate-fade-up">
          {/* SUMMARY STATS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">Total Revenue</span>
              <p className="text-3xl font-black text-emerald-600">
                ₹{paymentSummary?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[11px] font-bold text-gray-500">Gross total revenue collected</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">
                Successful Transactions
              </span>
              <p className="text-3xl font-black text-[#2A0826]">
                {paymentSummary?.successCount || 0}
              </p>
              <p className="text-[11px] font-bold text-emerald-600">Completed payments</p>
            </div>

            <div className="bg-white p-6 rounded-[32px] border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">GST Tax Collected</span>
              <p className="text-3xl font-black text-purple-600">
                ₹{paymentSummary?.totalGstCollected?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[11px] font-bold text-purple-600">GST audit ledger</p>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="w-4 h-4 text-[#684E67] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Txn ID, member name, email, plan..."
                value={paymentSearch}
                onChange={(e) => {
                  setPaymentSearch(e.target.value);
                  setPaymentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none"
              />
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Payment Statuses' },
                  { value: 'SUCCESS', label: 'SUCCESS' },
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'FAILED', label: 'FAILED' },
                ]}
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPaymentPage(1);
                }}
                alignRight={true}
              />
            </div>
          </div>

          {/* PAYMENTS TABLE LIST */}
          <div className="bg-white rounded-[36px] border-2 border-[#FFCCE1] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F3] border-b border-[#FFCCE1] text-[11px] font-black text-[#684E67] uppercase tracking-wider">
                    <th className="py-4 px-6">Transaction ID & Date</th>
                    <th className="py-4 px-6">Member & Email</th>
                    <th className="py-4 px-6">Plan Name</th>
                    <th className="py-4 px-6">Amount (Net + GST)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Receipt Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#FFCCE1]/60 text-xs font-extrabold text-[#2A0826]">
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FFF0F3]/40 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-mono text-xs font-black text-[#FF2A6D]">{p.txnid}</p>
                          <p className="text-[10px] text-gray-500 font-bold">
                            {new Date(p.createdAt).toLocaleString()}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <p className="font-black text-[#2A0826]">
                            {p.user?.fullName || 'Anonymous Member'}
                          </p>
                          <p className="text-[11px] text-[#684E67] font-bold">
                            {p.user?.email || 'N/A'}
                          </p>
                        </td>

                        <td className="py-4 px-6 font-bold text-[#2A0826]">
                          {p.plan?.name || 'Sakhi Suraksha Protection Plan'}
                        </td>

                        <td className="py-4 px-6">
                          <p className="font-mono text-sm font-black text-[#2A0826]">
                            ₹{p.amount?.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold">
                            Base: ₹{p.baseAmount} + {p.gstPercentage}% GST
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              p.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                                : p.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-300'
                                  : 'bg-rose-50 text-rose-600 border border-rose-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(p)}
                            className="px-3 py-1.5 bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] rounded-xl text-xs font-black hover:bg-[#FF2A6D] hover:text-[#FFFFFF] transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>VIEW RECEIPT</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 font-bold">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="p-5 bg-[#FFF0F3]/60 border-t border-[#FFCCE1] flex items-center justify-between">
              <span className="text-xs font-black text-[#684E67]">
                Showing{' '}
                {filteredPayments.length === 0 ? 0 : (paymentPage - 1) * paymentsPerPage + 1} -{' '}
                {Math.min(paymentPage * paymentsPerPage, filteredPayments.length)} of{' '}
                {filteredPayments.length} Transactions
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={paymentPage === 1}
                  onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-white border border-[#FFCCE1] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#2A0826]" />
                </button>

                <span className="text-xs font-black text-[#2A0826] px-2">
                  Page {paymentPage} of {totalPaymentPages}
                </span>

                <button
                  type="button"
                  disabled={paymentPage >= totalPaymentPages}
                  onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
                  className="p-2 rounded-xl bg-white border border-[#FFCCE1] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#2A0826]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 4: ITEMIZED OFFICIAL GST RECEIPT VIEWER */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-0 shadow-2xl relative animate-scale-up font-mono text-sm text-gray-800 rounded-lg overflow-hidden flex flex-col">
              {/* Receipt Content - Scrollable if needed */}
              <div
                className="p-6 pb-2 sm:p-8 sm:pb-4 space-y-6 flex-1 overflow-y-auto bg-white"
                id="printable-receipt"
              >
                {/* Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black tracking-widest text-black">SAKHI SURAKSHA</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Official Payment Receipt
                  </p>
                  <p className="text-xs text-gray-400 mt-2">123 Safety Drive, Pune, MH, IN</p>
                  <p className="text-xs text-gray-400">support@veagle-safety.com</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>

                {/* Details */}
                <div className="space-y-1.5 text-xs font-bold uppercase tracking-tight">
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>
                      {new Date(selectedReceipt.createdAt).toLocaleDateString()}{' '}
                      {new Date(selectedReceipt.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TXN ID:</span>
                    <span>{selectedReceipt.txnid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span>{selectedReceipt.status}</span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>

                {/* Customer Info */}
                <div className="space-y-1.5 text-xs font-bold uppercase tracking-tight">
                  <p className="text-gray-500 mb-2">Billed To:</p>
                  <p className="font-black text-black">
                    {selectedReceipt.user?.fullName || 'Sakhi Member'}
                  </p>
                  <p className="lowercase normal-case">{selectedReceipt.user?.email || 'N/A'}</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>

                {/* Itemized Table */}
                <div className="space-y-3">
                  <table className="w-full text-xs font-bold text-left">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="pb-2 uppercase tracking-wide">Item Description</th>
                        <th className="pb-2 text-right uppercase tracking-wide">Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pt-3 pb-1">
                          {selectedReceipt.plan?.name || 'Protection Plan'}
                        </td>
                        <td className="pt-3 pb-1 text-right">
                          ₹{selectedReceipt.baseAmount?.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="pb-1 text-gray-500">
                          GST ({selectedReceipt.gstPercentage}%)
                        </td>
                        <td className="pb-1 text-right text-gray-500">
                          ₹{selectedReceipt.gstAmount?.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-black text-black">
                    <span>TOTAL:</span>
                    <span>₹{selectedReceipt.amount?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>

                {/* Footer */}
                <div className="text-center space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase">Thank you for subscribing!</p>
                  <p className="text-[10px] text-gray-400">Keep this receipt for your records.</p>
                </div>
                <div className="pb-4"></div>
              </div>

              {/* Action Buttons - outside printable area */}
              <div className="flex bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-4 text-xs font-black text-gray-600 hover:bg-gray-100 flex items-center justify-center space-x-2 transition-colors uppercase tracking-widest border-r border-gray-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 py-4 text-xs font-black text-white bg-black hover:bg-gray-900 transition-colors uppercase tracking-widest"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
