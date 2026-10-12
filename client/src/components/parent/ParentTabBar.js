'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Users, Clock } from 'lucide-react';

export const ParentTabBar = ({ activeSosCount = 0, totalChildren = 0 }) => {
  const pathname = usePathname();

  const tabs = [
    {
      href: '/parent',
      label: '1. Safety Command',
      icon: Activity,
      isActive: pathname === '/parent',
      badge: activeSosCount > 0 ? (
        <span className="bg-white text-[#FF2A6D] px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
          {activeSosCount} SOS
        </span>
      ) : null,
    },
    {
      href: '/parent/children',
      label: `2. Linked Children (${totalChildren})`,
      icon: Users,
      isActive: pathname === '/parent/children',
      badge: null,
    },
    {
      href: '/parent/history',
      label: '3. Safety Logs & History',
      icon: Clock,
      isActive: pathname === '/parent/history',
      badge: null,
    },
  ];

  return (
    <div className="flex items-center space-x-2 bg-white/95 p-1.5 rounded-2xl border-2 border-[#FFCCE1] shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              tab.isActive
                ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white shadow-md'
                : 'text-[#684E67] hover:text-[#FF2A6D] hover:bg-[#FFF0F3]'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{tab.label}</span>
            {tab.badge}
          </Link>
        );
      })}
    </div>
  );
};
