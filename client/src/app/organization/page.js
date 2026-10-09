'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Building,
  Users,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Navigation,
  RefreshCw,
  Activity,
  ArrowUpRight,
  Settings,
  Copy,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { api } from '../../utils/api.js';

function OrganizationDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useSelector((state) => state?.auth || {});
  const [mounted, setMounted] = useState(false);
  const activeTab = searchParams?.get('tab') || 'monitor';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeSosCount: 0,
    inTripCount: 0,
    safeCount: 0,
  });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [referralCode, setReferralCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organization/overview');
      if (res.data && res.data.success) {
        setStats(
          res.data.stats || { totalMembers: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 }
        );
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch organization overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/organization/settings');
      if (res.data && res.data.success) {
        setReferralCode(res.data.orgReferralCode);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    if (mounted && token) {
      fetchOverview();
      fetchSettings();
    }
  }, [mounted, token]);

  // Auth Protection
  if (
    mounted &&
    (!token || (user && user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN'))
  ) {
    if (user && user.role === 'PARENT') {
      router.push('/parent');
      return null;
    }
    if (user && user.role === 'USER') {
      router.push('/dashboard');
      return null;
    }
  }

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from your Organization?`))
      return;
    try {
      const res = await api.delete(`/organization/members/${userId}`);
      if (res.data && res.data.success) {
        fetchOverview();
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to remove member.');
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.user.fullName?.toLowerCase().includes(term) ||
      m.user.email?.toLowerCase().includes(term) ||
      m.user.phone?.includes(term)
    );
  });

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* ORGANIZATION HEADER BAR */}
        <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-4 sm:p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4 min-w-0 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shrink-0 mt-0.5 sm:mt-0">
              <Building className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] px-2.5 py-0.5 rounded-full shadow-xs">
                  ORGANIZATION
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-[#684E67] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] inline-block shrink-0 animate-pulse" />
                  <span>Safety Dispatch Portal</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[#2A0826] tracking-tight mt-1 truncate">
                {user?.fullName || 'Organization Command'}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="w-full sm:w-auto btn-3d-white-pop px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF2A6D] ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH STATUS</span>
          </button>
        </div>

        {/* TAB 1: LIVE SAFETY MONITOR */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#684E67] tracking-wider">
                    Total Members
                  </span>
                  <Users className="w-4 h-4 text-[#FF5C8A]" />
                </div>
                <p className="text-3xl font-black text-[#2A0826]">{stats.totalMembers}</p>
                <p className="text-[10px] font-extrabold text-[#684E67]">Enrolled via Link</p>
              </div>

              <div
                className={`p-5 rounded-3xl border-2 shadow-sm space-y-1 ${stats.activeSosCount > 0 ? 'bg-[#FFF0F3] border-[#FF2A6D] animate-pulse' : 'bg-white border-[#FFCCE1]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#FF2A6D] tracking-wider">
                    Active SOS
                  </span>
                  <AlertTriangle className="w-4 h-4 text-[#FF2A6D]" />
                </div>
                <p className="text-3xl font-black text-[#FF2A6D]">{stats.activeSosCount}</p>
                <p className="text-[10px] font-extrabold text-[#FF2A6D]">Emergency Triggered</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#684E67] tracking-wider">
                    Active Trips
                  </span>
                  <Navigation className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-[#2A0826]">{stats.inTripCount}</p>
                <p className="text-[10px] font-extrabold text-[#684E67]">Journeys In-Transit</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                    Safe Members
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-emerald-600">{stats.safeCount}</p>
                <p className="text-[10px] font-extrabold text-[#684E67]">Normal Protection</p>
              </div>
            </div>

            {/* LIVE SAFETY STATUS LIST */}
            <div className="bg-white rounded-3xl border-2 border-[#FFCCE1] shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#2A0826]">
                  Live Dispatch Monitor
                </h3>
                <span className="text-xs font-bold text-[#684E67]">Updated Real-Time</span>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-[#FFF0F3] rounded-2xl border-1.5 border-dashed border-[#FFCCE1]">
                  <Users className="w-12 h-12 text-[#FF5C8A] mx-auto" />
                  <h4 className="text-base font-black text-[#2A0826]">No Members Enrolled Yet</h4>
                  <p className="text-xs font-bold text-[#684E67] max-w-sm mx-auto">
                    Go to the Settings tab to copy your Referral Link and share it with your users to join your organization.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/organization?tab=settings')}
                    className="btn-3d-rose-pop px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    GO TO SETTINGS
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        m.activeSos
                          ? 'bg-[#FFF0F3] border-[#FF2A6D] shadow-md'
                          : m.activeJourney
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-white border-[#FFCCE1]'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                            m.activeSos
                              ? 'bg-[#FF2A6D] animate-pulse'
                              : m.activeJourney
                                ? 'bg-emerald-500'
                                : 'bg-[#FF5C8A]'
                          }`}
                        >
                          {m.user.fullName?.charAt(0) || 'M'}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-sm text-[#2A0826]">{m.user.fullName}</h4>
                          </div>
                          <p className="text-xs font-bold text-[#684E67]">
                            {m.user.email} • {m.user.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                        {m.activeSos ? (
                          <div className="flex items-center space-x-2">
                            <span className="bg-[#FF2A6D] text-white text-xs font-black px-3 py-1 rounded-full animate-pulse flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>SOS ACTIVE</span>
                            </span>
                            {m.activeSos.shareToken && (
                              <a
                                href={`/live-track/${m.activeSos.shareToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-[#FF2A6D] text-white text-xs font-black px-3 py-1 rounded-full hover:bg-rose transition-colors flex items-center space-x-1"
                              >
                                <span>LIVE MAP</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ) : m.activeJourney ? (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full flex items-center space-x-1">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>IN-TRIP ({m.activeJourney.destinationName})</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black px-3 py-1 rounded-full flex items-center space-x-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>SAFE</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEMBER DIRECTORY */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-3xl border-2 border-[#FFCCE1] shadow-md p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search members by name, email, mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 bg-[#FFF0F3] rounded-2xl border-1.5 border-dashed border-[#FFCCE1] space-y-2">
                <Users className="w-10 h-10 text-[#FF5C8A] mx-auto" />
                <h4 className="font-black text-sm text-[#2A0826]">No matching members found</h4>
                <p className="text-xs font-bold text-[#684E67]">
                  Ensure your users are registering via your Referral Link.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#FFCCE1]/60">
                {filteredMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {m.user.fullName?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm text-[#2A0826]">{m.user.fullName}</h4>
                        </div>
                        <p className="text-xs font-bold text-[#684E67]">
                          {m.user.email} • {m.user.phone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.userId, m.user.fullName)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border-2 border-[#FFCCE1] shadow-md p-6 space-y-6 max-w-3xl mx-auto">
             <div className="flex items-center space-x-3 border-b-2 border-[#FFF0F3] pb-4">
                <div className="w-10 h-10 bg-[#FFF0F3] rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#FF2A6D]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#2A0826]">Organization Settings</h3>
                  <p className="text-xs font-bold text-[#684E67]">Manage your referral links and preferences</p>
                </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-sm font-black text-[#2A0826]">Your Organization Referral Link</h4>
               <p className="text-xs font-bold text-[#684E67]">
                 Share this link with your employees, students, or members. When they register using this link, they will automatically be added to your Organization Dashboard.
               </p>

               <div className="mt-4 bg-[#FFF0F3] border-2 border-[#FFCCE1] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                 <input 
                   type="text"
                   readOnly
                   value={referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}` : 'Loading...'}
                   className="w-full bg-white border border-[#FFCCE1] rounded-xl px-4 py-3 text-xs font-black text-[#2A0826] outline-none"
                 />
                 <button
                    onClick={copyReferralLink}
                    className="w-full sm:w-auto shrink-0 btn-3d-rose-pop px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2"
                 >
                   {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   <span>{copySuccess ? 'COPIED!' : 'COPY LINK'}</span>
                 </button>
               </div>
               
               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
                 <h5 className="text-xs font-black text-emerald-800 mb-1 flex items-center space-x-1">
                   <ShieldCheck className="w-4 h-4" />
                   <span>Automatic Enrollment</span>
                 </h5>
                 <p className="text-[10px] font-bold text-emerald-700">
                   Anyone who signs up via your link skips the manual add process. They retain full control over their personal profile and privacy, but you get access to view their live SOS alerts and Journey status during emergencies.
                 </p>
               </div>
             </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function OrganizationDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-[#FF2A6D] border-t-transparent animate-spin" />
      </div>
    }>
      <OrganizationDashboardContent />
    </Suspense>
  );
}
