'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Navigation,
  RefreshCw,
  Heart,
  Activity,
  ArrowUpRight,
  Shield,
  Eye,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { LiveLocationMap } from '../../components/location/DynamicLiveLocationMap.js';
import { api } from '../../utils/api.js';
import { sosApi } from '../../redux/api/sosApi.js';

export default function ParentDashboard() {
  const router = useRouter();
  const { token, user } = useSelector((state) => state?.auth || {});
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('safety'); // 'safety' | 'children'

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
  const [childrenList, setChildrenList] = useState([]);

  // Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childIdentifier, setChildIdentifier] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [linkLoading, setLinkLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Live GPS Tracking Modal State
  const [trackingChild, setTrackingChild] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reliable Polling Fallback & History Fetcher for Live GPS Tracking
  useEffect(() => {
    if (!trackingChild?.activeSos?.id) return;
    
    const fetchLocationData = async () => {
      try {
        const data = await sosApi.getSosLocation(trackingChild.activeSos.id);
        if (data && data.location) {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            setTrackingChild(prev => {
              if (prev && prev.activeSos && prev.activeSos.id === trackingChild.activeSos.id) {
                return {
                  ...prev,
                  activeSos: {
                    ...prev.activeSos,
                    latestLocation: {
                      latitude: lat,
                      longitude: lng,
                      accuracy: data.location.accuracy || 10
                    },
                    locationHistory: data.history || []
                  }
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.log('[Parent Polling] Failed to fetch location:', e.message);
      }
    };

    // Fetch immediately to load history trail, then poll every 3 seconds
    fetchLocationData();
    const interval = setInterval(fetchLocationData, 3000);

    return () => clearInterval(interval);
  }, [trackingChild?.activeSos?.id]);

  const fetchOverview = async (showLoading = true) => {
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

      // Auto-refresh interval every 8 seconds for safety live updates
      const interval = setInterval(() => {
        fetchOverview(false);
      }, 8000);

      // Connect Socket.IO for instant zero-latency SOS triggers
      let socket = null;
      (async () => {
        try {
          const { io } = await import('socket.io-client');
          const { SERVER_URL } = await import('../../utils/api.js');
          socket = io(SERVER_URL, {
            path: '/api/socket.io',
            transports: ['websocket', 'polling'],
          });

          socket.on('connect', () => {
            if (user) {
              const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : null;
              socket.emit('register-user', {
                email: user.email?.trim().toLowerCase(),
                phone: cleanPhone,
                role: user.role,
              });
            }
          });

          const handleLiveEvent = () => {
            fetchOverview(false);
          };

          socket.on('SOS_ALARM_BROADCAST', handleLiveEvent);
          socket.on('SOS_ALARM_STOP', (data) => {
            handleLiveEvent();
            setTrackingChild(null);
          });
          socket.on('SOS_PERIODIC_5MIN_UPDATE', handleLiveEvent);
          socket.on('JOURNEY_STATUS_UPDATE', handleLiveEvent);

          // Real-time SOS location updates from server
          socket.on('SOS_LOCATION_UPDATE', (data) => {
            if (!data?.sosSessionId || !data?.latitude || !data?.longitude) return;
            const incomingId = parseInt(data.sosSessionId, 10);
            console.log('[Parent] SOS_LOCATION_UPDATE:', incomingId, data.latitude, data.longitude);

            // Update childrenList state with real-time lat/lng
            setChildrenList((prevList) =>
              prevList.map((item) => {
                if (item.activeSos && parseInt(item.activeSos.id, 10) === incomingId) {
                  return {
                    ...item,
                    activeSos: {
                      ...item.activeSos,
                      latestLocation: {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        accuracy: data.accuracy || 10,
                      },
                    },
                  };
                }
                return item;
              })
            );

            // Update tracking modal if open for this SOS session
            setTrackingChild((prev) => {
              if (prev && prev.activeSos && parseInt(prev.activeSos.id, 10) === incomingId) {
                console.log('[Parent] Updating tracking modal marker position');
                return {
                  ...prev,
                  activeSos: {
                    ...prev.activeSos,
                    latestLocation: {
                      latitude: data.latitude,
                      longitude: data.longitude,
                      accuracy: data.accuracy || 10,
                    },
                  },
                };
              }
              return prev;
            });
          });
        } catch (e) {
          console.warn('[Parent Socket Init Warning]:', e.message);
        }
      })();

      return () => {
        clearInterval(interval);
        if (socket) socket.disconnect();
      };
    }
  }, [mounted, token, user]);

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

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    const inputVal = childIdentifier.trim();
    if (!inputVal) {
      setModalError('Please enter child mobile number or email address.');
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
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* PARENTAL HEADER BAR */}
        <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-4 sm:p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4 min-w-0 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shrink-0 mt-0.5 sm:mt-0">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] px-2.5 py-0.5 rounded-full shadow-xs">
                  PARENTAL CONTROL
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-[#684E67] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] inline-block shrink-0 animate-pulse" />
                  <span>Child Safety Guardian</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[#2A0826] tracking-tight mt-1 truncate">
                {user?.fullName || 'Parent Safety Command'}
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
            <span>REFRESH GPS</span>
          </button>
        </div>

        {/* MINIMAL 2-TAB NAVIGATION BAR */}
        <div className="flex items-center space-x-2 bg-white/90 p-1.5 rounded-2xl border-2 border-[#FFCCE1] shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md'
                : 'text-[#684E67] hover:text-[#FF2A6D]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. Child Safety Command</span>
            {stats.activeSosCount > 0 && (
              <span className="bg-white text-[#FF2A6D] px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {stats.activeSosCount} SOS
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('children')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'children'
                ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md'
                : 'text-[#684E67] hover:text-[#FF2A6D]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Linked Children ({stats.totalChildren})</span>
          </button>
        </div>

        {/* TAB 1: CHILD SAFETY COMMAND */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            {/* ACTIVE SOS BANNER IF ANY CHILD TRIGGERED SOS */}
            {stats.activeSosCount > 0 && (
              <div className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5C8A] to-[#FF2A6D] text-white p-5 rounded-3xl shadow-xl flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base uppercase tracking-wider">
                      EMERGENCY SOS ALERT ACTIVATED!
                    </h3>
                    <p className="text-xs font-bold text-white/90">
                      One or more of your linked children have triggered an Emergency SOS Alert.
                      Live GPS tracking is broadcasting now.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* LINKED CHILDREN SAFETY CARDS */}
            {childrenList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-[#FFCCE1] p-6 space-y-3">
                <Heart className="w-12 h-12 text-[#FF5C8A] mx-auto" />
                <h3 className="text-base font-black text-[#2A0826]">No Children Linked Yet</h3>
                <p className="text-xs font-bold text-[#684E67] max-w-sm mx-auto">
                  Link your daughter's or child's account to view real-time GPS safety status and
                  receive instant SOS alerts.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="btn-3d-rose-pop px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  LINK CHILD ACCOUNT NOW
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {childrenList.map((item) => {
                  const c = item.child;
                  const isSos = item.activeSos || c.safetyStatus === 'SOS_ACTIVE';
                  const isTrip = item.activeJourney || c.safetyStatus === 'JOURNEY_ACTIVE';

                  return (
                    <div
                      key={item.linkId}
                      className={`p-6 rounded-3xl border-2 shadow-md transition-all space-y-4 ${
                        isSos
                          ? 'bg-[#FFF0F3] border-[#FF2A6D]'
                          : isTrip
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : 'bg-white border-[#FFCCE1]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#FFCCE1]/60 pb-4">
                        <div className="flex items-center space-x-3.5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${
                              isSos
                                ? 'bg-[#FF2A6D] animate-pulse'
                                : isTrip
                                  ? 'bg-emerald-500'
                                  : 'bg-gradient-to-tr from-[#FF5C8A] to-[#FF2A6D]'
                            }`}
                          >
                            {c.fullName?.charAt(0) || 'C'}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-black text-[#2A0826]">{c.fullName}</h3>
                              <span className="bg-[#FFF0F3] text-[#FF2A6D] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#FFCCE1]">
                                {item.relationship}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-[#684E67]">
                              {c.phone} • {c.email}
                            </p>
                          </div>
                        </div>

                        {/* STATUS BADGE */}
                        <div>
                          {isSos ? (
                            <span className="bg-[#FF2A6D] text-white text-xs font-black px-4 py-1.5 rounded-full animate-pulse flex items-center space-x-1.5 shadow-sm">
                              <AlertTriangle className="w-4 h-4" />
                              <span>EMERGENCY SOS ACTIVE</span>
                            </span>
                          ) : isTrip ? (
                            <span className="bg-emerald-500 text-white text-xs font-black px-4 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm">
                              <Navigation className="w-4 h-4" />
                              <span>IN-TRANSIT TRIP</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black px-4 py-1.5 rounded-full flex items-center space-x-1.5 shadow-xs">
                              <ShieldCheck className="w-4 h-4" />
                              <span>100% PROTECTED & SAFE</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* GPS & JOURNEY DETAILS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-[#684E67]">
                        <div className="bg-white/80 p-3.5 rounded-2xl border border-[#FFCCE1] flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-[#FF2A6D] shrink-0" />
                          <div>
                            <span className="block text-[10px] font-black uppercase text-[#FF2A6D]">
                              GPS Tracking Status
                            </span>
                            <span className="text-[#2A0826]">Real-Time Geo Sync Active</span>
                          </div>
                        </div>

                        {item.activeJourney ? (
                          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#FFCCE1] flex items-center space-x-3">
                            <Navigation className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                              <span className="block text-[10px] font-black uppercase text-emerald-600">
                                Active Destination
                              </span>
                              <span className="text-[#2A0826] truncate block">
                                {item.activeJourney.destinationName}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#FFCCE1] flex items-center space-x-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                              <span className="block text-[10px] font-black uppercase text-[#684E67]">
                                Trip Monitor
                              </span>
                              <span className="text-[#2A0826]">No active trip in progress</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* LIVE TRACK BUTTON IF SOS OR JOURNEY */}
                      <div className="pt-1 space-y-2">
                        {item.activeSos && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => setTrackingChild(item)}
                              className="flex-1 bg-[#FF2A6D] hover:bg-[#E01A4F] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              <span>TRACK LIVE GPS — {c.fullName.toUpperCase()}</span>
                            </button>
                            {item.activeSos.shareToken && (
                              <a
                                href={`/live-track/${item.activeSos.shareToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-shrink-0 bg-white border-2 border-[#FF2A6D] text-[#FF2A6D] py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 hover:bg-[#FFF0F3] transition-all"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                                <span>FULL PAGE</span>
                              </a>
                            )}
                          </div>
                        )}

                        {item.activeJourney && item.activeJourney.shareToken && !item.activeSos && (
                          <a
                            href={`/live-track/${item.activeJourney.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>
                              OPEN LIVE JOURNEY MAP FOR {c.fullName.toUpperCase()} (
                              {item.activeJourney.destinationName})
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LINKED CHILDREN */}
        {activeTab === 'children' && (
          <div className="bg-white rounded-3xl border-2 border-[#FFCCE1] shadow-md p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#2A0826]">Linked Child Accounts</h3>
                <p className="text-xs font-bold text-[#684E67]">
                  Manage accounts linked to your Parent Safety Portal
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="btn-3d-rose-pop px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>LINK NEW CHILD ACCOUNT</span>
              </button>
            </div>

            {childrenList.length === 0 ? (
              <div className="text-center py-12 bg-[#FFF0F3] rounded-2xl border-1.5 border-dashed border-[#FFCCE1] space-y-2">
                <Heart className="w-10 h-10 text-[#FF5C8A] mx-auto" />
                <h4 className="font-black text-sm text-[#2A0826]">No linked child accounts</h4>
                <p className="text-xs font-bold text-[#684E67]">
                  Click the button above to link your child using their phone number or email.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#FFCCE1]/60">
                {childrenList.map((item) => (
                  <div key={item.linkId} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {item.child.fullName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm text-[#2A0826]">
                            {item.child.fullName}
                          </h4>
                          <span className="bg-[#FFF0F3] text-[#FF2A6D] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FFCCE1]">
                            {item.relationship}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#684E67]">
                          {item.child.phone} • {item.child.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnlinkChild(item.linkId, item.child.fullName)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Unlink Child"
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

      {/* LINK CHILD MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border-2 border-[#FFCCE1] space-y-5 animate-fade-up">
            <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-[#FF2A6D]" />
                <h3 className="font-black text-base text-[#2A0826]">Link Child Account</h3>
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
                  <option value="Parent">Parent</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
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
                  className="flex-1 btn-3d-rose-pop py-3 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {linkLoading ? 'LINKING...' : 'LINK CHILD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE GPS TRACKING MODAL — Inline Leaflet Map for Parent */}
      {trackingChild && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#FF2A6D] relative animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF2A6D] border border-rose-200 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#2A0826]">
                    🚨 Live GPS Stream — {trackingChild.child?.fullName}
                  </h3>
                  <p className="text-xs text-rose-600 font-bold">
                    Real-time GPS Map • SOS Session #{trackingChild.activeSos?.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingChild(null)}
                className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* CHILD DETAILS CARD */}
            <div className="bg-[#FFF0F3] p-4 rounded-2xl border border-[#FFCCE1] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-black text-[#684E67] uppercase block">Child Name</span>
                <p className="font-black text-[#2A0826] text-sm">{trackingChild.child?.fullName || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-[#684E67] uppercase block">Phone</span>
                <p className="font-bold text-[#FF2A6D] text-sm">{trackingChild.child?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-[#684E67] uppercase block">Email</span>
                <p className="font-bold text-[#2A0826]">{trackingChild.child?.email || 'N/A'}</p>
              </div>
            </div>

            {/* INTERACTIVE LEAFLET GPS MAP */}
            <div className="rounded-3xl border-2 border-[#FFCCE1] overflow-hidden h-72 shadow-md relative">
              <LiveLocationMap
                lat={trackingChild.activeSos?.latestLocation?.latitude}
                lng={trackingChild.activeSos?.latestLocation?.longitude}
                accuracy={trackingChild.activeSos?.latestLocation?.accuracy || 15}
                userName={`${trackingChild.child?.fullName || 'Child'} (EMERGENCY)`}
                isEmergency={true}
                locationHistory={trackingChild.activeSos?.locations ? [...trackingChild.activeSos.locations].reverse() : []}
              />
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#FFCCE1]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#684E67]">
                <MapPin className="w-4 h-4 text-[#FF2A6D]" />
                <span>
                  GPS: {trackingChild.activeSos?.latestLocation?.latitude?.toFixed(5) || '—'},{' '}
                  {trackingChild.activeSos?.latestLocation?.longitude?.toFixed(5) || '—'}
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTrackingChild(null)}
                  className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  Close Map
                </button>

                {trackingChild.activeSos?.shareToken && (
                  <a
                    href={`/live-track/${trackingChild.activeSos.shareToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] uppercase tracking-wider shadow cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>OPEN FULL TRACKING PAGE</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
