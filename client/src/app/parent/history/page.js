'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Clock,
  AlertOctagon,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Calendar,
  MapPin,
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { ParentTabBar } from '../../../components/parent/ParentTabBar.js';
import { api } from '../../../utils/api.js';

function ParentHistoryContent() {
  const router = useRouter();
  const { token, user } = useSelector((state) => state?.auth || {});

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentJourneys, setRecentJourneys] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOverview = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/parent/overview');
      if (res.data && res.data.success) {
        setStats(res.data.stats || { totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
        setRecentAlerts(res.data.recentAlerts || []);
        setRecentJourneys(res.data.recentJourneys || []);
      }
    } catch (err) {
      console.error('Failed to fetch parent history:', err);
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

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* HEADER BAR */}
        <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-5 sm:p-7 rounded-[32px] border-2 border-[#FFCCE1] shadow-lg shadow-[#FF5C8A]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-start sm:items-center space-x-4 min-w-0 w-full md:w-auto relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shadow-[#FF2A6D]/25 shrink-0">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] px-3 py-1 rounded-full shadow-xs">
                  SAFETY TIMELINE & AUDIT
                </span>
                <span className="text-xs font-bold text-[#684E67] flex items-center gap-1.5 bg-white/80 px-2.5 py-0.5 rounded-full border border-[#FFCCE1]">
                  <span className="w-2 h-2 rounded-full bg-[#059669] inline-block shrink-0 animate-pulse" />
                  <span>Verified Incident Logging</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2A0826] tracking-tight mt-1 truncate">
                Safety Logs & Incident History
              </h1>
              <p className="text-xs font-bold text-[#684E67] mt-0.5">
                Complete history of emergency alarms, safe confirmations, and travel journeys for your family
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchOverview(true)}
            disabled={loading}
            className="btn-3d-white-pop px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer shrink-0 border border-[#FFCCE1]"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF2A6D] ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH LOGS</span>
          </button>
        </div>

        {/* REUSABLE PARENT TAB BAR */}
        <ParentTabBar activeSosCount={stats.activeSosCount} totalChildren={stats.totalChildren} />

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#684E67]">
              Total SOS Incidents
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#2A0826]">{recentAlerts.length}</span>
              <span className="text-xs font-bold text-[#684E67]">Logged</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#684E67]">
              Active Emergency Now
            </span>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-black ${stats.activeSosCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stats.activeSosCount}
              </span>
              <span className="text-xs font-bold text-[#684E67]">Active</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-sm space-y-1">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#684E67]">
              Travel Trips Recorded
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#2A0826]">{recentJourneys.length}</span>
              <span className="text-xs font-bold text-[#684E67]">Trips</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: SOS INCIDENTS LOG */}
        <div className="bg-white rounded-[32px] border-2 border-[#FFCCE1] shadow-md p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-3 border-b border-[#FFCCE1]/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2A0826]">
                Emergency SOS Incident History
              </h3>
              <p className="text-xs font-bold text-[#684E67]">
                Archived record of all distress alarms triggered by linked children
              </p>
            </div>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-12 bg-[#FFF0F3] rounded-[24px] border border-dashed border-[#FFCCE1] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-black text-sm text-[#2A0826]">All Clear — No Incidents</p>
              <p className="text-xs font-bold text-[#684E67] max-w-sm mx-auto">
                No emergency distress signals have been triggered by any of your linked children.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#FFCCE1]/60">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FFF0F3]/30 p-3 rounded-2xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-black text-base text-[#2A0826]">
                        {alert.user?.fullName}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          alert.status === 'ACTIVE'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {alert.status === 'ACTIVE' ? '🚨 LIVE SOS ACTIVE' : 'RESOLVED SAFE'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#684E67] font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Triggered: {new Date(alert.startedAt).toLocaleString()}</span>
                      </span>
                      {alert.user?.phone && (
                        <span>• Contact: {alert.user.phone}</span>
                      )}
                    </div>
                  </div>

                  {alert.shareToken && (
                    <a
                      href={`/live-track/${alert.shareToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-3d-white-pop px-4 py-2.5 rounded-xl text-xs font-black uppercase text-[#FF2A6D] flex items-center space-x-1.5 border border-[#FFCCE1] self-end sm:self-auto"
                    >
                      <span>VIEW ARCHIVED ROUTE</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: JOURNEY TRAVEL LOG */}
        <div className="bg-white rounded-[32px] border-2 border-[#FFCCE1] shadow-md p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-3 border-b border-[#FFCCE1]/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2A0826]">Travel Trip History</h3>
              <p className="text-xs font-bold text-[#684E67]">
                Routes and transit journeys monitored for your linked children
              </p>
            </div>
          </div>

          {recentJourneys.length === 0 ? (
            <div className="text-center py-12 bg-[#FFF0F3] rounded-[24px] border border-dashed border-[#FFCCE1] space-y-2">
              <Navigation className="w-10 h-10 text-teal-500 mx-auto" />
              <p className="font-black text-sm text-[#2A0826]">No Travel Trips Recorded</p>
              <p className="text-xs font-bold text-[#684E67] max-w-sm mx-auto">
                Your linked children haven't recorded transit trips recently.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#FFCCE1]/60">
              {recentJourneys.map((trip) => (
                <div
                  key={trip.id}
                  className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-teal-50/20 p-3 rounded-2xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-black text-base text-[#2A0826]">
                        {trip.user?.fullName}
                      </span>
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#2A0826] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>Destination: {trip.destinationName || 'Destination'}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-[#684E67]">
                      Started: {new Date(trip.startedAt).toLocaleString()}
                    </p>
                  </div>

                  {trip.shareToken && (
                    <a
                      href={`/live-track/${trip.shareToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-3d-white-pop px-4 py-2.5 rounded-xl text-xs font-black uppercase text-teal-700 flex items-center space-x-1.5 border border-teal-200 self-end sm:self-auto"
                    >
                      <span>VIEW TRIP ROUTE</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function ParentHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center text-xs font-bold text-[#FF2A6D] animate-pulse">
          Loading Safety Logs...
        </div>
      }
    >
      <ParentHistoryContent />
    </Suspense>
  );
}
