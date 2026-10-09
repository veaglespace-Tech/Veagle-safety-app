'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicNavbar } from '../../../components/layout/PublicNavbar.js';
import { Footer } from '../../../components/layout/Footer.js';
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Copy, Check, Lock } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { fetchUser } from '../../../redux/slices/authSlice.js';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const txnid = searchParams.get('txnid') || 'VEAGLE_1785845316092_770';
  const planName = searchParams.get('plan') || 'Sakhi Suraksha 365 Yearly Plan';
  const amount = searchParams.get('amount') || '28.32';

  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchUser());

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (countdown === 0) {
      router.push('/dashboard');
    }
  }, [countdown, router]);

  const handleCopyTxn = () => {
    navigator.clipboard.writeText(txnid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden flex flex-col justify-between">
      <PublicNavbar />

      {/* AMBIENT MESH GLOWS */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#FF5C8A]/15 blur-[160px] top-[-100px] left-[-200px] pointer-events-none" />
      <div className="absolute w-[700px] h-[700px] rounded-full bg-emerald-400/15 blur-[160px] bottom-[100px] right-[-200px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[40px] p-6 sm:p-10 border-2 border-[#FFCCE1] shadow-[0_25px_60px_rgba(42,8,38,0.12)] space-y-6 text-center animate-fade-up relative overflow-hidden">
          {/* TOP AMBIENT ACCENT BAR */}
          <div className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-emerald-500 h-2.5 w-full absolute top-0 left-0 right-0" />

          {/* 3D SUCCESS ANIMATED ICON DOCK */}
          <div className="relative w-24 h-24 mx-auto pt-2">
            <div className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" />
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 border-4 border-white relative z-10 transform hover:scale-105 transition-transform">
              <CheckCircle2 className="w-11 h-11 text-white stroke-[2.5]" />
            </div>
          </div>

          {/* TITLE & BADGE */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 border-1.5 border-emerald-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>PAYMENT SUCCESSFUL & PROTECTION ACTIVE</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#2A0826] tracking-tight">
              Thank You for Registering!
            </h1>

            <p className="text-xs text-[#684E67] font-bold leading-relaxed max-w-md mx-auto">
              Your PayU transaction has been completed and your 365-day safety protection is now
              fully activated in the system.
            </p>
          </div>

          {/* ULTRA-MODERN RECEIPT / TRANSACTION CARD */}
          <div className="bg-gradient-to-br from-[#FFF0F3]/80 via-white to-[#FFF0F3]/80 p-5 sm:p-6 rounded-3xl border-2 border-[#FFCCE1] text-xs font-extrabold space-y-3 text-left shadow-xs">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#FFCCE1]">
              <span className="text-[#684E67] font-bold">Transaction ID:</span>
              <button
                type="button"
                onClick={handleCopyTxn}
                className="inline-flex items-center space-x-1.5 font-mono text-[#FF2A6D] bg-white px-3 py-1 rounded-xl border border-[#FFCCE1] hover:border-[#FF2A6D] transition-all cursor-pointer group shrink-0"
                title="Copy Transaction ID"
              >
                <span className="font-black text-[11px] sm:text-xs truncate max-w-[170px] sm:max-w-[220px]">
                  {txnid}
                </span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#FF2A6D] group-hover:scale-110" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#684E67] font-bold">Activated Plan:</span>
              <span className="font-black text-[#2A0826]">{planName}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#684E67] font-bold">Amount Paid (Inc. GST):</span>
              <span className="font-mono text-[#FF2A6D] font-black text-base sm:text-lg">
                ₹{amount}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-[#FFCCE1] pt-3">
              <span className="text-[#684E67] font-bold">Protection Status:</span>
              <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ACTIVE (365 DAYS)</span>
              </span>
            </div>
          </div>

          {/* COUNTDOWN & CTA BUTTON BOX */}
          <div className="bg-[#FFF0F3] border-2 border-[#FFCCE1] p-5 rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#684E67]">
              <span>Navigating to Dashboard:</span>
              <span className="font-mono font-black text-[#FF2A6D] text-sm bg-white px-2.5 py-0.5 rounded-lg border border-[#FFCCE1]">
                {countdown}s
              </span>
            </div>

            <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#FFCCE1]">
              <div
                className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 rounded-2xl shadow-lg shadow-[#FF2A6D]/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-white/20"
            >
              <span>GO TO DASHBOARD NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center font-bold text-[#FF2A6D]">
          Loading Success Page...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
