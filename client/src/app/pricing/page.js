'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Footer } from '../../components/layout/Footer.js';
import { fetchPlans } from '../../redux/slices/planSlice.js';
import { Logo3DFlip } from '../../components/ui/Logo3DFlip.js';
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  Sparkles,
  Radio,
  MapPin,
  Users,
  Volume2,
  Headphones,
  Lock,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PlatformPricingPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { plans = [] } = useSelector((state) => state.plan || {});
  const { token, registrationToken, user } = useSelector((state) => state.auth || {});

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  const activePlans = plans.filter((p) => p.isActive !== false);

  const fallbackPlans = [
    {
      id: 'plan_yearly_24',
      name: 'Sakhi 365 Safety Pass',
      description: 'Full 365 days of 24/7 Encrypted SOS & Live GPS Guardian Network.',
      basePrice: 24,
      gstPercentage: 18,
      durationDays: 365,
    },
  ];

  const displayPlans = activePlans.length > 0 ? activePlans : fallbackPlans;

  const handleSelectPlan = (planId) => {
    const hasRegToken =
      registrationToken ||
      (typeof window !== 'undefined' && localStorage.getItem('tichi_reg_token'));
    if (!token && !hasRegToken && !user) {
      router.push('/auth?mode=register');
      return;
    }
    router.push(`/checkout?planId=${planId}`);
  };

  const features = [
    '3-Second Hold Instant SOS',
    '5 Guardian Alerts (SMS & Push)',
    'Encrypted Real-Time Live GPS Sharing',
    'High-Decibel Emergency Siren',
    'Direct 112 & 1091 Helpline Access',
    '24/7 Live Command Support',
  ];

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden flex flex-col">
      <PublicNavbar />

      {/* AMBIENT BACKGROUND GLOW MESHES */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#FF5C8A]/10 blur-[150px] top-[-100px] left-[-200px] pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#FFCCE1]/20 blur-[150px] bottom-[50px] right-[-200px] pointer-events-none" />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 space-y-8 relative z-10 w-full">
        {/* HEADER SECTION - CRISP & UNCLUTTERED */}
        <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white border-1.5 border-[#FFCCE1] px-4 py-1.5 rounded-full text-xs font-black text-[#FF2A6D] uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5C8A]" />
            <span>Official Protection Plans</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            <span className="heading-gradient-hero">Simple, Transparent </span>
            <span className="heading-gradient-rose">Safety Pricing</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#684E67] font-bold">
            Activate 24/7 Encrypted GPS Tracking & Emergency Guardian Dispatch
          </p>
        </div>

        {/* DYNAMIC REVAMPED PLAN CARDS GRID */}
        <div
          className={`w-full ${
            displayPlans.length === 1
              ? 'max-w-md mx-auto'
              : displayPlans.length === 2
                ? 'max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8'
                : 'max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
          }`}
        >
          {displayPlans.map((plan) => {
            const basePrice = Number(plan.basePrice || 0);
            const isFree = basePrice === 0;
            const durationDays = plan.durationDays || 365;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-[36px] border-2 border-[#FFCCE1] hover:border-[#FF2A6D] p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group"
              >
                {/* TOP ACCENT LINE */}
                <div
                  className={`absolute top-0 left-0 right-0 h-2 ${
                    isFree
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-600'
                      : 'bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]'
                  }`}
                />

                <div className="space-y-6">
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div>
                      <h2 className="text-xl font-black text-[#2A0826] tracking-tight group-hover:text-[#FF2A6D] transition-colors">
                        {plan.name}
                      </h2>
                      <p className="text-xs text-[#684E67] font-bold mt-1">
                        {plan.description || 'Full 24/7 Emergency Protection Pass'}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] flex items-center justify-center shrink-0 shadow-xs">
                      <Logo3DFlip size={32} />
                    </div>
                  </div>

                  {/* LUXURY PRICE BOX */}
                  <div className="bg-[#FFF0F3] p-5 rounded-3xl border border-[#FFCCE1] flex items-center justify-between shadow-inner">
                    <div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl sm:text-4xl font-black text-[#2A0826]">
                          ₹{basePrice}
                        </span>
                        <span className="text-xs text-[#684E67] font-extrabold">
                          /{durationDays} Days
                        </span>
                      </div>
                      <p className="text-[10px] text-[#684E67] font-extrabold mt-0.5">
                        {isFree
                          ? 'Zero Charges'
                          : `₹${(basePrice / 12).toFixed(1)}/month equivalent`}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border shadow-xs ${
                        isFree
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-[#FF2A6D] border-[#FFCCE1]'
                      }`}
                    >
                      {isFree
                        ? '100% FREE'
                        : plan.gstPercentage === 0
                        ? '0% GST'
                        : `+ ${
                            plan.gstPercentage !== undefined &&
                            plan.gstPercentage !== null &&
                            !isNaN(Number(plan.gstPercentage))
                              ? plan.gstPercentage
                              : 18
                          }% GST`}
                    </span>
                  </div>

                  {/* CLEAN FEATURE LIST */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[10px] font-black text-[#FF2A6D] uppercase tracking-wider block">
                      Included Protection Features:
                    </span>

                    <div className="space-y-2.5">
                      {(plan.features && plan.features.length > 0 ? plan.features : features).map(
                        (featureText, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2.5 text-xs font-bold text-[#2A0826]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#FF2A6D] shrink-0" />
                            <span>{featureText}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isFree
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white shadow-[#FF2A6D]/30'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>{isFree ? 'ACTIVATE FREE PASS NOW' : 'ACTIVATE PROTECTION NOW'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
