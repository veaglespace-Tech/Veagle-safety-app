'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSosMute } from '../../redux/slices/sosSlice.js';
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
  VolumeX,
  Volume2,
  Bell,
  Clock,
  Sparkles,
  Radio,
  PhoneCall,
  AlertOctagon,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { LiveLocationMap } from '../../components/location/DynamicLiveLocationMap.js';
import { ParentTabBar } from '../../components/parent/ParentTabBar.js';
import { api } from '../../utils/api.js';
import { sosApi } from '../../redux/api/sosApi.js';

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state?.auth || {});
  const mutedSosIds = useSelector((state) => state?.sos?.mutedSosIds || []);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('safety'); // 'safety' | 'children' | 'history'

  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [stats, setStats] = useState({
    totalChildren: 0,
    activeSosCount: 0,
    inTripCount: 0,
    safeCount: 0,
  });
  const [childrenList, setChildrenList] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentJourneys, setRecentJourneys] = useState([]);

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

  // Live GPS Tracking Modal State
  const [trackingChild, setTrackingChild] = useState(null);
  const [isSirenActive, setIsSirenActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect query param tab to dedicated page
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'children') {
      router.replace('/parent/children');
    } else if (tabParam === 'history') {
      router.replace('/parent/history');
    }
  }, [searchParams, router]);

  // Evaluate siren based on active SOS list and muted IDs
  useEffect(() => {
    const activeSosChildren = childrenList.filter(
      (item) => item.activeSos || item.child.safetyStatus === 'SOS_ACTIVE'
    );
    const hasUnmutedSos = activeSosChildren.some((item) => {
      const sosId = item.activeSos?.id;
      return sosId && !mutedSosIds.includes(String(sosId));
    });

    window.dispatchEvent(
      new CustomEvent('set-siren-state', {
        detail: { active: hasUnmutedSos && activeSosChildren.length > 0 },
      })
    );
    setIsSirenActive(hasUnmutedSos && activeSosChildren.length > 0);
  }, [childrenList, mutedSosIds]);

  // Sync actual global siren state
  useEffect(() => {
    const handleSirenChange = (e) => setIsSirenActive(e.detail.active);
    window.addEventListener('siren-status-changed', handleSirenChange);
    return () => window.removeEventListener('siren-status-changed', handleSirenChange);
  }, []);

  // Reliable Polling Fallback & History Fetcher for Live GPS Tracking Modal
  useEffect(() => {
    if (!trackingChild?.activeSos?.id) return;

    const fetchLocationData = async () => {
      try {
        const data = await sosApi.getSosLocation(trackingChild.activeSos.id);
        if (data && data.location) {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            setTrackingChild((prev) => {
              if (prev && prev.activeSos && prev.activeSos.id === trackingChild.activeSos.id) {
                return {
                  ...prev,
                  activeSos: {
                    ...prev.activeSos,
                    latestLocation: {
                      latitude: lat,
                      longitude: lng,
                      accuracy: data.location.accuracy || 10,
                    },
                    locationHistory: data.history || [],
                  },
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.log('[Parent Polling] Location fetch note:', e.message);
      }
    };

    fetchLocationData();
    const interval = setInterval(fetchLocationData, 3000);
    return () => clearInterval(interval);
  }, [trackingChild?.activeSos?.id]);

  const fetchOverview = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/parent/overview');
      if (res.data && res.data.success) {
        setStats(
          res.data.stats || {
            totalChildren: 0,
            activeSosCount: 0,
            inTripCount: 0,
            safeCount: 0,
          }
        );
        setChildrenList(res.data.children || []);
        setRecentAlerts(res.data.recentAlerts || []);
        setRecentJourneys(res.data.recentJourneys || []);
        setLastRefreshedAt(new Date());
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

      // Auto-refresh interval every 7 seconds
      const interval = setInterval(() => {
        fetchOverview(false);
      }, 7000);

      // Connect Socket.IO for instant zero-latency events
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

          const handleLiveEvent = () => fetchOverview(false);

          socket.on('SOS_ALARM_BROADCAST', handleLiveEvent);
          socket.on('SOS_ALARM_STOP', () => {
            handleLiveEvent();
            setTrackingChild(null);
          });
          socket.on('SOS_PERIODIC_5MIN_UPDATE', handleLiveEvent);
          socket.on('JOURNEY_STATUS_UPDATE', handleLiveEvent);

          socket.on('SOS_LOCATION_UPDATE', (data) => {
            if (!data?.sosSessionId || !data?.latitude || !data?.longitude) return;
            const incomingId = parseInt(data.sosSessionId, 10);

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

            setTrackingChild((prev) => {
              if (prev && prev.activeSos && parseInt(prev.activeSos.id, 10) === incomingId) {
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

        {/* PARENTAL COMMAND HEADER */}
        <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-5 sm:p-7 rounded-[32px] border-2 border-[#FFCCE1] shadow-lg shadow-[#FF5C8A]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF5C8A]/10 to-[#FFD166]/20 blur-3xl pointer-events-none" />

          <div className="flex items-start sm:items-center space-x-4 min-w-0 w-full md:w-auto relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shadow-[#FF2A6D]/25 shrink-0">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] px-3 py-1 rounded-full shadow-xs">
                  PARENTAL SAFETY COMMAND
                </span>
                <span className="text-xs font-bold text-[#684E67] flex items-center gap-1.5 bg-white/80 px-2.5 py-0.5 rounded-full border border-[#FFCCE1]">
                  <span className="w-2 h-2 rounded-full bg-[#059669] inline-block shrink-0 animate-pulse" />
                  <span>24/7 Live Guardian Monitoring</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2A0826] tracking-tight mt-1 truncate">
                {user?.fullName || 'Parent Safety Command'}
              </h1>
              <p className="text-xs font-bold text-[#684E67] mt-0.5">
                Protecting & tracking your family in real-time • Last sync:{' '}
                {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
              <span>LINK CHILD</span>
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

        {/* CRITICAL 4-METRIC SAFETY SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. PROTECTED CHILDREN */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#684E67]">
                Protected Children
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#FF5C8A] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-[#2A0826]">
                {stats.totalChildren}
              </span>
              <span className="text-xs font-bold text-[#684E67]">Enrolled</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{stats.safeCount || stats.totalChildren} currently safe</span>
            </p>
          </div>

          {/* 2. EMERGENCY SOS ALERTS */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border-2 shadow-sm space-y-2 transition-all ${
              stats.activeSosCount > 0
                ? 'bg-rose-50 border-rose-500 shadow-rose-500/20 animate-pulse'
                : 'bg-white border-[#FFCCE1]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10.5px] font-black uppercase tracking-wider ${
                  stats.activeSosCount > 0 ? 'text-rose-700' : 'text-[#684E67]'
                }`}
              >
                Active SOS Alerts
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  stats.activeSosCount > 0
                    ? 'bg-rose-600 text-white animate-bounce'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  stats.activeSosCount > 0 ? 'text-rose-600' : 'text-[#2A0826]'
                }`}
              >
                {stats.activeSosCount}
              </span>
              <span className="text-xs font-bold text-[#684E67]">Incidents</span>
            </div>
            <p
              className={`text-[10px] font-bold ${
                stats.activeSosCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {stats.activeSosCount > 0 ? '🚨 IMMEDIATE ACTION NEEDED' : '🛡️ All Children Safe'}
            </p>
          </div>

          {/* 3. IN-TRANSIT JOURNEYS */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#684E67]">
                Active Trips
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-[#2A0826]">
                {stats.inTripCount}
              </span>
              <span className="text-xs font-bold text-[#684E67]">On Journey</span>
            </div>
            <p className="text-[10px] font-bold text-[#684E67]">
              {stats.inTripCount > 0 ? '🚗 Live GPS movement tracked' : 'No trips active'}
            </p>
          </div>

          {/* 4. GPS GEO-SYNC STATUS */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#684E67]">
                GPS Sync Mode
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg sm:text-xl font-black text-emerald-600">
                HIGH ACCURACY
              </span>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Real-time Socket stream</span>
            </p>
          </div>
        </div>

        {/* EMERGENCY SOS HIGH-ALERT BANNER IF ACTIVE */}
        {stats.activeSosCount > 0 && (
          <div className="bg-gradient-to-r from-[#FF2A6D] via-[#FF5C8A] to-[#FF2A6D] text-white p-5 sm:p-6 rounded-3xl shadow-xl shadow-rose-600/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg uppercase tracking-wider">
                  🚨 EMERGENCY SOS ALERT BROADCASTING NOW!
                </h3>
                <p className="text-xs font-bold text-white/90">
                  One of your linked children has triggered an active SOS emergency alert. Real-time GPS location is broadcasting live.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <a
                href="tel:112"
                className="flex-1 sm:flex-initial bg-white text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow"
              >
                <PhoneCall className="w-4 h-4" />
                <span>DIAL 112 (POLICE)</span>
              </a>
            </div>
          </div>
        )}

        {/* REUSABLE PARENT TAB BAR (NAVIGATES TO DEDICATED PAGES) */}
        <ParentTabBar activeSosCount={stats.activeSosCount} totalChildren={stats.totalChildren} />

        {/* SAFETY COMMAND CENTER CONTENT */}
        <div className="space-y-6">
            {/* LINKED CHILDREN SAFETY CARDS */}
            {childrenList.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-[32px] border-2 border-dashed border-[#FFCCE1] p-8 space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-[#FFF0F3] text-[#FF5C8A] flex items-center justify-center mx-auto border border-[#FFCCE1]">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#2A0826]">No Children Linked Yet</h3>
                  <p className="text-xs font-bold text-[#684E67] max-w-md mx-auto">
                    Link your daughter's or child's account to view real-time GPS safety status, track journey routes, and receive instant emergency alarms.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="btn-3d-rose-pop px-7 py-3 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
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
                      className={`p-6 sm:p-7 rounded-[32px] border-2 shadow-md transition-all space-y-5 ${
                        isSos
                          ? 'bg-[#FFF0F3] border-[#FF2A6D] shadow-rose-500/10'
                          : isTrip
                            ? 'bg-teal-50/40 border-teal-300'
                            : 'bg-white border-[#FFCCE1]'
                      }`}
                    >
                      {/* HEADER ROW */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#FFCCE1]/60 pb-5">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md shrink-0 overflow-hidden ${
                              isSos
                                ? 'bg-[#FF2A6D] animate-pulse'
                                : isTrip
                                  ? 'bg-teal-500'
                                  : 'bg-gradient-to-tr from-[#FF5C8A] to-[#FF2A6D]'
                            }`}
                          >
                            {c.profilePhoto ? (
                              <img
                                src={c.profilePhoto}
                                alt={c.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              c.fullName?.charAt(0) || 'C'
                            )}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2.5">
                              <h3 className="text-xl font-black text-[#2A0826]">{c.fullName}</h3>
                              <span className="bg-[#FFF0F3] text-[#FF2A6D] text-[10px] font-black px-3 py-1 rounded-full border border-[#FFCCE1]">
                                {item.relationship}
                              </span>
                              {c.bloodGroup && (
                                <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-200">
                                  {c.bloodGroup}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#684E67] mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-[#FF2A6D]" />
                                <span>{c.phone}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-[#684E67]" />
                                <span>{c.email}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* STATUS BADGE */}
                        <div>
                          {isSos ? (
                            <span className="bg-[#FF2A6D] text-white text-xs font-black px-4 py-2 rounded-full animate-pulse flex items-center space-x-2 shadow-sm">
                              <AlertTriangle className="w-4 h-4" />
                              <span>EMERGENCY SOS ACTIVE</span>
                            </span>
                          ) : isTrip ? (
                            <span className="bg-teal-600 text-white text-xs font-black px-4 py-2 rounded-full flex items-center space-x-2 shadow-sm">
                              <Navigation className="w-4 h-4 animate-spin" />
                              <span>IN-TRANSIT TRIP</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-black px-4 py-2 rounded-full flex items-center space-x-2 shadow-xs">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>100% PROTECTED & SAFE</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* GPS & JOURNEY DETAILS ROW */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-bold text-[#684E67]">
                        {/* GPS GEO STATUS */}
                        <div className="bg-white/80 p-4 rounded-2xl border border-[#FFCCE1] flex items-center space-x-3.5 shadow-xs">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#FF2A6D] flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[10px] font-black uppercase text-[#FF2A6D]">
                              Live GPS Coordinates
                            </span>
                            <span className="text-[#2A0826] font-mono font-bold truncate block">
                              {item.activeSos?.latestLocation ? (
                                `Lat: ${item.activeSos.latestLocation.latitude.toFixed(5)}, Lng: ${item.activeSos.latestLocation.longitude.toFixed(5)} (±${item.activeSos.latestLocation.accuracy || 10}m)`
                              ) : item.lastKnownLocation ? (
                                `Last Lat: ${Number(item.lastKnownLocation.latitude).toFixed(5)}, Lng: ${Number(item.lastKnownLocation.longitude).toFixed(5)}`
                              ) : (
                                'Geo-Protected (Active Standby)'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* TRIP / CHECK-IN MONITOR */}
                        {item.activeJourney ? (
                          <div className="bg-white/80 p-4 rounded-2xl border border-teal-200 flex items-center space-x-3.5 shadow-xs">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                              <Navigation className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black uppercase text-teal-600">
                                Destination Route
                              </span>
                              <span className="text-[#2A0826] truncate block font-bold">
                                {item.activeJourney.destinationName}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/80 p-4 rounded-2xl border border-[#FFCCE1] flex items-center space-x-3.5 shadow-xs">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black uppercase text-emerald-600">
                                Safety Sentinel Status
                              </span>
                              <span className="text-[#2A0826] font-bold">
                                Normal Safe Zone • No active trip in progress
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QUICK ACTION BUTTONS TOOLBAR */}
                      <div className="pt-1 flex flex-wrap items-center gap-2.5">
                        {/* 1. CALL CHILD */}
                        <a
                          href={`tel:${c.phone}`}
                          className="btn-3d-white-pop px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 border border-[#FFCCE1] text-[#2A0826] hover:text-[#FF2A6D]"
                        >
                          <PhoneCall className="w-4 h-4 text-[#FF2A6D]" />
                          <span>CALL {c.fullName.split(' ')[0].toUpperCase()}</span>
                        </a>

                        {/* 2. SEND SAFETY CHECK-IN PING */}
                        <button
                          type="button"
                          onClick={() => handlePingCheckin(c.id, c.fullName)}
                          disabled={pingingChildId === c.id}
                          className="btn-3d-white-pop px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 border border-[#FFCCE1] text-[#2A0826] hover:text-[#FF2A6D] cursor-pointer"
                        >
                          <Bell className={`w-4 h-4 text-amber-500 ${pingingChildId === c.id ? 'animate-spin' : ''}`} />
                          <span>
                            {pingingChildId === c.id ? 'SENDING PING...' : 'PING CHECK-IN'}
                          </span>
                        </button>

                        {/* 3. TRACK LIVE GPS (IF SOS OR STANDBY) */}
                        <button
                          type="button"
                          onClick={() => setTrackingChild(item)}
                          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all ${
                            isSos
                              ? 'bg-[#FF2A6D] hover:bg-[#E01A4F] text-white shadow-rose-500/20'
                              : 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white'
                          }`}
                        >
                          <Eye className="w-4 h-4 text-white" />
                          <span>TRACK LIVE GPS MAP</span>
                        </button>

                        {/* 4. SIREN MUTE/UNMUTE IF SOS ACTIVE */}
                        {item.activeSos && (
                          <button
                            type="button"
                            onClick={() => item.activeSos && dispatch(toggleSosMute(item.activeSos.id))}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all border shadow-xs ${
                              item.activeSos && !mutedSosIds.includes(String(item.activeSos.id))
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-white text-rose-600 border-rose-300'
                            }`}
                          >
                            {item.activeSos && !mutedSosIds.includes(String(item.activeSos.id)) ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                            <span>
                              {item.activeSos && !mutedSosIds.includes(String(item.activeSos.id))
                                ? 'MUTE SIREN'
                                : 'SIREN'}
                            </span>
                          </button>
                        )}

                        {/* 5. OPEN FULL JOURNEY MAP IF IN TRIP */}
                        {item.activeJourney && item.activeJourney.shareToken && !item.activeSos && (
                          <a
                            href={`/live-track/${item.activeJourney.shareToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>JOURNEY ROUTE</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DIRECT EMERGENCY HELPLINE CALL BAR */}
            <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50 p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-[#FF2A6D] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#2A0826]">
                    Immediate National Emergency Helplines
                  </h4>
                  <p className="text-xs font-bold text-[#684E67]">
                    Tap to dial direct 24/7 government safety services
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <a
                  href="tel:1091"
                  className="flex-1 sm:flex-initial bg-white border border-[#FF2A6D] text-[#FF2A6D] hover:bg-[#FFF0F3] px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5"
                >
                  <span>1091 (WOMEN HELPLINE)</span>
                </a>
                <a
                  href="tel:112"
                  className="flex-1 sm:flex-initial bg-[#FF2A6D] text-white hover:bg-[#E01A4F] px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <span>112 (ALL EMERGENCY)</span>
                </a>
              </div>
            </div>
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

      {/* LIVE GPS TRACKING MODAL */}
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
                    Real-time GPS Tracking • High Accuracy Geo-Beacon
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
            <div className="rounded-3xl border-2 border-[#FFCCE1] overflow-hidden h-80 shadow-md relative">
              <LiveLocationMap
                lat={
                  trackingChild.activeSos?.latestLocation?.latitude ||
                  trackingChild.lastKnownLocation?.latitude ||
                  18.5204
                }
                lng={
                  trackingChild.activeSos?.latestLocation?.longitude ||
                  trackingChild.lastKnownLocation?.longitude ||
                  73.8567
                }
                accuracy={
                  trackingChild.activeSos?.latestLocation?.accuracy ||
                  trackingChild.lastKnownLocation?.accuracy ||
                  15
                }
                userName={`${trackingChild.child?.fullName || 'Child'}`}
                isEmergency={Boolean(trackingChild.activeSos)}
                locationHistory={
                  trackingChild.activeSos?.locations
                    ? [...trackingChild.activeSos.locations].reverse()
                    : []
                }
              />
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#FFCCE1]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#684E67]">
                <MapPin className="w-4 h-4 text-[#FF2A6D]" />
                <span>
                  GPS:{' '}
                  {trackingChild.activeSos?.latestLocation?.latitude?.toFixed(5) ||
                    trackingChild.lastKnownLocation?.latitude?.toFixed(5) ||
                    '—'}
                  ,{' '}
                  {trackingChild.activeSos?.latestLocation?.longitude?.toFixed(5) ||
                    trackingChild.lastKnownLocation?.longitude?.toFixed(5) ||
                    '—'}
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTrackingChild(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  Close Map
                </button>

                {trackingChild.activeSos?.shareToken && (
                  <a
                    href={`/live-track/${trackingChild.activeSos.shareToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] uppercase tracking-wider shadow cursor-pointer flex items-center justify-center space-x-1.5"
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

export default function ParentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center text-xs font-bold text-[#FF2A6D] animate-pulse">
          Loading Parent Safety Command...
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
