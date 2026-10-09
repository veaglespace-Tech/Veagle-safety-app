'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowRight, Sparkles, Compass, Crown, ExternalLink } from 'lucide-react';
import { Logo3DFlip } from '../ui/Logo3DFlip.js';

export const SuperAdminQuickJump = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const reduxRole = useSelector((state) => state?.auth?.user?.role);
  const reduxToken = useSelector((state) => state?.auth?.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  let isSuperAdmin = false;
  let hasToken = false;

  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('tichi_token');
    const localUserRaw = localStorage.getItem('tichi_user');
    let localRole = null;
    try {
      if (localUserRaw) {
        const parsed = JSON.parse(localUserRaw);
        localRole = parsed?.role;
      }
    } catch (e) {}

    hasToken = Boolean(localToken || reduxToken);
    isSuperAdmin = reduxRole === 'SUPER_ADMIN' || localRole === 'SUPER_ADMIN';
  }

  const isLoginPage =
    pathname === '/admin/login' || pathname === '/auth' || pathname?.includes('login');
  if (isLoginPage) return null;

  const isAdminPage = pathname === '/admin';

  // Show button only on /admin dashboard or when Super Admin is logged in
  if (!isAdminPage && (!isSuperAdmin || !hasToken)) {
    return null;
  }

  const targetHref = isAdminPage ? '/' : '/admin';
  const targetTitle = isAdminPage ? 'Switch to Main Website' : 'Super Admin';
  const targetDesc = isAdminPage
    ? 'Explore Public Landing Page & Safety Features'
    : 'Access Operations & Dispatch Control Center';

  return (
    <div className="w-full flex flex-col items-center justify-center my-8 text-center px-4 font-sans relative z-20">
      {/* ULTRA-MODERN 3D ACTION CARD */}
      <Link
        href={targetHref}
        className="group relative inline-flex items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-white via-[#FFF0F3] to-white border-2 border-[#FFCCE1] hover:border-[#FF2A6D] rounded-full px-5 sm:px-7 py-3 sm:py-3.5 shadow-[0_10px_35px_rgba(255,92,138,0.20)] hover:shadow-[0_16px_45px_rgba(255,42,109,0.38)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 cursor-pointer max-w-lg w-full"
        title={targetTitle}
      >
        {/* TOP GLOW SHIMMER LINE */}
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#FF2A6D] to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* LEFT LOGO & BADGE */}
        <div className="flex items-center shrink-0">
          <Logo3DFlip size={36} />
        </div>

        {/* CENTER CONTENT */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center space-x-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2A6D] animate-pulse" />
            <span className="text-[10px] font-black uppercase text-[#FF2A6D] tracking-widest">
              Quick Navigation
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-black text-[#2A0826] group-hover:text-[#FF2A6D] tracking-tight truncate transition-colors">
            {targetTitle}
          </h4>

          <p className="text-[10px] sm:text-[11px] font-extrabold text-[#684E67] truncate">
            {targetDesc}
          </p>
        </div>

        {/* RIGHT ACTION BUTTON */}
        <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(255,42,109,0.35)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
};

export default SuperAdminQuickJump;
