'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PhoneCall,
  Info,
  Image as ImageIcon,
  UserCheck,
  LogOut,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Crown,
  Home,
  Zap,
  LayoutDashboard,
  User,
  Shield,
  Heart,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice.js';
import { Logo3DFlip } from '../ui/Logo3DFlip.js';

export const PublicNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state?.auth || {});

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logout());
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/auth?mode=login');
    } else {
      router.push('/auth?mode=login');
    }
  };

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const isSuperAdmin = mounted && user?.role === 'SUPER_ADMIN';

  const isLoggedIn =
    mounted &&
    (Boolean(token) ||
      Boolean(user?.email) ||
      (typeof window !== 'undefined' &&
        (Boolean(localStorage.getItem('tichi_token')) ||
          Boolean(localStorage.getItem('token')) ||
          Boolean(localStorage.getItem('tichi_user')))));

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pricing', label: 'Pricing', icon: Zap },
    { href: '/about', label: 'About', icon: Info },
    { href: '/gallery', label: 'Gallery', icon: ImageIcon },
    { href: '/contact', label: 'Contact', icon: PhoneCall },
    { href: '/donate', label: 'Donate', icon: Heart },
  ];

  if (isSuperAdmin) {
    navLinks.splice(1, 0, { href: '/admin', label: 'Admin', icon: Crown });
  }

  const dashboardHref = isSuperAdmin
    ? '/admin'
    : user?.role === 'ORGANIZATION'
      ? '/organization'
      : user?.role === 'PARENT'
        ? '/parent'
        : '/dashboard';

  return (
    <header
      ref={menuRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1.5px solid #FFCCE1',
        boxShadow: scrolled
          ? '0 6px 24px rgba(255, 92, 138, 0.12)'
          : '0 2px 12px rgba(255, 92, 138, 0.06)',
        fontFamily: 'Manrope, sans-serif',
        width: '100%',
      }}
      className="transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 w-full">
        {/* BRAND LOGO WITH RESPONSIVE FLEX SHRINK */}
        <Link
          href="/"
          className="group flex items-center gap-2 sm:gap-2.5 no-underline shrink min-w-0"
        >
          <Logo3DFlip size={38} className="shrink-0" />
          <div style={{ lineHeight: 1.15 }} className="min-w-0">
            <div className="font-black text-[13px] sm:text-base text-[#2A0826] tracking-tight truncate group-hover:text-[#FF2A6D] transition-colors">
              Sakhi Suraksha SOS
            </div>
            <div className="text-[8.5px] sm:text-[9.5px] text-[#FF5C8A] font-extrabold uppercase tracking-wider truncate">
              Personal Safety
            </div>
          </div>
        </Link>

        {/* DESKTOP ANIMATED NAV CHIPS CAPSULE (ALWAYS VISIBLE ON DESKTOP) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 nav-chip-capsule">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 lg:px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 no-underline ${
                  active ? 'nav-chip-active' : 'nav-chip-hover'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT SIDE ACTIONS & MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-[11px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer shadow-[0_4px_12px_rgba(255,42,109,0.3)] hover:shadow-[0_8px_20px_rgba(255,42,109,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/30 uppercase tracking-wider text-decoration-none shrink-0"
              >
                {isSuperAdmin ? (
                  <Crown size={13} className="text-white shrink-0" />
                ) : (
                  <LayoutDashboard size={13} className="text-white shrink-0" />
                )}
                <span className="tracking-wide">{isSuperAdmin ? 'Admin' : 'Dashboard'}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="group hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#FFF0F3] to-[#FFCCE1] border-1.5 border-[#FF5C8A] text-[#FF2A6D] text-xs font-extrabold px-3.5 py-2 rounded-full cursor-pointer hover:bg-gradient-to-r hover:from-[#FF2A6D] hover:to-[#E01A4F] hover:text-white hover:border-transparent transition-all duration-300 shadow-xs active:scale-95 shrink-0"
                title="Sign Out"
              >
                <span className="tracking-wide">Sign Out</span>
                <LogOut
                  size={13}
                  className="group-hover:translate-x-0.5 transition-transform duration-300 shrink-0"
                />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/auth?mode=login"
                className="group hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-[#FFF0F3] via-[#FFE6EE] to-[#FFCCE1] border-1.5 border-[#FF5C8A] text-[#2A0826] text-[11px] sm:text-xs font-extrabold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-gradient-to-r hover:from-[#FF5C8A] hover:to-[#FF2A6D] hover:text-white hover:border-transparent transition-all duration-300 shadow-xs active:scale-95 shrink-0 no-underline"
              >
                <span className="tracking-wide">Sign In</span>
                <UserCheck
                  size={14}
                  className="text-[#FF2A6D] group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0"
                />
              </Link>

              <Link
                href="/auth?mode=register"
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-[11px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer shadow-[0_4px_14px_rgba(255,42,109,0.35)] hover:shadow-[0_8px_22px_rgba(255,42,109,0.55)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/30 uppercase tracking-wider shrink-0 no-underline"
              >
                <Zap size={13} className="animate-pulse text-white shrink-0" />
                <span className="tracking-wide">Protect</span>
              </Link>
            </div>
          )}

          {/* MOBILE MENU TOGGLE BUTTON (VISIBLE ON ALL MOBILE SCREENS) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] flex items-center justify-center text-[#FF5C8A] cursor-pointer hover:bg-[#FF5C8A] hover:text-white active:scale-90 transition-all duration-200 shadow-sm shrink-0"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <div
              className={`transition-transform duration-300 ${menuOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </div>
          </button>
        </div>
      </div>

      {/* MOBILE COLLAPSED MENU DROPDOWN DRAWER */}
      {menuOpen && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
          className="md:hidden border-t-1.5 border-[#FFCCE1] p-3 sm:p-4 shadow-2xl animate-fade-up max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {/* PUBLIC NAVIGATION TABS (ALWAYS VISIBLE) */}
          <div className="space-y-1.5 mb-3">
            <div className="text-[10px] font-black uppercase text-[#FF5C8A] tracking-wider px-2 pt-1 pb-1 flex items-center gap-1.5">
              <Shield size={12} />
              <span>Navigation Pages</span>
            </div>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-xs font-black transition-all duration-200 no-underline ${
                    active
                      ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md shadow-[#FF5C8A]/30 scale-[1.01]'
                      : 'bg-[#FFF0F3] text-[#2A0826] hover:bg-white hover:text-[#FF5C8A] border border-[#FFCCE1]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-xl ${active ? 'bg-white/20 text-white' : 'bg-white text-[#FF5C8A]'}`}
                    >
                      <Icon size={16} />
                    </div>
                    <span>{label}</span>
                  </div>
                  {active && (
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold uppercase">
                      Active
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ACTION BUTTONS: GUEST VS LOGGED IN */}
          {isLoggedIn ? (
            <div className="space-y-2 pt-2 border-t-1.5 border-[#FFCCE1]">
              <div className="text-[10px] font-black uppercase text-[#FF5C8A] tracking-wider px-2 pb-0.5">
                Account & Protection
              </div>
              <Link
                href={dashboardHref}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2.5 w-full p-3 rounded-2xl text-xs font-black bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md shadow-[#FF5C8A]/30 text-decoration-none no-underline active:scale-95 transition-all"
              >
                {isSuperAdmin ? <Crown size={16} /> : <LayoutDashboard size={16} />}
                <span>{isSuperAdmin ? 'Go to Admin Command' : 'Go to My Dashboard'}</span>
              </Link>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl text-xs font-black border-1.5 border-[#FFCCE1] bg-white text-[#2A0826] hover:bg-[#FFF0F3] active:scale-95 transition-all no-underline"
              >
                <User size={15} className="text-[#FF5C8A]" />
                <span>My Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2.5 w-full p-3 rounded-2xl text-xs font-black border-1.5 border-[#FFCCE1] bg-[#FFF0F3] text-[#FF2A6D] hover:bg-[#FF2A6D] hover:text-white transition-all duration-200 shadow-xs cursor-pointer active:scale-95"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t-1.5 border-[#FFCCE1]">
              <Link
                href="/auth?mode=login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-black border-1.5 border-[#FFCCE1] bg-white text-[#2A0826] hover:bg-[#FF5C8A] hover:text-white transition-all duration-200 shadow-xs no-underline active:scale-95 text-center"
              >
                <UserCheck size={16} />
                <span>Sign In</span>
              </Link>
              <Link
                href="/auth?mode=register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-black bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md shadow-[#FF5C8A]/30 no-underline active:scale-95 text-center"
              >
                <span>Sign Up</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;

