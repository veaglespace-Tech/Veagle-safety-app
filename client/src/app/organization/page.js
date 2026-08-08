'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Building,
  Users,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Navigation,
  RefreshCw,
  Crown,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { api } from '../../utils/api.js';

export default function OrganizationDashboard() {
  const router = useRouter();
  const { token, user } = useSelector((state) => state?.auth || {});
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'members'

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [addMemberCode, setAddMemberCode] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organization/overview');
      if (res.data && res.data.success) {
        setStats(res.data.stats || { totalMembers: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch organization overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && token) {
      fetchOverview();
    }
  }, [mounted, token]);

  // Auth Protection
  if (mounted && (!token || (user && user.role !== 'ORGANIZATION' && user.role !== 'SUPER_ADMIN'))) {
    if (user && user.role === 'PARENT') {
      router.push('/parent');
      return null;
    }
    if (user && user.role === 'USER') {
      router.push('/dashboard');
      return null;
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    if (!addIdentifier.trim()) {
      setModalError('Please enter member email address or mobile number.');
      return;
    }

    try {
      setAddLoading(true);
      const res = await api.post('/organization/members', {
        identifier: addIdentifier.trim(),
        memberCode: addMemberCode.trim(),
        department: addDepartment.trim(),
      });

      if (res.data && res.data.success) {
        setModalSuccess(res.data.message || 'Member added successfully!');
        setAddIdentifier('');
        setAddMemberCode('');
        setAddDepartment('');
        fetchOverview();
        setTimeout(() => {
          setShowAddModal(false);
          setModalSuccess('');
        }, 1500);
      }
    } catch (err) {
      setModalError(err?.response?.data?.error || 'Failed to add member. Please verify phone/email.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (membershipId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from your Organization?`)) return;
    try {
      const res = await api.delete(`/organization/members/${membershipId}`);
      if (res.data && res.data.success) {
        fetchOverview();
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to remove member.');
    }
  };

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.user.fullName?.toLowerCase().includes(term) ||
      m.user.email?.toLowerCase().includes(term) ||
      m.user.phone?.includes(term) ||
      m.memberCode?.toLowerCase().includes(term) ||
      m.department?.toLowerCase().includes(term)
    );
  });

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* ORGANIZATION HEADER BAR */}
        <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shrink-0">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#FF2A6D] px-2.5 py-0.5 rounded-full shadow-sm">
                  ORGANIZATION HQ
                </span>
                <span className="text-xs font-bold text-[#684E67]">● Safety Dispatch Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2A0826] tracking-tight mt-1">
                {user?.fullName || 'Organization Safety Command'}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="btn-3d-white-pop px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF2A6D] ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH STATUS</span>
          </button>
        </div>

        {/* MINIMAL 2-TAB NAVIGATION BAR */}
        <div className="flex items-center space-x-2 bg-white/90 p-1.5 rounded-2xl border-2 border-[#FFCCE1] shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'monitor'
                ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md'
                : 'text-[#684E67] hover:text-[#FF2A6D]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. Live Safety Monitor</span>
            {stats.activeSosCount > 0 && (
              <span className="bg-white text-[#FF2A6D] px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {stats.activeSosCount} SOS
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md'
                : 'text-[#684E67] hover:text-[#FF2A6D]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Member Directory ({stats.totalMembers})</span>
          </button>
        </div>

        {/* TAB 1: LIVE SAFETY MONITOR */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#684E67] tracking-wider">Total Members</span>
                  <Users className="w-4 h-4 text-[#FF5C8A]" />
                </div>
                <p className="text-3xl font-black text-[#2A0826]">{stats.totalMembers}</p>
                <p className="text-[10px] font-extrabold text-[#684E67]">Enrolled Students/Staff</p>
              </div>

              <div className={`p-5 rounded-3xl border-2 shadow-sm space-y-1 ${stats.activeSosCount > 0 ? 'bg-[#FFF0F3] border-[#FF2A6D] animate-pulse' : 'bg-white border-[#FFCCE1]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#FF2A6D] tracking-wider">Active SOS</span>
                  <AlertTriangle className="w-4 h-4 text-[#FF2A6D]" />
                </div>
                <p className="text-3xl font-black text-[#FF2A6D]">{stats.activeSosCount}</p>
                <p className="text-[10px] font-extrabold text-[#FF2A6D]">Emergency Triggered</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#684E67] tracking-wider">Active Trips</span>
                  <Navigation className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-[#2A0826]">{stats.inTripCount}</p>
                <p className="text-[10px] font-extrabold text-[#684E67]">Journeys In-Transit</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">Safe Members</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-emerald-600">{stats.safeCount}</p>
                <p className="text-[10px] font-extrabold text-[#684E67]">Normal Protection</p>
              </div>
            </div>

            {/* LIVE SAFETY STATUS LIST */}
            <div className="bg-white rounded-3xl border-2 border-[#FFCCE1] shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#2A0826]">Organization Member Live Dispatch Monitor</h3>
                <span className="text-xs font-bold text-[#684E67]">Updated Real-Time</span>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-[#FFF0F3] rounded-2xl border-1.5 border-dashed border-[#FFCCE1]">
                  <Users className="w-12 h-12 text-[#FF5C8A] mx-auto" />
                  <h4 className="text-base font-black text-[#2A0826]">No Members Enrolled Yet</h4>
                  <p className="text-xs font-bold text-[#684E67] max-w-sm mx-auto">
                    Switch to the Member Directory tab to add your students or employees using their email/mobile number.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('members')}
                    className="btn-3d-rose-pop px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    GO TO MEMBER DIRECTORY
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div
                      key={m.membershipId}
                      className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        m.activeSos
                          ? 'bg-[#FFF0F3] border-[#FF2A6D] shadow-md'
                          : m.activeJourney
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-white border-[#FFCCE1]'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                          m.activeSos ? 'bg-[#FF2A6D] animate-pulse' : m.activeJourney ? 'bg-emerald-500' : 'bg-[#FF5C8A]'
                        }`}>
                          {m.user.fullName?.charAt(0) || 'M'}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-sm text-[#2A0826]">{m.user.fullName}</h4>
                            {m.memberCode && (
                              <span className="bg-white border border-[#FFCCE1] text-[#684E67] text-[10px] font-black px-2 py-0.5 rounded-full">
                                #{m.memberCode}
                              </span>
                            )}
                            {m.department && (
                              <span className="text-[10px] font-bold text-[#684E67]">({m.department})</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#684E67]">{m.user.email} • {m.user.phone}</p>
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
            
            {/* DIRECTORY HEADER & ACTIONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search members by name, email, mobile, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-3d-rose-pop px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>ENROLL NEW MEMBER</span>
              </button>
            </div>

            {/* MEMBERS DIRECTORY LIST */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 bg-[#FFF0F3] rounded-2xl border-1.5 border-dashed border-[#FFCCE1] space-y-2">
                <Users className="w-10 h-10 text-[#FF5C8A] mx-auto" />
                <h4 className="font-black text-sm text-[#2A0826]">No matching members found</h4>
                <p className="text-xs font-bold text-[#684E67]">Try adjusting your search query or enroll new members.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#FFCCE1]/60">
                {filteredMembers.map((m) => (
                  <div key={m.membershipId} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {m.user.fullName?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm text-[#2A0826]">{m.user.fullName}</h4>
                          {m.memberCode && (
                            <span className="bg-[#FFF0F3] text-[#FF2A6D] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FFCCE1]">
                              #{m.memberCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-[#684E67]">{m.user.email} • {m.user.phone}</p>
                        {m.department && <p className="text-[10px] font-extrabold text-[#FF5C8A]">Dept: {m.department}</p>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.membershipId, m.user.fullName)}
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

      </div>

      {/* ENROLL MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border-2 border-[#FFCCE1] space-y-5 animate-fade-up">
            <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-[#FF2A6D]" />
                <h3 className="font-black text-base text-[#2A0826]">Enroll Organization Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-[#684E67] hover:bg-[#FFF0F3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-[#FFF0F3] border-1.5 border-[#FF2A6D] text-[#FF2A6D] p-3.5 rounded-2xl text-xs font-black">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="bg-[#E8F8F0] border-1.5 border-[#00C853] text-[#00C853] p-3.5 rounded-2xl text-xs font-black">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#684E67] font-extrabold mb-1">
                  Member Registered Phone or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter email or 10-digit mobile"
                  value={addIdentifier}
                  onChange={(e) => setAddIdentifier(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold focus:border-[#FF2A6D] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#684E67] font-extrabold mb-1">Roll / Member Code</label>
                  <input
                    type="text"
                    placeholder="e.g. STU-102"
                    value={addMemberCode}
                    onChange={(e) => setAddMemberCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#684E67] font-extrabold mb-1">Department / Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-[#FFF0F3] text-[#684E67] font-black rounded-full uppercase tracking-wider cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 btn-3d-rose-pop py-3 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {addLoading ? 'ENROLLING...' : 'ENROLL MEMBER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
