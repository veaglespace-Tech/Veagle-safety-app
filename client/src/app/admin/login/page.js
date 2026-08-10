'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../../redux/slices/authSlice.js';
import { PublicNavbar } from '../../../components/layout/PublicNavbar.js';
import { Footer } from '../../../components/layout/Footer.js';
import { Logo3DFlip } from '../../../components/ui/Logo3DFlip.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, 
  Zap, Sparkles, KeyRound, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { AnimatedHeading } from '../../../components/common/AnimatedHeading.jsx';

export default function SuperAdminLoginPage() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state?.auth || {});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState(null);
  const router = useRouter();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter Super Admin credentials.');
      return;
    }

    try {
      const res = await dispatch(loginUser({ email: email.trim(), password, isAdminLogin: true })).unwrap();
      if (res.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        setLocalError('Access denied. SuperAdmin privileges required.');
      }
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : err?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans flex flex-col justify-between relative overflow-hidden">
      <PublicNavbar />

      {/* BACKGROUND ANIMATED AMBIENT GLOW MESHES */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-140px] left-[-240px] pointer-events-none animate-pulse" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[60px] right-[-220px] pointer-events-none animate-pulse" />

      {/* MAIN CENTER CONTENT AREA */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16 relative z-10">
        <div className="w-full max-w-md space-y-6">

          {/* TOP EMBLEM & HEADER */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            
            {/* ROTATING 3D EMBLEM */}
            <div className="relative flex items-center justify-center mb-1">
              <div className="absolute -inset-3 rounded-2xl bg-[#FF5C8A]/20 animate-pulse blur-lg" />
              <div className="relative z-10 p-3 rounded-2xl bg-white border-1.5 border-[#FFCCE1] shadow-md flex items-center justify-center">
                <Logo3DFlip size={48} />
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#FFCCE1] px-3.5 py-1 rounded-full text-[10px] font-black text-[#FF2A6D] uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3 h-3 text-[#FF5C8A] animate-pulse" />
              <span>HQ Operations Clearance Required</span>
            </div>

            <AnimatedHeading as="h1" variant="shimmer" className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              <span className="heading-gradient-hero">Super Admin </span>
              <span className="heading-highlight-pill">HQ Portal</span>
            </AnimatedHeading>

            <p className="text-xs text-[#684E67] font-bold max-w-xs leading-relaxed">
              Restricted high-priority access for emergency dispatch and control operations.
            </p>
          </div>

          {/* ANTIQUE GLASSMORPHIC LOGIN FORM CARD */}
          <div className="bg-white/95 backdrop-blur-2xl border-2 border-[#FFCCE1] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(255,92,138,0.18)] hover:shadow-[0_25px_70px_rgba(255,42,109,0.25)] transition-all duration-500 relative overflow-hidden">
            
            {/* TOP DECORATIVE ACCENT GRADIENT STRIP */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

            {(error || localError) && (
              <div className="bg-[#FFF0F3] border border-[#FF2A6D] text-[#FF2A6D] text-xs font-black p-3.5 rounded-2xl text-center flex items-center justify-center space-x-2 shadow-sm animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error || localError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-5">
              
              {/* EMAIL FIELD */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#2A0826] flex items-center justify-between">
                  <span>SUPER ADMIN EMAIL</span>
                  <Mail className="w-3.5 h-3.5 text-[#FF2A6D]" />
                </label>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#FF2A6D]">
                    <Mail className="w-4 h-4" />
                  </div>
                  
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@veaglesafety.org"
                    required
                    className="w-full bg-[#FFF0F3]/60 focus:bg-white border-1.5 border-[#FFCCE1] rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-[#2A0826] placeholder-[#684E67]/60 focus:outline-none focus:border-[#FF2A6D] focus:ring-4 focus:ring-[#FF5C8A]/15 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#2A0826] flex items-center justify-between">
                  <span>SECRET ACCESS KEY</span>
                  <KeyRound className="w-3.5 h-3.5 text-[#FF2A6D]" />
                </label>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#FF2A6D]">
                    <Lock className="w-4 h-4" />
                  </div>
                  
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#FFF0F3]/60 focus:bg-white border-1.5 border-[#FFCCE1] rounded-2xl py-3 pl-10 pr-10 text-xs font-bold text-[#2A0826] placeholder-[#684E67]/60 focus:outline-none focus:border-[#FF2A6D] focus:ring-4 focus:ring-[#FF5C8A]/15 transition-all shadow-sm font-mono"
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#684E67] hover:text-[#FF2A6D] transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3D GRADIENT SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-[0_8px_25px_rgba(255,42,109,0.35)] hover:shadow-[0_12px_35px_rgba(255,42,109,0.50)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-2.5 cursor-pointer border border-white/20 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>VERIFYING CLEARANCE...</span>
                  </div>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white animate-pulse" />
                    <span>AUTHORIZE SUPER ADMIN ACCESS</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>

            {/* BACK TO MAIN WEBSITE LINK */}
            <div className="pt-2 text-center border-t border-[#FFCCE1]">
              <Link
                href="/"
                className="text-xs font-bold text-[#684E67] hover:text-[#FF2A6D] transition-colors inline-flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Website</span>
              </Link>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
