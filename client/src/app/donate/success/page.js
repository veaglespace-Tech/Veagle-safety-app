'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PublicNavbar } from '../../../components/layout/PublicNavbar.js';
import { Footer } from '../../../components/layout/Footer.js';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const txnid = searchParams.get('txnid');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans flex flex-col relative overflow-hidden">
      <PublicNavbar />

      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-100px] left-[-250px] pointer-events-none" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[50px] right-[-250px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border-2 border-[#FFCCE1] rounded-3xl p-8 sm:p-12 max-w-lg w-full shadow-[0_15px_40px_rgba(255,92,138,0.06)] animate-fade-up text-center space-y-6">
          
          {isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-10 h-10 text-rose-500" />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#2A0826]">
              {isSuccess ? 'Thank You for Your Donation!' : 'Donation Failed'}
            </h1>
            <p className="text-sm font-bold text-[#684E67]">
              {isSuccess 
                ? 'Your generous contribution helps us make a difference. We appreciate your support for women\'s safety.' 
                : 'Unfortunately, your payment could not be processed. Please try again or use a different payment method.'}
            </p>
          </div>

          <div className="bg-[#FFF0F3] p-4 rounded-2xl border border-[#FFCCE1] text-left">
            <p className="text-[10px] uppercase font-black text-[#684E67] tracking-wider mb-1">Transaction ID</p>
            <p className="font-mono text-sm font-bold text-[#2A0826] break-all">{txnid || 'N/A'}</p>
          </div>

          <div className="pt-4">
            <Link 
              href={isSuccess ? '/' : '/donate'}
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider shadow-[0_8px_25px_rgba(255,42,109,0.35)] hover:shadow-[0_12px_35px_rgba(255,42,109,0.50)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>{isSuccess ? 'Return to Home' : 'Try Again'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center font-bold text-[#FF2A6D]">Loading...</div>}>
      <DonationSuccessContent />
    </Suspense>
  );
}
