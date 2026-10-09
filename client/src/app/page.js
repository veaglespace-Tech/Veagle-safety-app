'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  Users,
  ArrowRight,
  ShieldCheck,
  Heart,
  MapPin,
  Bell,
  PhoneCall,
  LayoutDashboard,
  Crown,
  Sparkles,
  CheckCircle2,
  Star,
  Award,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { PublicNavbar } from '../components/layout/PublicNavbar.js';
import { Footer } from '../components/layout/Footer.js';
import { Logo3DFlip } from '../components/ui/Logo3DFlip.js';
import { HeroBannerCarousel } from '../components/ui/HeroBannerCarousel.js';
import { Feature3DCard } from '../components/ui/Feature3DCard.js';
import { api } from '../utils/api.js';

export default function LandingPage() {
  const { token, user } = useSelector((state) => state?.auth || {});
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ 
    registeredUsers: 0, 
    fakeBaseCount: 3472, 
    targetMissionCount: '1 Cr+' 
  });

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/public');
      if (res.data) {
        setStats({ 
          registeredUsers: res.data.registeredUsers !== undefined ? res.data.registeredUsers : 0,
          fakeBaseCount: res.data.fakeBaseCount !== undefined ? res.data.fakeBaseCount : 3472,
          targetMissionCount: res.data.targetMissionCount || '1 Cr+'
        });
      }
    } catch (err) {
      console.error('Failed to fetch public stats', err);
    }
  };

  const isLoggedIn =
    mounted && (token || (typeof window !== 'undefined' && localStorage.getItem('tichi_token')));
  const isSuperAdmin = mounted && user?.role === 'SUPER_ADMIN';
  const displayName =
    mounted && (user?.fullName || user?.name) ? user.fullName || user.name : 'Sakhi Member';

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden">
      <PublicNavbar />

      {/* BACKGROUND AMBIENT GLOW MESHES */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-140px] left-[-240px] pointer-events-none" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[60px] right-[-220px] pointer-events-none" />

      {/* TOP NOTIFICATION BANNER */}
      {isLoggedIn && (
        <div className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-center py-3 px-4 relative z-10 shadow-[0_4px_20px_rgba(255,92,138,0.3)]">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap text-xs font-black">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span>
                Welcome Back, <strong className="text-[#FFE600] font-black">{displayName}</strong>!
                Active Protection Enabled.
              </span>
            </div>
            <Link
              href={isSuperAdmin ? '/admin' : '/dashboard'}
              className="inline-flex items-center gap-1.5 bg-white text-[#FF2A6D] px-3.5 py-1 rounded-full text-[11px] font-black text-decoration-none shadow-sm hover:bg-[#FFF0F3] transition-all"
            >
              {isSuperAdmin ? <Crown size={13} /> : <LayoutDashboard size={13} />}
              <span>{isSuperAdmin ? 'Go to Admin Panel' : 'Go to Dashboard'}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION WITH DIRECT AUTO-SCROLLING HERO BANNER */}
      <section className="relative z-10 pt-6 sm:pt-10 pb-6 px-4 sm:px-6 lg:px-8 text-center space-y-8">
        
        {/* HERO BANNER WITH FLOATING STATS */}
        <div className="grid grid-cols-2 lg:flex lg:flex-row items-stretch lg:items-center justify-center gap-3 sm:gap-6 lg:gap-8 max-w-[1400px] mx-auto w-full">
           
           {/* Center: Image */}
           <div className="col-span-2 lg:col-auto order-1 lg:order-2 flex-[2] w-full max-w-3xl mx-auto flex items-center justify-center">
             <HeroBannerCarousel />
           </div>

           {/* Left side: Stats */}
           <div className="col-span-1 lg:col-auto order-2 lg:order-1 flex-1 flex flex-col items-center lg:items-end w-full">
             <div className="bg-white p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(255,42,109,0.2)] border border-[#FFCCE1]/30 w-full max-w-[340px] relative text-center flex flex-col items-center h-full lg:h-[380px] justify-center">
               <div className="absolute top-3 right-3 sm:top-6 sm:right-6 bg-[#FFF0F3] w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
                 <ShieldCheck className="text-[#FF2A6D] w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2.5} />
               </div>
               
               <div className="mt-4 sm:mt-12 flex flex-col items-center justify-center">
                 <h3 className="text-[10px] sm:text-xl font-black text-[#FF2A6D] tracking-widest mb-1 sm:mb-2">WOMEN SAFE</h3>
                 <p className="text-3xl sm:text-[80px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FF2A6D] to-[#FF5C8A] leading-none mb-1 sm:mb-3 tracking-tighter">
                    {((stats?.fakeBaseCount || 3472) + (stats?.registeredUsers || 0)).toLocaleString()}
                 </p>
                 <p className="text-[8px] sm:text-xs font-black text-[#7A6478] uppercase tracking-widest opacity-90 bg-[#FFF0F3] px-2 py-1 rounded-full w-[max-content]">ACTIVE GUARDIANS</p>
               </div>
             </div>
           </div>

           {/* Right side: Goal text */}
           <div className="col-span-1 lg:col-auto order-3 lg:order-3 flex-1 flex flex-col items-center lg:items-start w-full">
             <div className="bg-gradient-to-br from-[#FA2E6E] to-[#E61B5C] text-white p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(250,46,110,0.45)] w-full max-w-[340px] text-center sm:text-left h-full lg:h-[380px] flex flex-col justify-center items-center sm:items-start">
               <h3 className="text-4xl sm:text-[96px] font-black leading-[0.85] mb-2 sm:mb-6 tracking-tighter">{stats?.targetMissionCount || '1 Cr+'}</h3>
               <p className="text-[11px] sm:text-[36px] font-black leading-[1.05] mb-3 sm:mb-10 tracking-tight text-white/95">
                 Women To<br className="hidden sm:block" />Protect
               </p>
               <div className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-white/20 px-2.5 sm:px-5 py-1 sm:py-2.5 rounded-full text-[8px] sm:text-sm font-black uppercase tracking-widest w-[max-content]">
                 <Heart className="text-white fill-white w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                 <span>Our Mission</span>
               </div>
             </div>
           </div>
        </div>

        {/* MAIN TITLE */}
        <h1 className="heading-gradient-hero text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-tight max-w-5xl mx-auto">
          Sakhi Suraksha <span className="heading-highlight-pill">SOS</span>
        </h1>

        <p className="text-[#684E67] text-base sm:text-xl font-bold max-w-xl mx-auto leading-relaxed">
          A modern personal safety companion for girls & women — instant emergency alerts, live GPS
          tracking, and 24/7 command dispatch.
        </p>

        {/* MARQUEE STRIP (FULL SCREEN WIDTH & LIVE CONTINUOUS SCROLLING) */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-white/95 border-y-1.5 border-[#FFCCE1] py-3.5 overflow-hidden my-8 shadow-sm">
          <div className="animate-marquee-scroll">
            {[
              '⚡ INSTANT 3-SECOND SOS DISPATCH',
              '📍 24/7 LIVE GPS TRACKING',
              '🔔 GUARDIAN SIREN BROADCAST',
              '🛡️ 365-DAY WOMEN SAFETY',
              '⚡ INSTANT 3-SECOND SOS DISPATCH',
              '📍 24/7 LIVE GPS TRACKING',
              '🔔 GUARDIAN SIREN BROADCAST',
              '🛡️ 365-DAY WOMEN SAFETY',
              '⚡ INSTANT 3-SECOND SOS DISPATCH',
              '📍 24/7 LIVE GPS TRACKING',
              '🔔 GUARDIAN SIREN BROADCAST',
              '🛡️ 365-DAY WOMEN SAFETY',
            ].map((item, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm font-black text-[#FF2A6D] uppercase tracking-widest flex items-center gap-3"
              >
                <span>{item}</span>
                <span className="text-[#FF5C8A] font-light">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* HERO CTA BUTTONS (ONLY FOR GUEST USERS - LOGGED IN USERS USE TOP TOGGLE NAVBAR) */}
        {!isLoggedIn && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-3 px-4 w-full">
            <Link
              href="/auth?mode=register"
              className="btn-3d-rose-pop w-full sm:w-auto px-6 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 sm:gap-3 whitespace-nowrap"
            >
              <span>PROTECT YOURSELF NOW</span>
              <ArrowRight size={16} className="shrink-0" />
            </Link>

            <Link
              href="/about"
              className="btn-3d-white-pop w-full sm:w-auto px-6 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 sm:gap-2 whitespace-nowrap"
            >
              <Shield size={16} className="text-[#FF5C8A] shrink-0" />
              <span>HOW IT WORKS</span>
            </Link>
          </div>
        )}


        {/* 3 FEATURE CARDS IN 3D FLIP ARCHITECTURE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-8 text-left">
          <Feature3DCard
            icon={Zap}
            title="3-Second Emergency SOS"
            desc="Trigger loud siren & instant SMS/WhatsApp alerts with exact GPS coordinates to trusted emergency contacts."
            backTitle="⚡ Emergency SOS Features"
            badgeText="ZERO DELAY DISPATCH"
            gradient="bg-gradient-to-br from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]"
            points={[
              '📢 High-Decibel Guardian Siren Broadcast',
              '📍 Precise GPS Coordinates & Maps Link',
              '💬 One-Tap Emergency WhatsApp Alerts',
            ]}
          />

          <Feature3DCard
            icon={MapPin}
            title="Encrypted GPS Journey Tracking"
            desc="Share live movement updates securely during travel so guardians know you are safe in real time."
            backTitle="📍 Live Tracking Specs"
            badgeText="REAL-TIME TELEMETRY"
            gradient="bg-gradient-to-br from-[#FF2A6D] via-[#E01A4F] to-[#2A0826]"
            points={[
              '🛡️ AES-256 Encrypted Location Stream',
              '⏱️ 5-Minute Periodic Email Updates',
              '🗺️ Interactive Live Map Share Token',
            ]}
          />

          <Feature3DCard
            icon={Users}
            title="Trusted Guardian Circle"
            desc="Build your personal network of family & emergency guardians for automated response alerts."
            backTitle="👥 Guardian Circle Specs"
            badgeText="AUTOMATED RESPONSE"
            gradient="bg-gradient-to-br from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]"
            points={[
              '👨‍👩‍👧 Family & Parent Email Registration',
              '🔔 Multi-Device Guardian Audio Siren',
              '📱 Direct Emergency Phone Calling',
            ]}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
