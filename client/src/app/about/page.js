'use client';

import React from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Footer } from '../../components/layout/Footer.js';
import {
  Shield,
  Heart,
  Lock,
  Award,
  Users,
  Globe,
  Zap,
  Radio,
  CheckCircle2,
  ArrowRight,
  Activity,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedHeading } from '../../components/common/AnimatedHeading.jsx';
import { MagneticButton } from '../../components/ui/MagneticButton.js';

export const dynamic = 'force-dynamic';

export default function AboutUsPage() {
  const pillars = [
    {
      icon: Radio,
      title: '3-Second Ultra-Fast SOS Broadcast',
      description:
        'Engineered for extreme emergency speed. Pressing the SOS trigger broadcasts your precise GPS location to 5 trusted guardians within sub-seconds.',
      badge: 'SUB-SECOND RESPONSE',
    },
    {
      icon: Lock,
      title: 'Privacy-First Encrypted Architecture',
      description:
        'Your location data is encrypted and strictly private. It is shared ONLY during active SOS emergencies or explicitly authorized journey tracking.',
      badge: 'ZERO DATA TRADING',
    },
    {
      icon: Shield,
      title: '24/7 Command & Dispatch Monitoring',
      description:
        'Integrated with national helplines (112, 1091, 181) to ensure continuous monitoring and emergency escalation.',
      badge: '24/7 COMMAND ONLINE',
    },
    {
      icon: Award,
      title: 'Production-Grade High Reliability',
      description:
        'Powered by Node.js, Express, Socket.IO, MySQL, and Redux Toolkit for maximum uptime and zero latency during critical moments.',
      badge: 'ENTERPRISE TECH STACK',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden">
      <PublicNavbar />

      {/* BACKGROUND AMBIENT GLOW MESHES */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-140px] left-[-240px] pointer-events-none" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[60px] right-[-220px] pointer-events-none" />

      <section className="py-16 space-y-16 relative z-10">
        {/* HERO MISSION HEADER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 max-w-3xl">
          <AnimatedHeading
            as="h1"
            variant="shimmer"
            className="text-4xl sm:text-6xl font-black tracking-tight leading-tight"
          >
            <span className="heading-gradient-hero">Built to </span>
            <span className="heading-highlight-pill">Shield & Empower</span> <br />
            <span className="heading-gradient-rose">Every Girl and Woman</span>
          </AnimatedHeading>

          <p className="text-[#684E67] text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
            Sakhi Suraksha SOS was created to combine cutting-edge technology with compassionate
            design—ensuring help is always 3 seconds away when it matters most.
          </p>
        </div>

        {/* FULLSCREEN WIDTH STATS HIGHLIGHT BAR (FULL BLEED SCREEN WIDTH) */}
        <div className="w-full bg-white/95 backdrop-blur-xl border-y-1.5 border-[#FFCCE1] py-10 shadow-[0_10px_35px_rgba(255,92,138,0.12)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-black text-[#FF2A6D]">100%</div>
              <div className="text-xs text-[#684E67] font-black uppercase tracking-wider">
                Encrypted Privacy
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-black text-[#FF5C8A]">&lt; 3 Sec</div>
              <div className="text-xs text-[#684E67] font-black uppercase tracking-wider">
                Broadcast Speed
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-black text-[#FF2A6D]">24 / 7</div>
              <div className="text-xs text-[#684E67] font-black uppercase tracking-wider">
                Command Operations
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-5xl font-black text-[#FF5C8A]">5 Contacts</div>
              <div className="text-xs text-[#684E67] font-black uppercase tracking-wider">
                Parallel Alerts
              </div>
            </div>
          </div>
        </div>

        {/* 4 CORE ARCHITECTURAL PILLARS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#2A0826]">
              The 4 Pillars of Sakhi Suraksha SOS
            </h2>
            <p className="text-xs text-[#684E67] font-bold">
              Engineering excellence dedicated to non-compromised personal safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl space-y-5 border-1.5 border-[#FFCCE1] hover:border-[#FF5C8A] shadow-[0_10px_30px_rgba(255,92,138,0.10)] hover:shadow-[0_16px_40px_rgba(255,92,138,0.22)] transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFF0F3] to-[#FFCCE1] text-[#FF2A6D] flex items-center justify-center border-1.5 border-[#FF5C8A] shadow-sm">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-[#FFF0F3] text-[#FF2A6D] border-1.5 border-[#FF5C8A]">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-[#684E67] leading-relaxed font-bold">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CALL TO ACTION BOTTOM BANNER WITH MAGNETIC BUTTON */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-12 text-center space-y-6 rounded-3xl border-1.5 border-[#FFCCE1] shadow-[0_12px_40px_rgba(255,92,138,0.14)] relative overflow-hidden">
            {/* ACCENT GLOW STRIP */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-[#2A0826]">
                Join Sakhi Suraksha SOS Today
              </h2>
              <p className="text-xs sm:text-sm text-[#684E67] font-bold max-w-xl mx-auto leading-relaxed">
                Get complete 365-day emergency protection for just ₹24/year (only ₹2/month). Instant
                registration in under 2 minutes.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Link
                href="/auth?mode=register"
                className="btn-3d-rose-pop px-9 py-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-3 whitespace-nowrap"
              >
                <span>START YOUR 365-DAY PROTECTION</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
