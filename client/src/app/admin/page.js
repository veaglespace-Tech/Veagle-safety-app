'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../components/admin/AdminHeaderNav.js';
import { LiveLocationMap } from '../../components/location/DynamicLiveLocationMap.js';
import { api } from '../../utils/api.js';
import { sosApi } from '../../redux/api/sosApi.js';
import {
  AlertOctagon,
  Users,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  MapPin,
  Eye,
  PhoneCall,
  Mail,
  X,
  Clock,
  ExternalLink,
  VolumeX,
  Volume2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSosMute } from '../../redux/slices/sosSlice.js';

export default function SuperAdminOverviewPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const mutedSosIds = useSelector((state) => state?.sos?.mutedSosIds || []);

  const [mounted, setMounted] = useState(false);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // Evaluate siren based on active SOS list and muted IDs
  useEffect(() => {
    const activeSosList = overview?.activeSos || [];
    const hasUnmutedSos = activeSosList.some(sos => !mutedSosIds.includes(String(sos.id)));
    
    // Tell EmergencyAlarmListener whether to keep playing
    window.dispatchEvent(new CustomEvent('set-siren-state', { detail: { active: hasUnmutedSos && activeSosList.length > 0 } }));
    setIsSirenActive(hasUnmutedSos && activeSosList.length > 0);
  }, [overview?.activeSos, mutedSosIds]);

  // Sync actual global siren state (in case muted from popup)
  useEffect(() => {
    const handleSirenChange = (e) => setIsSirenActive(e.detail.active);
    window.addEventListener('siren-status-changed', handleSirenChange);
    return () => window.removeEventListener('siren-status-changed', handleSirenChange);
  }, []);

  // LIVE GPS TRACKING MODAL STATE
  const [trackingSos, setTrackingSos] = useState(null);

  // Reliable Polling Fallback & History Fetcher for Live GPS Tracking
  useEffect(() => {
    if (!trackingSos?.id) return;
    
    const fetchLocationData = async () => {
      try {
        const data = await sosApi.getSosLocation(trackingSos.id);
        if (data && data.location) {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            setTrackingSos(prev => {
              if (prev && prev.id === trackingSos.id) {
                return {
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  locations: [{ latitude: lat, longitude: lng }],
                  locationHistory: data.history || []
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.log('[Admin Polling] Failed to fetch location:', e.message);
      }
    };

    // Fetch immediately to load history trail, then poll every 3 seconds
    fetchLocationData();
    const interval = setInterval(fetchLocationData, 3000);

    return () => clearInterval(interval);
  }, [trackingSos?.id]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/overview');
      setOverview(res.data || null);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to load Emergency Command overview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchOverviewData();

    let socket = null;
    const connectAdminSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const { SERVER_URL } = await import('../../utils/api.js');
        socket = io(SERVER_URL, {
          path: '/api/socket.io',
          transports: ['websocket', 'polling'],
        });

        // Register as admin to join admin-ops room for real-time SOS updates
        socket.on('connect', () => {
          socket.emit('register-user', { role: 'SUPER_ADMIN' });
        });

        socket.on('SOS_ALARM_BROADCAST', (data) => {
          showToast(
            'error',
            `🚨 CRITICAL EMERGENCY SOS: ${data?.victimName || 'Sakhi Member'} triggered an emergency broadcast!`
          );
          fetchOverviewData();
        });

        socket.on('SOS_ALARM_STOP', () => {
          showToast('success', 'Emergency SOS incident resolved');
          fetchOverviewData();
          setTrackingSos(null);
        });

        socket.on('SOS_LOCATION_UPDATE', (data) => {
          const incomingId = parseInt(data.sosSessionId, 10);
          console.log('[Admin] SOS_LOCATION_UPDATE received:', incomingId, data.latitude, data.longitude);

          setTrackingSos((prev) => {
            if (prev && parseInt(prev.id, 10) === incomingId) {
              console.log('[Admin] Updating tracking modal marker position');
              return {
                ...prev,
                latitude: data.latitude,
                longitude: data.longitude,
                locations: [{ latitude: data.latitude, longitude: data.longitude }],
              };
            }
            return prev;
          });

          setOverview((prev) => {
            if (!prev || !prev.activeSos) return prev;
            return {
              ...prev,
              activeSos: prev.activeSos.map((sos) => {
                if (parseInt(sos.id, 10) === incomingId) {
                  return {
                    ...sos,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    locations: [{ latitude: data.latitude, longitude: data.longitude }],
                  };
                }
                return sos;
              }),
            };
          });
        });
      } catch (e) {}
    };

    connectAdminSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleResolveSos = async (sosId) => {
    if (!confirm('Resolve emergency SOS broadcast on behalf of dispatch center?')) return;
    try {
      const res = await api.post('/admin/sos/resolve', { sosSessionId: sosId });
      showToast('success', res.data.message);
      setTrackingSos(null);
      fetchOverviewData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to resolve SOS');
    }
  };

  if (!mounted) return null;

  const activeSosList = overview?.activeSos || [];
  const recentSosList = overview?.recentSos || [];

  const metrics = {
    activeSosCount: overview?.metrics?.activeSosCount || 0,
    totalUsers: overview?.metrics?.totalUsers || 0,
    activePlansCount: overview?.metrics?.activeSubscriptions || 0,
    paymentsCount: overview?.metrics?.totalSuccessfulTransactions || 0,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* HEADER NAVIGATION */}
        <AdminHeaderNav
          metrics={metrics}
          onRefresh={fetchOverviewData}
          toast={toast}
          activeTabOverride="overview"
        />

        {/* OVERVIEW CONTENT */}
        <div className="space-y-8 animate-fade-up">
          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#684E67] uppercase tracking-wider">
                  Active SOS Alerts
                </span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF2A6D] flex items-center justify-center border border-rose-200">
                  <AlertOctagon className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#2A0826]">{metrics.activeSosCount}</p>
              <p className="text-[11px] font-bold text-rose-500">Emergency broadcasts live</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#684E67] uppercase tracking-wider">
                  Total Members
                </span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#2A0826]">{metrics.totalUsers}</p>
              <p className="text-[11px] font-bold text-[#684E67]">Registered Sakhi accounts</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#684E67] uppercase tracking-wider">
                  Active Paid Plans
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#2A0826]">{metrics.activePlansCount}</p>
              <p className="text-[11px] font-bold text-emerald-600">Active paid protection</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#684E67] uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#2A0826]">
                ₹{overview?.metrics?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[11px] font-bold text-amber-600">
                {overview?.metrics?.currentGstPercentage !== undefined && overview?.metrics?.currentGstPercentage !== null
                  ? `Incl. ${overview.metrics.currentGstPercentage}% Global GST`
                  : 'Incl. Global GST'}
              </p>
            </div>
          </div>

          {/* LIVE EMERGENCY SOS BROADCAST STREAM */}
          <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FFCCE1] pb-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">
                  Live Active SOS Emergency Broadcasts
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs font-black bg-rose-100 text-[#FF2A6D] px-3 py-1.5 rounded-full uppercase border border-rose-300 whitespace-nowrap shrink-0 self-start sm:self-auto">
                {activeSosList.length} LIVE INCIDENTS
              </span>
            </div>

            {activeSosList.length > 0 ? (
              <div className="space-y-4">
                {activeSosList.map((sos) => {
                  const latestLoc = sos.locations?.[0];
                  const lat = latestLoc?.latitude;
                  const lng = latestLoc?.longitude;

                  return (
                    <div
                      key={sos.id}
                      className="p-5 rounded-3xl bg-rose-50/60 border-2 border-rose-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-rose-600 bg-white px-2.5 py-0.5 rounded-full border border-rose-300 uppercase">
                            SOS #{sos.id}
                          </span>
                          <h4 className="font-black text-base text-[#2A0826]">
                            {sos.user?.fullName || 'Anonymous Sakhi'}
                          </h4>
                        </div>
                        <p className="text-xs font-bold text-[#684E67] flex items-center space-x-2">
                          <PhoneCall className="w-3.5 h-3.5 text-[#FF2A6D]" />
                          <span>{sos.user?.phone || 'N/A'}</span>
                          <span>•</span>
                          <Mail className="w-3.5 h-3.5 text-[#FF2A6D]" />
                          <span>{sos.user?.email || 'N/A'}</span>
                        </p>
                        <p className="text-xs font-bold text-rose-700 flex items-center space-x-1 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          <span>
                            GPS: {lat ? `${lat}, ${lng}` : 'Awaiting GPS...'}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => dispatch(toggleSosMute(sos.id))}
                          className={`px-4 py-2.5 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider ${
                            !mutedSosIds.includes(String(sos.id))
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-white text-red-600 border border-red-200 hover:bg-rose-50'
                          }`}
                        >
                          {!mutedSosIds.includes(String(sos.id)) ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          <span>{!mutedSosIds.includes(String(sos.id)) ? 'MUTE SIREN' : 'PLAY SIREN'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackingSos(sos)}
                          className="px-4 py-2.5 bg-[#FF2A6D] text-white font-black text-xs rounded-xl shadow-md hover:bg-[#E01A4F] transition-all flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <Eye className="w-4 h-4" />
                          <span>TRACK LIVE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveSos(sos.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs rounded-xl shadow-sm hover:scale-105 transition-all flex items-center space-x-1 cursor-pointer uppercase tracking-wider"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>RESOLVE SOS</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FFF0F3]/40 rounded-3xl border border-dashed border-[#FFCCE1] space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-black text-sm text-[#2A0826]">
                  All Clear — No Active Emergency SOS Incidents
                </p>
                <p className="text-xs text-[#684E67] font-extrabold">
                  All Sakhi members are safe and monitored 24/7 by command dispatch.
                </p>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY & DISPATCH LOGS */}
          <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-4">
            <h3 className="font-black text-lg text-[#2A0826] border-b border-[#FFCCE1] pb-3">
              Recent System Activity & Dispatch Logs
            </h3>
            {recentSosList.length > 0 ? (
              <div className="space-y-3">
                {recentSosList.map((sos) => (
                  <div
                    key={sos.id}
                    className="p-4 rounded-2xl bg-[#FFF0F3]/60 border border-[#FFCCE1] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-black text-[#2A0826]">
                        Emergency SOS #{sos.id} ({sos.status}) — {sos.user?.fullName || 'Member'}
                      </span>
                      <p className="text-[11px] text-[#684E67] font-bold mt-0.5">
                        Triggered on {new Date(sos.startedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                        sos.status === 'ACTIVE'
                          ? 'bg-rose-100 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {sos.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-bold text-center py-4">
                No recent activity logs.
              </p>
            )}
          </div>
        </div>

        {/* MODAL: SUPERADMIN LIVE GPS TRACKING MODAL */}
        {trackingSos && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#FF2A6D] relative animate-scale-up max-h-[90vh] overflow-y-auto">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF2A6D] border border-rose-200 flex items-center justify-center">
                    <AlertOctagon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#2A0826]">
                      🚨 Live Emergency GPS Stream — Incident #{trackingSos.id}
                    </h3>
                    <p className="text-xs text-rose-600 font-bold">
                      Real-time GPS Map Tracking & Victim Details
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTrackingSos(null)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* VICTIM DETAILS CARD */}
              <div className="bg-[#FFF0F3] p-4 rounded-2xl border border-[#FFCCE1] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-black text-[#684E67] uppercase block">
                    Victim Member
                  </span>
                  <p className="font-black text-[#2A0826] text-sm">
                    {trackingSos.user?.fullName || 'Anonymous'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#684E67] uppercase block">
                    Phone / Contact
                  </span>
                  <p className="font-bold text-[#FF2A6D] text-sm">
                    {trackingSos.user?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#684E67] uppercase block">
                    Email Address
                  </span>
                  <p className="font-bold text-[#2A0826]">{trackingSos.user?.email || 'N/A'}</p>
                </div>
              </div>

              {/* INTERACTIVE LEAFLET GPS MAP CONTAINER */}
              <div className="rounded-3xl border-2 border-[#FFCCE1] overflow-hidden h-72 shadow-md relative">
                <LiveLocationMap
                  lat={trackingSos.locations?.[0]?.latitude}
                  lng={trackingSos.locations?.[0]?.longitude}
                  isEmergency={true}
                  locationHistory={trackingSos?.locations ? [...trackingSos.locations].reverse() : []}
                />
              </div>

              {/* ACTION FOOTER BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#FFCCE1]">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#684E67]">
                  <MapPin className="w-4 h-4 text-[#FF2A6D]" />
                  <span>
                    GPS: {trackingSos.locations?.[0]?.latitude || '—'},{' '}
                    {trackingSos.locations?.[0]?.longitude || '—'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setTrackingSos(null)}
                    className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Close Map
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResolveSos(trackingSos.id)}
                    className="px-6 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 uppercase tracking-wider shadow cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>RESOLVE INCIDENT NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
