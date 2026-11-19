'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Users, 
  BellRing, 
  HeartPulse, 
  CreditCard, 
  GraduationCap, 
  AlertTriangle, 
  Smartphone, 
  BookOpen, 
  WifiOff, 
  PhoneCall, 
  ChevronDown,
  ChevronUp,
  FileText,
  X
} from 'lucide-react';

export const USER_CONSENT_ITEMS = [
  {
    id: 'safety_data_collection',
    title: '1. Personal Safety Data Collection & Emergency Usage Consent',
    icon: ShieldCheck,
    summary: 'Explicit permission to collect and securely store your personal identity details (Full Name, Phone Number, Profile Photo, Residential Address, Emergency Contacts, and Blood Group) strictly for your personal protection and life-safety response.',
    usage: 'This data is collected solely for your safety and protection. It will never be sold, rented, or shared with third-party advertisers, and is accessed strictly during emergency situations and rescue operations.'
  },
  {
    id: 'live_gps',
    title: '2. Real-Time GPS Location Tracking',
    icon: MapPin,
    summary: 'Permission for the application to access high-accuracy background GPS coordinates during emergency SOS activations and "Safe Journey" tracking.',
    usage: 'Strictly accessed for emergency rescue and displayed only on secure live maps to linked parents/guardians and emergency contacts.'
  },
  {
    id: 'guardian_sharing',
    title: '3. Guardian, Parent & Organization Data Sharing',
    icon: Users,
    summary: 'Permission to securely transmit your basic profile (Name, phone, blood group) and live GPS location during distress situations to your parents, trusted contacts, and organization/college admin.',
    usage: 'Enables quick coordination between family members, authorities, and rescue teams.'
  },
  {
    id: 'emergency_broadcast',
    title: '4. Emergency Alerts & Siren Broadcast',
    icon: BellRing,
    summary: 'Full consent to send automated high-decibel siren pushes, instant WhatsApp alerts, priority emails, and SMS tracking notifications to your guardians when SOS is activated.',
    usage: 'Ensures guardians receive an immediate alert even when their phone is locked or on silent.'
  },
  {
    id: 'medical_disclosure',
    title: '5. Medical & Emergency Info Disclosure',
    icon: HeartPulse,
    summary: 'Consent to disclose your Blood Group and optional medical notes to first responders, doctors, and police during an active rescue.',
    usage: 'Enables timely first-aid and medical care without delays.'
  },
  {
    id: 'payment_billing',
    title: '6. Payment, Subscription & Statutory Billing',
    icon: CreditCard,
    summary: 'Consent to securely process subscription transactions via RBI-authorized payment gateways (Razorpay) and maintain GST-compliant billing records.',
    usage: 'Ensures lawful invoice generation and continuous safety plan protection.'
  },
  {
    id: 'minor_consent',
    title: '7. Minor / Student Parental Consent',
    icon: GraduationCap,
    summary: 'If the user is under 18 years of age (school/college student), parental/legal guardian consent has been obtained to create this account and allow parental tracking.',
    usage: 'Complies with Indian Digital Personal Data Protection (DPDP) Act requirements.'
  }
];

export const SAFETY_GUIDELINES = [
  {
    title: 'Strictly No False or Prank SOS Alarms',
    icon: AlertTriangle,
    desc: 'The SOS emergency button must strictly be used during genuine distress. Repeated intentional prank alarms may lead to account suspension.'
  },
  {
    title: 'Mandatory Device Settings',
    icon: Smartphone,
    desc: 'Keep Location set to "Allow all the time", notifications enabled, and Battery Optimization set to "Unrestricted" so GPS continues running in the background.'
  },
  {
    title: 'Keep Guardian Records Updated',
    icon: BookOpen,
    desc: 'Always verify and maintain accurate 10-digit mobile numbers and active email addresses for all emergency contacts.'
  },
  {
    title: 'Cellular & GPS Signal Dependency',
    icon: WifiOff,
    desc: 'Live location updates require active mobile data (4G/5G/Wi-Fi) and satellite GPS signals. Delays may occur in zero-network areas.'
  },
  {
    title: 'Supplement to National Helpline 112',
    icon: PhoneCall,
    desc: 'Sakhi Suraksha connects your family and community. In serious criminal emergencies, immediately dial National Police 112 or Women Helpline 1091.'
  }
];

export function UserConsentModal({ isOpen, onClose, onAcceptAll }) {
  const [agreed, setAgreed] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!agreed) {
      alert('Please check the confirmation box below to accept the consent terms.');
      return;
    }
    onAcceptAll();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A0826]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-7 space-y-4 border border-[#FFCCE1] shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#FFCCE1] pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-[#FFF0F3] px-3 py-1 rounded-full text-[#FF2A6D] text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#2A0826]">
              User Safety Consent &amp; Guidelines
            </h2>
            <p className="text-[11px] text-[#684E67] font-semibold">
              Please review the statutory safety clauses below before proceeding to payment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE LIST OF POINTS (CLEAN & SIMPLE) */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 text-left custom-scrollbar">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#FF2A6D]">
            Statutory Consent Clauses (7 Points)
          </p>

          <div className="space-y-2">
            {USER_CONSENT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#FFF0F3]/60 rounded-2xl border border-[#FFCCE1]/70 space-y-1"
                >
                  <div className="flex items-center space-x-2 text-[#2A0826]">
                    <Icon className="w-4 h-4 text-[#FF2A6D] shrink-0" />
                    <h4 className="text-xs font-black">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-[#553254] font-medium leading-relaxed pl-6">
                    {item.summary}
                  </p>
                  <p className="text-[10px] text-[#8C6B8B] font-semibold italic pl-6">
                    <strong>Use:</strong> {item.usage}
                  </p>
                </div>
              );
            })}
          </div>

          {/* SAFETY GUIDELINES (COLLAPSIBLE) */}
          <div className="border border-[#FFCCE1] rounded-2xl p-3 bg-white space-y-2">
            <button
              type="button"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="w-full flex items-center justify-between text-left font-black text-xs text-[#2A0826] cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-[#FF2A6D]" />
                <span>Safety &amp; Operational Guidelines</span>
              </div>
              {showGuidelines ? <ChevronUp className="w-4 h-4 text-[#FF2A6D]" /> : <ChevronDown className="w-4 h-4 text-[#FF2A6D]" />}
            </button>

            {showGuidelines && (
              <div className="space-y-2 pt-2 border-t border-[#FFCCE1]/60">
                {SAFETY_GUIDELINES.map((g, idx) => {
                  const GIcon = g.icon;
                  return (
                    <div key={idx} className="flex items-start space-x-2 bg-[#FFF0F3]/40 p-2 rounded-xl text-left">
                      <GIcon className="w-3.5 h-3.5 text-[#FF2A6D] shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[11px] font-black text-[#2A0826]">{g.title}</h5>
                        <p className="text-[10px] text-[#684E67] font-medium leading-normal">{g.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM CONFIRMATION CHECKBOX & BUTTON (MAIN SINGLE CONSENT) */}
        <div className="border-t border-[#FFCCE1] pt-3 space-y-3">
          <div
            onClick={() => setAgreed(!agreed)}
            className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-[#FFF0F3] border border-[#FFCCE1] cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="mainConsentConfirm"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="accent-[#FF2A6D] w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <label htmlFor="mainConsentConfirm" className="text-xs font-bold text-[#2A0826] cursor-pointer leading-snug">
              I have read, understood, and accept all 7 statutory clauses and safety guidelines for emergency safety data usage, live GPS tracking, and alert broadcasts.
            </label>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl border border-gray-300 text-xs font-black uppercase text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!agreed}
              className="w-2/3 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              I ACCEPT &amp; PROCEED
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
