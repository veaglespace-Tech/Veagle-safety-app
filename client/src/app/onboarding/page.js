'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, MapPin, Users, PhoneCall, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function UserOnboardingWelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-blush flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-blush-border rounded-container p-6 space-y-6 shadow-plum-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-plum text-rose mx-auto flex items-center justify-center shadow-md">
          <ShieldCheck className="w-9 h-9 fill-rose/20" />
        </div>

        <div>
          <h1 className="font-extrabold text-2xl text-plum">Welcome to Veagle Safety</h1>
          <p className="text-xs text-tichi-muted mt-1 leading-relaxed">
            Your personal safety network is ready. Follow these 3 simple steps to get 100%
            protected:
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            {
              icon: MapPin,
              title: '1. Grant GPS Permission',
              desc: 'Allows instant location broadcasting during emergency SOS.',
            },
            {
              icon: Users,
              title: '2. Add 2+ Trusted Contacts',
              desc: 'Friends/family who receive live tracking links via SMS/Email.',
            },
            {
              icon: PhoneCall,
              title: '3. Enable Silent SOS Button',
              desc: 'Discreet triple-click or hold trigger for quick distress alert.',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start space-x-3 p-3 rounded-xl bg-blush-subtle border border-blush-border"
              >
                <Icon className="w-5 h-5 text-plum shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-xs text-plum">{item.title}</h3>
                  <p className="text-[11px] text-tichi-muted">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-plum text-white font-bold text-xs py-3.5 rounded-xl shadow-plum-subtle hover:bg-plum-dark transition-all flex items-center justify-center space-x-2"
        >
          <span>CONTINUE TO DASHBOARD</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
