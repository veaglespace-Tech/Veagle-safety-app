'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUser } from '../../redux/slices/authSlice.js';
import { fetchPlans } from '../../redux/slices/planSlice.js';
import { AppLayout } from '../../components/layout/AppLayout.js';
import Link from 'next/link';
import {
  ShieldCheck,
  Crown,
  Calendar,
  Clock,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
  CreditCard,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state?.auth || {});
  const { plans = [] } = useSelector((state) => state?.plan || {});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchUser());
    dispatch(fetchPlans());
  }, [dispatch]);

  const isActive = mounted && user?.subscriptionStatus === 'ACTIVE';

  // Dates calculation
  const createdDate =
    mounted && user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '01 Aug 2026';

  const expiryDate =
    mounted && user?.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '01 Aug 2027';

  const activePlan = plans[0] || {};
  const basePrice = activePlan.basePrice !== undefined ? Number(activePlan.basePrice) : 24.0;
  const gstRate =
    activePlan.gstPercentage !== undefined && activePlan.gstPercentage !== null && !isNaN(Number(activePlan.gstPercentage))
      ? Number(activePlan.gstPercentage)
      : 18.0;
  const totalAmount =
    activePlan.totalPrice !== undefined && activePlan.totalPrice !== null && !isNaN(Number(activePlan.totalPrice))
      ? Number(activePlan.totalPrice)
      : Number((basePrice + (basePrice * gstRate) / 100).toFixed(2));
  const gstAmount = Number(((basePrice * gstRate) / 100).toFixed(2));

  return (
    <AppLayout>
      <div className="bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden">
        {/* BACKGROUND AMBIENT GLOW MESHES */}
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/15 blur-[160px] top-[-100px] left-[-200px] pointer-events-none" />
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[#E6A100]/15 blur-[160px] bottom-[100px] right-[-200px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 relative z-10 space-y-6 animate-fade-up">
          {/* PAGE TITLE BANNER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border-2 border-[#FFCCE1] shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] text-white flex items-center justify-center shadow-md shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-xl sm:text-2xl tracking-tight">
                  <span className="heading-gradient-hero">Subscription & </span>
                  <span className="heading-gradient-rose">Plan Status</span>
                </h1>
                <p className="text-xs font-bold text-[#684E67] mt-0.5">
                  Manage your active 24/7 emergency protection plan & coverage validity
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RENEW / UPGRADE PLAN</span>
            </Link>
          </div>

          {/* MASTER ACTIVE PLAN CARD */}
          <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white border-2 border-[#FFCCE1] shadow-[0_16px_50px_rgba(255,92,138,0.18)] rounded-[36px] overflow-hidden p-6 sm:p-8 space-y-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#FFCCE1] pb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-[#FFF0F3] text-[#FF2A6D] font-black text-[10px] uppercase px-3 py-1 rounded-full border border-[#FFCCE1]">
                    365-Day Unlimited Protection
                  </span>
                  <span
                    className={`font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center space-x-1 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                        : 'bg-amber-50 text-amber-600 border border-amber-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'} inline-block mr-1`}
                    />
                    {isActive ? 'Active Plan' : 'Pending Activation'}
                  </span>
                </div>
                <h2 className="font-black text-2xl sm:text-3xl text-[#2A0826] mt-2 tracking-tight">
                  Sakhi Suraksha 365 Protection Plan
                </h2>
              </div>

              <div className="text-right sm:text-right">
                <p className="text-xs font-black text-[#684E67] uppercase tracking-wider">
                  Total Paid
                </p>
                <p className="text-3xl font-black text-[#FF2A6D] tracking-tight mt-0.5">
                  ₹{totalAmount.toFixed(2)}{' '}
                  <span className="text-xs font-bold text-[#684E67]">/ year</span>
                </p>
                <p className="text-[10px] font-bold text-[#684E67] mt-0.5">
                  {gstRate === 0
                    ? `Includes ₹${basePrice.toFixed(2)} Base (0% GST)`
                    : `Includes ₹${basePrice.toFixed(2)} Base + ${gstRate}% GST (₹${gstAmount.toFixed(2)})`}
                </p>
              </div>
            </div>

            {/* VALIDITY PERIOD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-[#FFCCE1] shadow-xs space-y-1">
                <div className="flex items-center space-x-2 text-[#FF2A6D]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Start Date</span>
                </div>
                <p className="font-black text-base text-[#2A0826]">{createdDate}</p>
                <p className="text-[10px] font-bold text-[#684E67]">Plan Activated</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#FFCCE1] shadow-xs space-y-1">
                <div className="flex items-center space-x-2 text-[#FF2A6D]">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Expiry Date</span>
                </div>
                <p className="font-black text-base text-[#2A0826]">{expiryDate}</p>
                <p className="text-[10px] font-bold text-[#684E67]">Valid for 365 Days</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-[#FFCCE1] shadow-xs space-y-1">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Coverage</span>
                </div>
                <p className="font-black text-base text-emerald-600">24/7 Active</p>
                <p className="text-[10px] font-bold text-[#684E67]">Full Guard Network Enabled</p>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="space-y-2 bg-white p-5 rounded-2xl border-2 border-[#FFCCE1] shadow-xs">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#2A0826]">Annual Subscription Validity Status</span>
                <span className="text-[#FF2A6D]">365 / 365 Days Active</span>
              </div>
              <div className="w-full bg-[#FFF0F3] h-3.5 rounded-full overflow-hidden border border-[#FFCCE1] p-0.5">
                <div className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] h-full rounded-full w-full animate-pulse" />
              </div>
            </div>

            {/* INCLUDED FEATURES SUMMARY LIST */}
            <div className="space-y-3 pt-2">
              <h3 className="font-black text-sm uppercase tracking-wider text-[#FF2A6D]">
                Included Plan Features & Benefits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  '24/7 Unlimited One-Tap Emergency SOS Broadcast',
                  'Encrypted Live GPS Location Tracking & Map Sharing',
                  'Instant Multi-Channel Guardian Alerts (SMS, Email, App)',
                  'Loud Siren Audio Alarm & Device Vibration Drill',
                  '5 Verified Emergency Trusted Guardians Network',
                  'SuperAdmin Emergency Command Center Monitoring',
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 bg-white p-3 rounded-xl border border-[#FFCCE1] text-xs font-bold text-[#2A0826]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
