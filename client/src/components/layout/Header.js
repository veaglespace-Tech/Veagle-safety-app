'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert, Radio, Users, PhoneCall,
  Info, Image as ImageIcon, UserCheck,
  LogOut, Menu, X, Crown, Command, Home, Zap
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice.js';
import { Logo3DFlip } from '../ui/Logo3DFlip.js';

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state?.auth || {});
  const { status } = useSelector((state) => state?.sos || { status: 'IDLE' });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    dispatch(logout());
    if (typeof window !== 'undefined') {
      window.location.href = '/auth?mode=login';
    } else {
      router.push('/auth?mode=login');
    }
  };

  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pricing', label: 'Pricing', icon: Zap },
    { href: '/about', label: 'About', icon: Info },
    { href: '/gallery', label: 'Gallery', icon: ImageIcon },
    { href: '/contact', label: 'Contact', icon: PhoneCall },
  ];

  const isLoggedIn = mounted && (
    Boolean(token) ||
    Boolean(user?.email) ||
    (typeof window !== 'undefined' && (
      Boolean(localStorage.getItem('tichi_token')) ||
      Boolean(localStorage.getItem('token')) ||
      Boolean(localStorage.getItem('tichi_user'))
    ))
  );

  const isSuperAdmin = mounted && user?.role === 'SUPER_ADMIN';

  const logoHref = mounted && user?.role === 'PARENT'
    ? '/parent'
    : (mounted && user?.role === 'ORGANIZATION' ? '/organization' : '/');

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1.5px solid #FFCCE1',
      boxShadow: '0 4px 20px rgba(255, 92, 138, 0.08)',
      fontFamily: 'Manrope, sans-serif',
      width: '100%',
    }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 w-full">

        {/* BRAND LOGO */}
        <Link 
          href={logoHref} 
          className="group flex items-center gap-2 no-underline shrink min-w-0 overflow-hidden"
        >
          <Logo3DFlip size={40} className="shrink-0" />
          <div style={{ lineHeight: 1.15 }} className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-[#2A0826] tracking-tight truncate">
                Sakhi Suraksha SOS
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'LIVE' ? 'bg-[#059669]' : 'bg-[#F59E0B]'} animate-pulse shrink-0`} />
              <span className="text-[9.5px] sm:text-[10px] text-[#684E67] font-extrabold truncate">
                {status === 'LIVE' ? 'Protected · GPS Active' : 'GPS Active'}
              </span>
            </div>
          </div>
        </Link>

        {/* CENTER HEADER NAVIGATION LINKS */}
        {!isLoggedIn && (
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 nav-chip-capsule overflow-x-auto scrollbar-none py-1 max-w-[60vw] lg:max-w-none shrink">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                    active
                      ? 'nav-chip-active'
                      : 'nav-chip-hover'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* RIGHT SIDE ACTIONS & MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="group flex items-center gap-1.5 bg-gradient-to-r from-[#FFF0F3] to-[#FFCCE1] border-1.5 border-[#FF5C8A] text-[#FF2A6D] text-[11px] sm:text-xs font-extrabold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer hover:bg-gradient-to-r hover:from-[#FF2A6D] hover:to-[#E01A4F] hover:text-white hover:border-transparent transition-all duration-300 shadow-xs hover:shadow-md active:scale-95 shrink-0"
                title="Sign Out"
              >
                <span className="tracking-wide">Sign Out</span>
                <LogOut size={13} className="group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/auth?mode=register"
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-[10.5px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer shadow-[0_4px_16px_rgba(255,42,109,0.35)] hover:shadow-[0_8px_25px_rgba(255,42,109,0.55)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/40 uppercase tracking-wider shrink-0"
              >
                <Zap size={13} className="animate-pulse text-white shrink-0" />
                <span className="tracking-wide">Protect Now</span>
              </Link>

              <Link 
                href="/auth?mode=login" 
                className="group hidden md:flex items-center gap-2 bg-gradient-to-r from-[#FFF0F3] via-[#FFE6EE] to-[#FFCCE1] border-1.5 border-[#FF5C8A] text-[#2A0826] text-xs font-extrabold px-4 py-2 rounded-full hover:bg-gradient-to-r hover:from-[#FF5C8A] hover:to-[#FF2A6D] hover:text-white hover:border-transparent transition-all duration-300 shadow-xs hover:shadow-md active:scale-95 shrink-0"
              >
                <span className="tracking-wide">Sign In</span>
                <UserCheck size={14} className="text-[#FF2A6D] group-hover:text-white group-hover:scale-110 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
              </Link>
            </div>
          )}

          {/* MOBILE MENU TOGGLE BUTTON (ONLY FOR PUBLIC GUESTS) */}
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] flex items-center justify-center text-[#FF5C8A] cursor-pointer hover:bg-[#FF5C8A] hover:text-white transition-all duration-300 shadow-sm shrink-0"
              aria-label="Toggle navigation menu"
            >
              <div className={`transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE COLLAPSED MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-1.5 border-[#FFCCE1] bg-white/99 p-3.5 shadow-2xl animate-fade-up">
          {!isLoggedIn ? (
            <>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 p-3 rounded-xl text-xs font-black mb-1.5 transition-all duration-200 ${
                    isActive(href)
                      ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md shadow-[#FF5C8A]/30'
                      : 'bg-[#FFF0F3] text-[#2A0826] hover:bg-white hover:text-[#FF5C8A]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}

              <Link
                href="/auth?mode=login"
                className="flex items-center justify-center gap-2.5 w-full p-3 rounded-xl text-xs font-black border-1.5 border-[#FFCCE1] bg-white text-[#2A0826] hover:bg-[#FF5C8A] hover:text-white transition-all duration-200 mt-2 shadow-sm"
              >
                <UserCheck size={16} />
                <span>Sign In</span>
              </Link>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                href={isSuperAdmin ? '/admin' : '/dashboard'}
                className="flex items-center gap-3 p-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md shadow-[#FF5C8A]/30"
              >
                <Home size={16} />
                <span>{isSuperAdmin ? 'Admin HQ Command' : 'My Safety Dashboard'}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2.5 w-full p-3 rounded-xl text-xs font-black border-1.5 border-[#FFCCE1] bg-[#FFF0F3] text-[#FF2A6D] hover:bg-[#FF2A6D] hover:text-white transition-all duration-200 mt-2 shadow-sm"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
