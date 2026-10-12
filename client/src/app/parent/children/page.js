'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Users,
  Plus,
  Trash2,
  X,
  Phone,
  Mail,
  RefreshCw,
  Heart,
  Shield,
  PhoneCall,
  Bell,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { ParentTabBar } from '../../../components/parent/ParentTabBar.js';
import { api } from '../../../utils/api.js';

function ParentChildrenContent() {
  const router = useRouter();
  const { token, user } = useSelector((state) => state?.auth || {});

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
  const [childrenList, setChildrenList] = useState([]);

  // Check-in ping state
  const [pingingChildId, setPingingChildId] = useState(null);
  const [pingSuccessMessage, setPingSuccessMessage] = useState('');

  // Modal State for Linking Child
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childIdentifier, setChildIdentifier] = useState('');
  const [relationship, setRelationship] = useState('Daughter');
  const [linkLoading, setLinkLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOverview = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/parent/overview');
      if (res.data && res.data.success) {
        setStats(res.data.stats || { totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
        setChildrenList(res.data.children || []);
      }
    } catch (err) {
      console.error('Failed to fetch parent overview:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && token) {
      fetchOverview(true);
    }
  }, [mounted, token]);

  // Auth Protection
  if (mounted && (!token || (user && user.role !== 'PARENT' && user.role !== 'SUPER_ADMIN'))) {
    if (user && user.role === 'ORGANIZATION') {
      router.push('/organization');
      return null;
    }
    if (user && user.role === 'USER') {
      router.push('/dashboard');
      return null;
    }
  }

  // Handle Child Safety Check-in Ping
  const handlePingCheckin = async (childId, childName) => {
    try {
      setPingingChildId(childId);
      const res = await api.post('/parent/ping-checkin', { childId });
      setPingSuccessMessage(res.data?.message || `Safety check-in ping dispatched to ${childName}!`);
      setTimeout(() => setPingSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch safety ping. Please try again.');
    } finally {
      setPingingChildId(null);
    }
  };

  // Handle Linking Child
  const handleLinkChild = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    const inputVal = childIdentifier.trim();
    if (!inputVal) {
      setModalError('Please enter child registered mobile number or email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanDigits = inputVal.replace(/\D/g, '');

    if (inputVal.includes('@')) {
      if (!emailRegex.test(inputVal)) {
        setModalError('Please enter a valid email address (e.g. child@example.com).');
        return;
      }
    } else {
      if (!phoneRegex.test(cleanDigits)) {
        setModalError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
        return;
      }
    }

    try {
      setLinkLoading(true);
      const res = await api.post('/parent/link-child', {
        identifier: childIdentifier.trim(),
        relationship: relationship.trim(),
      });

      if (res.data && res.data.success) {
        setModalSuccess(res.data.message || 'Child linked successfully!');
        setChildIdentifier('');
        fetchOverview();
        setTimeout(() => {
          setShowLinkModal(false);
          setModalSuccess('');
        }, 1500);
      }
    } catch (err) {
      setModalError(
        err?.response?.data?.error || 'Failed to link child. Please verify child mobile/email.'
      );
    } finally {
      setLinkLoading(false);
    }
  };

  // Handle Unlinking Child
  const handleUnlinkChild = async (linkId, childName) => {
    if (!window.confirm(`Are you sure you want to unlink ${childName} from your Parent Portal?`))
      return;
    try {
      const res = await api.delete(`/parent/children/${linkId}`);
      if (res.data && res.data.success) {
        fetchOverview();
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to unlink child.');
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* SUCCESS NOTIFICATION TOAST */}
        {pingSuccessMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fade-down">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-black">{pingSuccessMessage}</p>
            </div>
            <button
              onClick={() => setPingSuccessMessage('')}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* HEADER BAR */}
        <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-5 sm:p-7 rounded-[32px] border-2 border-[#FFCCE1] shadow-lg shadow-[#FF5C8A]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-start sm:items-center space-x-4 min-w-0 w-full md:w-auto relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shadow-[#FF2A6D]/25 shrink-0">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] px-3 py-1 rounded-full shadow-xs">
                  CONNECTED FAMILY ACCOUNTS
                </span>
                <span className="text-xs font-bold text-[#684E67] flex items-center gap-1.5 bg-white/80 px-2.5 py-0.5 rounded-full border border-[#FFCCE1]">
                  <span className="w-2 h-2 rounded-full bg-[#059669] inline-block shrink-0 animate-pulse" />
                  <span>{stats.totalChildren} Children Protected</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2A0826] tracking-tight mt-1 truncate">
                Linked Children Management
              </h1>
              <p className="text-xs font-bold text-[#684E67] mt-0.5">
                Manage your children's profiles, link new family members, and monitor protection status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="flex-1 md:flex-initial btn-3d-rose-pop px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>LINK CHILD ACCOUNT</span>
            </button>

            <button
              type="button"
              onClick={() => fetchOverview(true)}
              disabled={loading}
              className="flex-1 md:flex-initial btn-3d-white-pop px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shrink-0 border border-[#FFCCE1]"
            >
              <RefreshCw className={`w-4 h-4 text-[#FF2A6D] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>
          </div>
        </div>

        {/* REUSABLE PARENT TAB BAR */}
        <ParentTabBar activeSosCount={stats.activeSosCount} totalChildren={stats.totalChildren} />

        {/* DIRECTORY SECTION */}
        <div className="bg-white rounded-[32px] border-2 border-[#FFCCE1] shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#FFCCE1]/60 pb-5">
            <div>
              <h3 className="text-xl font-black text-[#2A0826]">Enrolled Child Profiles</h3>
              <p className="text-xs font-bold text-[#684E67] mt-0.5">
                Accounts connected to your Parent Safety Guardian Portal
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="btn-3d-rose-pop px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>LINK NEW CHILD</span>
            </button>
          </div>

          {/* HOW AUTOMATIC LINKING WORKS CARD */}
          <div className="bg-gradient-to-r from-[#FFF0F3] via-white to-[#FFF0F3] p-5 rounded-2xl border-2 border-[#FFCCE1] flex items-start space-x-4 text-xs text-[#684E67] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#FF2A6D] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#FF2A6D]" />
            </div>
            <div>
              <p className="font-black text-[#2A0826] text-sm">
                How Automatic Linking Works
              </p>
              <p className="font-bold text-xs mt-1 leading-relaxed">
                When your daughter or family member creates their account and enters your email address or mobile number as their guardian/parent, their profile connects <strong>automatically</strong> to your Parent Portal upon verification. You can also link them manually above by entering their registered phone number or email.
              </p>
            </div>
          </div>

          {childrenList.length === 0 ? (
            <div className="text-center py-14 bg-[#FFF0F3] rounded-[28px] border-2 border-dashed border-[#FFCCE1] p-8 space-y-3">
              <Heart className="w-12 h-12 text-[#FF5C8A] mx-auto" />
              <h4 className="font-black text-base text-[#2A0826]">No linked child accounts yet</h4>
              <p className="text-xs font-bold text-[#684E67] max-w-md mx-auto">
                Click the button above to link your child using their registered mobile number or email address.
              </p>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="btn-3d-rose-pop px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                LINK CHILD NOW
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {childrenList.map((item) => (
                <div
                  key={item.linkId}
                  className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs overflow-hidden">
                      {item.child.profilePhoto ? (
                        <img
                          src={item.child.profilePhoto}
                          alt={item.child.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.child.fullName?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-base text-[#2A0826] truncate">
                          {item.child.fullName}
                        </h4>
                        <span className="bg-[#FFF0F3] text-[#FF2A6D] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#FFCCE1] shrink-0">
                          {item.relationship}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#684E67] mt-0.5 truncate">
                        {item.child.phone}
                      </p>
                      <p className="text-[11px] font-bold text-[#684E67] truncate">
                        {item.child.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FFF0F3]/60 p-3 rounded-xl border border-[#FFCCE1]/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#684E67] block">
                        Protection Status
                      </span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Active 24/7 Shield</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-[#684E67] block">
                        Enrolled On
                      </span>
                      <span className="font-bold text-[#2A0826] mt-0.5 block">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#FFCCE1]/60">
                    <a
                      href={`tel:${item.child.phone}`}
                      className="flex-1 btn-3d-white-pop py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 border border-[#FFCCE1] text-[#2A0826] hover:text-[#FF2A6D]"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#FF2A6D]" />
                      <span>CALL</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handlePingCheckin(item.child.id, item.child.fullName)}
                      disabled={pingingChildId === item.child.id}
                      className="flex-1 btn-3d-white-pop py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 border border-[#FFCCE1] text-[#2A0826] hover:text-[#FF2A6D] cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>PING</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUnlinkChild(item.linkId, item.child.fullName)}
                      className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      title="Unlink Child"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LINK CHILD MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#FFCCE1] space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#FF2A6D] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#FF2A6D]" />
                </div>
                <h3 className="font-black text-lg text-[#2A0826]">Link Child Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
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

            <form onSubmit={handleLinkChild} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#684E67] font-extrabold mb-1">
                  Child Registered Mobile Number or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter child email or 10-digit mobile"
                  value={childIdentifier}
                  onChange={(e) => setChildIdentifier(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold focus:border-[#FF2A6D] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#684E67] font-extrabold mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold focus:border-[#FF2A6D] outline-none cursor-pointer"
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Child">Child</option>
                  <option value="Son">Son</option>
                  <option value="Ward">Ward</option>
                  <option value="Sister">Sister</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-3 bg-[#FFF0F3] text-[#684E67] font-black rounded-full uppercase tracking-wider cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="flex-1 btn-3d-rose-pop py-3 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {linkLoading ? 'LINKING...' : 'LINK CHILD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function ParentChildrenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center text-xs font-bold text-[#FF2A6D] animate-pulse">
          Loading Linked Children...
        </div>
      }
    >
      <ParentChildrenContent />
    </Suspense>
  );
}
