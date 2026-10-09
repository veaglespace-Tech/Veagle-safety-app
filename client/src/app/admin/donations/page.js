'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../components/admin/AdminHeaderNav.js';
import { api } from '../../../utils/api.js';
import {
  Heart,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect.js';

export default function AdminDonationsPage() {
  const [mounted, setMounted] = useState(false);
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // SEARCH, FILTER & PAGINATION
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDonationsData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/donations');
      setDonations(res.data.donations || []);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to fetch donations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDonationsData();
  }, []);

  if (!mounted) return null;

  // FILTER & PAGINATION COMPUTATIONS
  const filteredDonations = donations.filter((d) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (d.txnid || '').toLowerCase().includes(q) ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage) || 1;
  const paginatedDonations = filteredDonations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalCollected = donations
    .filter(d => d.status === 'SUCCESS')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const successCount = donations.filter(d => d.status === 'SUCCESS').length;

  const metrics = {
    donationsCount: donations.length,
    totalCollected,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* HEADER NAVIGATION */}
        <AdminHeaderNav
          metrics={metrics}
          onRefresh={fetchDonationsData}
          toast={toast}
          activeTabOverride="donations"
        />

        {/* DONATIONS CONTENT */}
        <div className="space-y-6 animate-fade-up">
          {/* SUMMARY STATS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">Total Donations</span>
              <p className="text-3xl font-black text-emerald-600">
                ₹{totalCollected.toFixed(2)}
              </p>
              <p className="text-[11px] font-bold text-gray-500">Gross total collected</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">
                Successful Donations
              </span>
              <p className="text-3xl font-black text-[#2A0826]">
                {successCount}
              </p>
              <p className="text-[11px] font-bold text-emerald-600">Completed payments</p>
            </div>

            <div className="bg-white p-6 rounded-[32px] border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">Total Attempts</span>
              <p className="text-3xl font-black text-purple-600">
                {donations.length}
              </p>
              <p className="text-[11px] font-bold text-purple-600">All donation transactions</p>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="w-4 h-4 text-[#684E67] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Txn ID, name, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none"
              />
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'SUCCESS', label: 'SUCCESS' },
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'FAILED', label: 'FAILED' },
                ]}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                alignRight={true}
              />
            </div>
          </div>

          {/* DONATIONS TABLE LIST */}
          <div className="bg-white rounded-[36px] border-2 border-[#FFCCE1] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F3] border-b border-[#FFCCE1] text-[11px] font-black text-[#684E67] uppercase tracking-wider">
                    <th className="py-4 px-6">Transaction ID & Date</th>
                    <th className="py-4 px-6">Donor Info</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#FFCCE1]/60 text-xs font-extrabold text-[#2A0826]">
                  {paginatedDonations.length > 0 ? (
                    paginatedDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-[#FFF0F3]/40 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-mono text-xs font-black text-[#FF2A6D]">{d.txnid}</p>
                          <p className="text-[10px] text-gray-500 font-bold">
                            {new Date(d.createdAt).toLocaleString()}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <p className="font-black text-[#2A0826]">
                            {d.name}
                          </p>
                          <p className="text-[11px] text-[#684E67] font-bold">
                            {d.email} <br /> {d.phone}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <p className="font-mono text-sm font-black text-[#2A0826]">
                            ₹{d.amount?.toFixed(2)}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              d.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                                : d.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-300'
                                  : 'bg-rose-50 text-rose-600 border border-rose-300'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 font-bold">
                        No donations recorded yet.
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
                {filteredDonations.length === 0 ? 0 : (page - 1) * itemsPerPage + 1} -{' '}
                {Math.min(page * itemsPerPage, filteredDonations.length)} of{' '}
                {filteredDonations.length} Donations
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-white border border-[#FFCCE1] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#2A0826]" />
                </button>

                <span className="text-xs font-black text-[#2A0826] px-2">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-white border border-[#FFCCE1] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#2A0826]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
