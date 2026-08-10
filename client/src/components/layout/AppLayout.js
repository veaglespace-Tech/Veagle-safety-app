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

  useEffect(() => {
    if (!mounted) return;

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

    const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

    const hasAuthToken =
      Boolean(token) ||
      (typeof window !== 'undefined' &&
        (Boolean(localStorage.getItem('tichi_token')) || Boolean(localStorage.getItem('token'))));

    // Unauthenticated user trying to access /admin routes -> redirect to /admin/login
    if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !hasAuthToken) {
      router.push('/admin/login');
      return;
    }

    if (isProtected && !hasAuthToken) {
      router.push('/auth?mode=login');
      return;
    }

    let isSuperAdmin = user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(localStorage.getItem('tichi_user') || '{}');
        if (storedUser?.role === 'SUPER_ADMIN') {
          isSuperAdmin = true;
        }
      } catch (e) { }
    }

    // Non-admin trying to access /admin -> redirect to /admin/login
    if (hasAuthToken && pathname.startsWith('/admin') && pathname !== '/admin/login' && !isSuperAdmin) {
      router.push('/admin/login');
      return;
    }

    // SuperAdmin trying to access member-only pages -> redirect to /admin
    const memberOnlyPaths = ['/dashboard', '/subscription'];
    if (hasAuthToken && isSuperAdmin && memberOnlyPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      router.push('/admin');
      return;
    }
  }, [mounted, pathname, token, user, router]);

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

        <main className={`flex-1 ${!fullScreen ? 'pb-24 lg:pb-6' : ''}`}>
          {children}
        </main>

        {!fullScreen && <Suspense fallback={null}><BottomNavigation /></Suspense>}
      </div>
    </div>
  );
};
