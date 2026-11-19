'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Header } from './Header.js';
import { BottomNavigation } from './BottomNavigation.js';
import { DesktopSidebar } from './DesktopSidebar.js';

import { GeoLocationTracker } from '../common/GeoLocationTracker.js';


export const AppLayout = ({ children, fullScreen = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { token, user } = useSelector((state) => state?.auth || {});

  useEffect(() => {
    setMounted(true);
  }, []);

  const protectedPaths = [
    '/dashboard',
    '/active-sos',
    '/contacts',
    '/track-journey',
    '/subscription',
    '/settings',
    '/profile',
    '/admin',
    '/organization',
    '/parent',
  ];

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  const hasAuthToken =
    Boolean(token) ||
    (typeof window !== 'undefined' &&
      (Boolean(localStorage.getItem('tichi_token')) || Boolean(localStorage.getItem('token'))));

  useEffect(() => {
    if (!mounted) return;

    // Unauthenticated user trying to access /admin routes -> redirect to /auth?mode=login
    if (pathname.startsWith('/admin') && !hasAuthToken) {
      if (typeof window !== 'undefined') {
        window.location.replace('/auth?mode=login');
      } else {
        router.push('/auth?mode=login');
      }
      return;
    }

    if (isProtected && !hasAuthToken) {
      if (typeof window !== 'undefined') {
        window.location.replace('/auth?mode=login');
      } else {
        router.push('/auth?mode=login');
      }
      return;
    }

    let isSuperAdmin = user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(localStorage.getItem('tichi_user') || '{}');
        if (storedUser?.role === 'SUPER_ADMIN') {
          isSuperAdmin = true;
        }
      } catch (e) {}
    }

    // Non-admin trying to access /admin -> redirect to /auth?mode=login
    if (
      hasAuthToken &&
      pathname.startsWith('/admin') &&
      !isSuperAdmin
    ) {
      router.push('/auth?mode=login');
      return;
    }

    // SuperAdmin trying to access member-only pages -> redirect to /admin
    const memberOnlyPaths = ['/dashboard', '/subscription'];
    if (
      hasAuthToken &&
      isSuperAdmin &&
      memberOnlyPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
    ) {
      router.push('/admin');
      return;
    }
    // Check for expired subscription
    let isSubExpired = false;
    let currentUser = user;
    if (!currentUser?.id && typeof window !== 'undefined') {
      try {
        currentUser = JSON.parse(localStorage.getItem('tichi_user') || '{}');
      } catch (e) {}
    }

    if (currentUser?.role === 'USER') {
      const expDate = currentUser.subscriptionExpiresAt ? new Date(currentUser.subscriptionExpiresAt) : null;
      if (
        currentUser.subscriptionStatus !== 'ACTIVE' ||
        (expDate && expDate < new Date())
      ) {
        isSubExpired = true;
      }
    }

    if (
      isProtected &&
      hasAuthToken &&
      isSubExpired &&
      !pathname.startsWith('/subscription') &&
      !pathname.startsWith('/payment') &&
      !pathname.startsWith('/auth')
    ) {
      router.push('/pricing');
      return;
    }
  }, [mounted, pathname, hasAuthToken, isProtected, user, router]);

  let currentUser = user;
  if (!currentUser?.id && typeof window !== 'undefined') {
    try {
      currentUser = JSON.parse(localStorage.getItem('tichi_user') || '{}');
    } catch (e) {}
  }

  const isUserExpired =
    currentUser?.role === 'USER' &&
    (currentUser.subscriptionStatus !== 'ACTIVE' ||
      (currentUser.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) < new Date()));

  if (mounted && isProtected && !hasAuthToken) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-[#FF2A6D] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (
    mounted &&
    isProtected &&
    hasAuthToken &&
    isUserExpired &&
    !pathname.startsWith('/subscription') &&
    !pathname.startsWith('/payment') &&
    !pathname.startsWith('/auth')
  ) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-[#FF2A6D] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-black text-[#2A0826] uppercase tracking-wider">Active Protection Plan Required</p>
        <p className="text-xs font-bold text-[#684E67] mt-1">Redirecting you to subscription plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blush flex flex-col relative overflow-x-hidden">
      <GeoLocationTracker />
      {/* Desktop sidebar (hidden on mobile) */}
      <Suspense fallback={null}>
        <DesktopSidebar />
      </Suspense>

      {/* Main content area — offset by sidebar on desktop */}
      <div className="lg:ml-72 flex-1 flex flex-col min-w-0">
        {!fullScreen && <Header />}

        <main className={`flex-1 ${!fullScreen ? 'pb-24 lg:pb-6' : ''}`}>{children}</main>

        {!fullScreen && (
          <Suspense fallback={null}>
            <BottomNavigation />
          </Suspense>
        )}
      </div>
    </div>
  );
};
