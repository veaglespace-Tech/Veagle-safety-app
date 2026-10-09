'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../components/admin/AdminHeaderNav.js';
import { api } from '../../../utils/api.js';
import {
  HelpCircle,
  Search,
  Mail,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect.js';

export default function AdminEnquiriesPage() {
  const [mounted, setMounted] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // SEARCH & FILTER
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('ALL');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEnquiriesData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/enquiries');
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to fetch contact support enquiries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchEnquiriesData();
  }, []);

  const handleResolveEnquiry = async (enquiryId) => {
    try {
      const res = await api.post(`/admin/enquiries/${enquiryId}/resolve`);
      showToast('success', res.data.message);
      fetchEnquiriesData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update enquiry status');
    }
  };

  if (!mounted) return null;

  const enquiryList = Array.isArray(enquiries) ? enquiries : [];
  const filteredEnquiries = enquiryList.filter((e) => {
    const q = enquirySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (e.fullName || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q) ||
      (e.subject || '').toLowerCase().includes(q) ||
      (e.message || '').toLowerCase().includes(q);

    const matchesStatus = enquiryStatusFilter === 'ALL' || e.status === enquiryStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = enquiryList.filter((e) => e.status === 'PENDING').length;
  const resolvedCount = enquiryList.filter((e) => e.status === 'RESOLVED').length;

  const metrics = {
    pendingEnquiries: pendingCount,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* HEADER NAVIGATION */}
        <AdminHeaderNav
          metrics={metrics}
          onRefresh={fetchEnquiriesData}
          toast={toast}
          activeTabOverride="enquiries"
        />

        {/* ENQUIRIES CONTENT */}
        <div className="space-y-6 animate-fade-up">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">Pending Inquiries</span>
              <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
              <p className="text-[11px] font-bold text-amber-600">Requires dispatch team review</p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
              <span className="text-xs font-black text-[#684E67] uppercase">
                Resolved Support Cases
              </span>
              <p className="text-3xl font-black text-emerald-600">{resolvedCount}</p>
              <p className="text-[11px] font-bold text-emerald-600">Closed support inquiries</p>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#684E67] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, subject, message..."
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none"
              />
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Support Statuses' },
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'RESOLVED', label: 'RESOLVED' },
                ]}
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                alignRight={true}
              />
            </div>
          </div>

          {/* ENQUIRIES LIST CARDS */}
          <div className="space-y-4">
            {filteredEnquiries.length > 0 ? (
              filteredEnquiries.map((enq) => {
                const isPending = enq.status === 'PENDING';
                return (
                  <div
                    key={enq.id}
                    className={`bg-[#FFFFFF] p-6 rounded-[32px] border-2 space-y-4 transition-all shadow-md ${
                      isPending ? 'border-amber-300' : 'border-emerald-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#FFCCE1]/60 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {enq.status}
                          </span>
                          <h4 className="font-black text-base text-[#2A0826]">{enq.fullName}</h4>
                        </div>
                        <p className="text-xs font-bold text-[#684E67] flex items-center space-x-3">
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3.5 h-3.5 text-[#FF2A6D]" />
                            <span>{enq.email}</span>
                          </span>
                          {enq.phone && (
                            <span className="flex items-center space-x-1">
                              <PhoneCall className="w-3.5 h-3.5 text-[#FF2A6D]" />
                              <span>{enq.phone}</span>
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-gray-500 font-bold bg-[#FFF0F3] px-3 py-1 rounded-full border border-[#FFCCE1]">
                          Received: {new Date(enq.createdAt).toLocaleString()}
                        </span>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleResolveEnquiry(enq.id)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black rounded-xl shadow hover:scale-105 transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>MARK AS RESOLVED</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#FFF0F3]/60 p-4 rounded-2xl border border-[#FFCCE1] space-y-1">
                      <p className="text-xs font-black text-[#FF2A6D] flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Subject: {enq.subject || 'General Inquiry'}</span>
                      </p>
                      <p className="text-xs text-[#2A0826] font-bold leading-relaxed whitespace-pre-line pt-1">
                        "{enq.message}"
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#FFFFFF] p-12 rounded-[36px] border-2 border-[#FFCCE1] text-center space-y-2">
                <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="font-black text-sm text-[#2A0826]">No support inquiries found</p>
                <p className="text-xs text-gray-500 font-bold">
                  All member support tickets have been addressed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
