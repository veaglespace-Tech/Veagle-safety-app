'use client';

import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import {
  PhoneCall,
  ShieldAlert,
  HeartPulse,
  Phone,
  MessageSquare,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const PRIMARY_LINES = [
  {
    title: 'National Emergency',
    number: '112',
    desc: 'Unified all-in-one emergency response (Police + Fire + Ambulance)',
    bg: 'bg-tichi-emergency',
    text: 'text-white',
    icon: ShieldAlert,
    badge: '24 / 7',
  },
  {
    title: 'Women Helpline',
    number: '1091',
    desc: 'National helpline for women in distress — trauma, abuse, harassment',
    bg: 'bg-plum',
    text: 'text-white',
    icon: PhoneCall,
    badge: 'FREE',
  },
];

const SECONDARY_LINES = [
  {
    title: 'Ambulance & Medical',
    number: '108',
    icon: HeartPulse,
    desc: 'Emergency medical & trauma response',
  },
  { title: 'Police Direct', number: '100', icon: Phone, desc: 'Local police dispatch center' },
  {
    title: 'Child Helpline',
    number: '1098',
    icon: MessageSquare,
    desc: 'Child protection & trafficking prevention',
  },
  {
    title: 'Cyber Crime',
    number: '1930',
    icon: Globe,
    desc: 'Online harassment, fraud & stalking',
  },
];

export default function EmergencyHelpServicesPage() {
  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 pt-5 pb-4 space-y-5 lg:max-w-4xl xl:max-w-5xl">
        <div className="flex items-center justify-between animate-fade-up">
          <h1 className="text-xl font-extrabold text-tichi-text tracking-tight">
            Emergency Contacts
          </h1>
          <p className="text-xs text-tichi-muted mt-0.5">
            Single-tap direct dialing to all national emergency services
          </p>
        </div>

        <div className="space-y-3 fade-up-1">
          {PRIMARY_LINES.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className={`flex items-center justify-between ${item.bg} ${item.text} p-5 rounded-card shadow-plum-lg active:scale-[0.98] transition-all group`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm">{item.title}</h3>
                      <span className="text-[9px] font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-0.5 max-w-[220px] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <span className="text-3xl font-black tracking-wider block leading-none">
                    {item.number}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mt-1 block">
                    TAP TO CALL
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="flex items-center space-x-3 fade-up-2">
          <div className="flex-1 h-px bg-blush-border"></div>
          <span className="text-[10px] font-bold text-tichi-muted uppercase tracking-widest">
            More Services
          </span>
          <div className="flex-1 h-px bg-blush-border"></div>
        </div>

        <div className="grid grid-cols-1 gap-2 fade-up-2">
          {SECONDARY_LINES.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="bg-white border border-blush-border rounded-card p-4 flex items-center justify-between shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 bg-plum-50 text-plum rounded-xl flex items-center justify-center group-hover:bg-plum group-hover:text-white transition-colors shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-tichi-text">{item.title}</h4>
                    <p className="text-[11px] text-tichi-muted">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-3 shrink-0">
                  <span className="text-lg font-black text-plum">{item.number}</span>
                  <div className="w-7 h-7 rounded-xl bg-plum-50 text-plum group-hover:bg-plum group-hover:text-white flex items-center justify-center transition-colors">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="fade-up-3 bg-blush-subtle border border-blush-border rounded-card p-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-tichi-text">National Crime Records Bureau</h4>
            <p className="text-xs text-tichi-muted mt-0.5">
              File online reports for cybercrime, missing persons & more
            </p>
          </div>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 shrink-0 flex items-center space-x-1.5 bg-plum text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-plum-dark transition-colors"
          >
            <span>Visit</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
