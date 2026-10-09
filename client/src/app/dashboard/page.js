'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { SOSHeroButton } from '../../components/sos/SOSHeroButton.js';
import { TrustedContactCard } from '../../components/contacts/TrustedContactCard.js';
import { api } from '../../utils/api.js';
import Link from 'next/link';
import { AnimatedHeading } from '../../components/common/AnimatedHeading.jsx';
import {
  Share2,
  Navigation,
  Clock,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  AlertOctagon,
  MapPin,
  Users,
  WifiOff,
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Shield,
  BellRing,
  Heart,
  Plus,
  Sun,
  SunMedium,
  Moon,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts } from '../../redux/slices/contactSlice.js';
import { checkActiveSos } from '../../redux/slices/sosSlice.js';
import { fetchUser } from '../../redux/slices/authSlice.js';
import { useRouter } from 'next/navigation';

export default function DashboardAppPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user } = useSelector((state) => state?.auth || {});
  const { activeSession } = useSelector((state) => state?.sos || {});
  const { contacts = [] } = useSelector((state) => state?.contacts || {});
  const { status = 'LIVE', accuracy = 10 } = useSelector((state) => state?.location || {});
  const [activeJourney, setActiveJourney] = useState(null);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchUser());
    dispatch(fetchContacts());
    dispatch(checkActiveSos());
    fetchActiveJourney();
  }, [dispatch]);

  const fetchActiveJourney = async () => {
    try {
      const res = await api.get('/journey/active');
      setActiveJourney(res.data.journey);
    } catch (err) {}
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const h = new Date().getHours();
    if (h < 12) return Sun;
    if (h < 17) return SunMedium;
    return Moon;
  };

  const GreetingIcon = getGreetingIcon();
  const firstName =
    mounted && (user?.fullName || user?.name)
      ? (user.fullName || user.name).split(' ')[0]
      : 'Sakhi Member';

  const greetingText = mounted ? getGreeting() : 'Good Day';
  const isSuperAdmin = mounted && user?.role === 'SUPER_ADMIN';

  const locationStatusInfo = {
    LIVE: {
      label: 'GPS Live Active',
      color: 'text-tichi-success',
      dot: 'bg-tichi-success',
      icon: MapPin,
    },
    STALE: {
      label: 'GPS Updating',
      color: 'text-tichi-warning',
      dot: 'bg-amber-500',
      icon: MapPin,
    },
    DENIED: {
      label: 'Location Denied',
      color: 'text-[#FF2A6D]',
      dot: 'bg-[#FF2A6D]',
      icon: WifiOff,
    },
    OFFLINE: {
      label: 'Offline Mode',
      color: 'text-tichi-muted',
      dot: 'bg-tichi-muted',
      icon: WifiOff,
    },
  };
  const locInfo = locationStatusInfo[status] || locationStatusInfo.LIVE;

  const readinessScore =
    contacts.length >= 3 && status === 'LIVE' ? 100 : contacts.length > 0 ? 85 : 45;

  return (
    <AppLayout>
      <div className="bg-[#FFF0F3] text-tichi-text font-sans relative overflow-hidden">
        {/* BACKGROUND AMBIENT GLOW MESHES */}
        <div className="absolute w-[800px] h-[800px] rounded-full bg-rose/15 blur-[160px] top-[-100px] left-[-200px] pointer-events-none" />
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gold/15 blur-[160px] bottom-[100px] right-[-200px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-6 relative z-10 animate-fade-up">
          {/* CRITICAL SOS ACTIVE ALERT BAR */}
          {activeSession && (
            <div className="bg-gradient-to-r from-[#FF2A6D] via-rose to-[#FF2A6D] text-white p-5 rounded-3xl shadow-coral-glow flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse border-2 border-white">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                  <AlertOctagon className="w-7 h-7 text-white animate-bounce" />
                </div>
                <div>
                  <p className="font-black text-base uppercase tracking-wider">
                    CRITICAL EMERGENCY SOS ACTIVE
                  </p>
                  <p className="text-xs text-white/90 font-bold">
                    Encrypted GPS stream broadcasting to 5 trusted guardians
                  </p>
                </div>
              </div>
              <Link
                href="/active-sos"
                className="w-full sm:w-auto bg-white text-[#FF2A6D] font-black text-xs px-6 py-3 rounded-2xl shadow-lg hover:bg-rose/10 transition-all flex items-center justify-center space-x-1.5 uppercase tracking-wider shrink-0"
              >
                <span>OPEN LIVE COMMAND VIEW</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* INACTIVE SUBSCRIPTION BANNER */}
          {mounted && Boolean(user) && user?.subscriptionStatus !== 'ACTIVE' && (
            <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-[#FF2A6D] text-white p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-white">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-200 animate-spin" />
                </div>
                <div>
                  <p className="font-black text-base uppercase tracking-wider">
                    PROTECTION PLAN PENDING ACTIVATION
                  </p>
                  <p className="text-xs text-white/90 font-bold">
                    Activate 24/7 Live GPS Guardian & Encrypted Emergency Dispatcher Coverage
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="w-full sm:w-auto bg-white text-[#FF2A6D] hover:bg-amber-50 font-black text-xs px-6 py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 uppercase tracking-wider shrink-0 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>ACTIVATE PLAN NOW (PAYMENT)</span>
              </Link>
            </div>
          )}

          {/* PROTECTED JOURNEY BANNER */}
          {activeJourney && !activeSession && (
            <div className="card-antique-pink p-5 border-2 border-rose shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose/15 text-rose flex items-center justify-center shrink-0 border border-rose/30">
                  <Navigation className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <p className="font-black text-sm text-tichi-text">Protected Journey Active</p>
                  <p className="text-xs text-tichi-muted font-bold mt-0.5">
                    Destination:{' '}
                    <span className="text-rose font-black">{activeJourney.destinationName}</span>
                  </p>
                </div>
              </div>
              <Link
                href="/track-journey"
                className="btn-baby-pink px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-sm"
              >
                MANAGE TRIP
              </Link>
            </div>
          )}

          {/* SUPER ADMIN ACCESSIBILITY BAR */}
          {isSuperAdmin && (
            <div className="bg-gradient-to-r from-tichi-text via-[#3D0C38] to-tichi-text border-2 border-gold/40 text-gold p-4 sm:p-5 rounded-3xl shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="w-6 h-6 text-gold shrink-0 animate-pulse" />
                <div>
                  <span className="font-black text-xs uppercase tracking-wider text-white">
                    Super Admin Command Privilege
                  </span>
                  <span className="text-xs text-gold/90 font-bold ml-2 hidden sm:inline">
                    • Incident Monitoring Operations
                  </span>
                </div>
              </div>
              <Link
                href="/admin"
                className="bg-gold text-tichi-text font-black text-xs px-4 py-2 rounded-xl shadow hover:brightness-110 transition-all flex items-center space-x-1 uppercase tracking-wider"
              >
                <span>PORTAL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* MAIN UNIFIED HERO SAFETY HUB */}
          <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-5 sm:p-8 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_16px_50px_rgba(255,92,138,0.18)] hover:shadow-[0_20px_60px_rgba(255,42,109,0.25)] transition-all duration-500 space-y-4 relative overflow-hidden">
            {/* AMBIENT SHIMMER BADGE */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-[10px] sm:text-[11px] font-black px-5 sm:px-6 py-2 rounded-bl-2xl uppercase tracking-widest shadow-md flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 animate-pulse" />
              <span>365-DAY PROTECTION ACTIVE</span>
            </div>

            {/* HEADER STATUS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFCCE1] pb-4 pt-1 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-black uppercase tracking-widest text-[#FF2A6D]">
                    {greetingText}
                  </span>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white shadow-sm border-2 border-white transform hover:scale-105 transition-transform">
                    <GreetingIcon className="w-4 h-4 text-white drop-shadow-xs" />
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#2A0826] mt-1.5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {firstName}'s Safety Command
                </h1>
                <p className="text-xs sm:text-sm text-[#684E67] font-bold mt-0.5">
                  24/7 Live Protection & Emergency Guardian Network
                </p>
              </div>

              {/* GPS METER PILL */}
              <div className="bg-[#FFF0F3]/60 border border-[#FFCCE1]/80 p-3.5 rounded-2xl flex items-center space-x-3.5 shadow-xs shrink-0">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-[#2A0826]">{locInfo.label}</span>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ±{accuracy || '10'}m
                    </span>
                  </div>
                  <p className="text-[11px] text-[#684E67] font-semibold mt-0.5">
                    Real-Time Geolocation Sync
                  </p>
                </div>
              </div>
            </div>

            {/* EMERGENCY SOS HERO ACTION BUTTON */}
            <div className="pt-2 pb-3 text-center space-y-3">
              <SOSHeroButton />
              <p className="text-xs text-[#684E67] font-black tracking-widest uppercase">
                HOLD FOR 3 SECONDS OR DOUBLE-CLICK TO BROADCAST EMERGENCY ALERTS
              </p>
            </div>
            {/* 4-GRID QUICK ACTIONS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-2">
              <Link
                href="/track-journey"
                className="bg-[#FFF0F3]/40 p-5 sm:p-6 rounded-3xl border border-[#FFCCE1]/70 hover:border-[#FF2A6D] hover:-translate-y-1 transition-all duration-300 text-center space-y-3 group shadow-xs hover:shadow-md hover:shadow-[#FF2A6D]/10"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#FF2A6D] border border-[#FFCCE1]/80 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[#FF2A6D] group-hover:text-white transition-all duration-300 shadow-xs shrink-0">
                  <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors">
                  Track Journey
                </p>
                <p className="text-[11px] text-[#684E67] font-semibold">Share Live Route</p>
              </Link>

              <Link
                href="/track-journey"
                className="bg-[#FFF0F3]/40 p-5 sm:p-6 rounded-3xl border border-[#FFCCE1]/70 hover:border-[#FF2A6D] hover:-translate-y-1 transition-all duration-300 text-center space-y-3 group shadow-xs hover:shadow-md hover:shadow-[#FF2A6D]/10"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#FF2A6D] border border-[#FFCCE1]/80 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[#FF2A6D] group-hover:text-white transition-all duration-300 shadow-xs shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors">
                  Check On Me
                </p>
                <p className="text-[11px] text-[#684E67] font-semibold">Safety Alarm Timer</p>
              </Link>

              <Link
                href="/contacts"
                className="bg-[#FFF0F3]/40 p-5 sm:p-6 rounded-3xl border border-[#FFCCE1]/70 hover:border-[#FF2A6D] hover:-translate-y-1 transition-all duration-300 text-center space-y-3 group shadow-xs hover:shadow-md hover:shadow-[#FF2A6D]/10"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#FF2A6D] border border-[#FFCCE1]/80 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[#FF2A6D] group-hover:text-white transition-all duration-300 shadow-xs shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors">
                  Guardians
                </p>
                <p className="text-[11px] text-[#684E67] font-semibold">
                  {contacts.length} Trusted Listed
                </p>
              </Link>

              <Link
                href="/help"
                className="bg-[#FFF0F3]/40 p-5 sm:p-6 rounded-3xl border border-[#FFCCE1]/70 hover:border-[#FF2A6D] hover:-translate-y-1 transition-all duration-300 text-center space-y-3 group shadow-xs hover:shadow-md hover:shadow-[#FF2A6D]/10"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#FF2A6D] border border-[#FFCCE1]/80 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[#FF2A6D] group-hover:text-white transition-all duration-300 shadow-xs shrink-0">
                  <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors">
                  Helplines
                </p>
                <p className="text-[11px] text-[#684E67] font-semibold">National 112 & 1091</p>
              </Link>
            </div>
          </div>

          {/* SAFETY READINESS INDEX & TRUSTED GUARDIANS QUICK ACCESS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SAFETY READINESS METER CARD */}
            <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_10px_30px_rgba(255,92,138,0.14)] space-y-4 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                  Safety Readiness
                </span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {readinessScore}% READY
                </span>
              </div>

              <div className="w-full bg-white rounded-full h-4 p-0.5 border-2 border-[#FFCCE1] shadow-inner">
                <div
                  className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-emerald-500 h-full rounded-full transition-all duration-1000 shadow-xs"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>

              <div className="space-y-2.5 text-xs font-bold text-[#684E67] pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>GPS Location Permissions</span>
                  </span>
                  <span className="text-emerald-600 font-black">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 ${contacts.length >= 3 ? 'text-emerald-500' : 'text-amber-500'}`}
                    />
                    <span>Trusted Contacts Count</span>
                  </span>
                  <span
                    className={`font-black ${contacts.length >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}
                  >
                    {contacts.length}/5 Added
                  </span>
                </div>
              </div>
            </div>

            {/* TRUSTED GUARDIANS PREVIEW CARD */}
            <div className="md:col-span-2 bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_10px_30px_rgba(255,92,138,0.14)] space-y-4 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-3">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4.5 h-4.5 text-[#FF2A6D] fill-[#FF2A6D]/20 animate-pulse" />
                  <h3 className="font-black text-sm text-[#2A0826] uppercase tracking-wider">
                    Emergency Guardians
                  </h3>
                </div>
                <Link
                  href="/contacts"
                  className="text-xs font-black text-[#FF2A6D] hover:underline flex items-center space-x-1"
                >
                  <span>Manage All ({contacts.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {contacts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contacts.slice(0, 2).map((contact) => (
                    <TrustedContactCard
                      key={contact.id}
                      contact={contact}
                      onEdit={() => router.push('/contacts')}
                      onDelete={() => router.push('/contacts')}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 space-y-3 bg-white rounded-2xl border-2 border-[#FFCCE1] p-5 shadow-xs">
                  <Users className="w-10 h-10 text-[#FF5C8A]/50 mx-auto animate-bounce" />
                  <div>
                    <p className="font-black text-xs text-[#2A0826]">
                      No Trusted Guardians Added Yet
                    </p>
                    <p className="text-[11px] text-[#684E67] font-bold mt-0.5">
                      Add up to 5 guardians to receive instant siren alerts.
                    </p>
                  </div>
                  <Link
                    href="/contacts"
                    className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_4px_16px_rgba(255,42,109,0.3)] hover:scale-105 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD FIRST GUARDIAN</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
