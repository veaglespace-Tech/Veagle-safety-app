'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo3DFlip } from '../../components/ui/Logo3DFlip.js';
import { Footer } from '../../components/layout/Footer.js';
import { Shield, Eye, MapPin, Database, Share2, UserCheck, Cookie, Baby, Bell, Mail, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    id: 'information-collection',
    title: '1. Information We Collect',
    icon: <Eye size={20} />,
    content: (
      <div className="space-y-4">
        <p>We collect information you provide directly during registration and use of the Sakhi Suraksha SOS app:</p>
        <ul className="list-disc pl-6 space-y-2 text-[#684E67] marker:text-[#FF5C8A]">
          <li><strong className="text-[#2A0826]">Account details:</strong> Name, email address, phone number, and password.</li>
          <li><strong className="text-[#2A0826]">Emergency Contacts:</strong> Names and phone numbers of your designated guardians.</li>
          <li><strong className="text-[#2A0826]">Device Metadata:</strong> OS version, app version, and unique device identifiers for analytics and troubleshooting.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    icon: <Shield size={20} />,
    content: (
      <p>Your data is used strictly to provide the safety services of the App. This includes sending SOS alerts to your guardians, enabling live location sharing during emergencies, and sending you important account and safety notifications. We guarantee that we never use your data for advertising or profiling.</p>
    )
  },
  {
    id: 'location-data',
    title: '3. Location Data Usage',
    icon: <MapPin size={20} />,
    content: (
      <div className="space-y-4">
        <p>Location access is a core requirement for our SOS functionality. Here is how we handle it:</p>
        <div className="bg-[#FFF0F3] p-4 rounded-xl border border-[#FFCCE1] space-y-2 text-sm">
          <p className="flex items-start gap-2"><span className="text-[#FF2A6D]">✓</span> Location is only shared with your pre-approved guardian contacts when you actively initiate an SOS or enable journey tracking.</p>
          <p className="flex items-start gap-2"><span className="text-[#FF2A6D]">✓</span> Background location is accessed solely during active SOS sessions.</p>
          <p className="flex items-start gap-2"><span className="text-[#FF2A6D]">✓</span> We do not sell, rent, or share your location history with any third parties.</p>
        </div>
      </div>
    )
  },
  {
    id: 'data-security',
    title: '4. Data Storage & Security',
    icon: <Database size={20} />,
    content: (
      <p>All data is stored on highly secured servers with industry-standard AES-256 encryption. We enforce HTTPS for all data transmissions. Passwords are stored as encrypted hashes using modern cryptographic algorithms (like bcrypt) and are never visible to anyone, including our engineering team.</p>
    )
  },
  {
    id: 'data-sharing',
    title: '5. Data Sharing Practices',
    icon: <Share2 size={20} />,
    content: (
      <p>We do not sell, trade, or share your personal data with third parties for marketing or commercial purposes. Data may only be shared with law enforcement or government authorities if strictly required by Indian law and accompanied by a valid legal request or warrant.</p>
    )
  },
  {
    id: 'your-rights',
    title: '6. Your Privacy Rights',
    icon: <UserCheck size={20} />,
    content: (
      <div className="space-y-4">
        <p>You retain full control over your data. Under our policy, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-2 text-[#684E67] marker:text-[#FF5C8A]">
          <li>Access and update your personal information at any time via your profile.</li>
          <li>Request a complete export of your personal data.</li>
          <li>Delete your account and all associated data permanently via the app settings.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'cookies',
    title: '7. Cookies & Tracking',
    icon: <Cookie size={20} />,
    content: (
      <p>The Web App uses essential session cookies for authentication and core functionality purposes only. We do not deploy any third-party tracking, cross-site advertising, or device fingerprinting cookies.</p>
    )
  },
  {
    id: 'children-privacy',
    title: "8. Children's Privacy",
    icon: <Baby size={20} />,
    content: (
      <p>Sakhi Suraksha SOS is not intended for users under 13 years of age. We do not knowingly collect personal data from children under 13. If we discover that such data has been inadvertently collected, it will be immediately purged from our systems.</p>
    )
  },
  {
    id: 'policy-changes',
    title: '9. Changes to This Policy',
    icon: <Bell size={20} />,
    content: (
      <p>We may update this Privacy Policy periodically to reflect new features or legal requirements. Any significant changes will be notified via email or a prominent in-app notification. Your continued use of the App implies acceptance of the updated policy.</p>
    )
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    icon: <Mail size={20} />,
    content: (
      <p>If you have any questions, privacy concerns, or data deletion requests, please contact our Data Protection Officer at <a href="mailto:privacy@veaglesafety.org" className="text-[#FF2A6D] hover:underline font-black transition-all">privacy@veaglesafety.org</a> or visit our <Link href="/contact" className="text-[#FF2A6D] hover:underline font-black transition-all">Contact page</Link>.</p>
    )
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll event for Header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for highlighting the active section in the sidebar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans selection:bg-[#FFCCE1] selection:text-[#FF2A6D]">
      {/* HEADER */}
      <div className={`fixed top-0 w-full z-50 transition-all duration-300 border-b-1.5 border-[#FFCCE1] ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm py-3' : 'bg-white/80 backdrop-blur-lg py-4'} px-6`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <Logo3DFlip size={28} />
            <span className="text-sm md:text-base font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors">Sakhi Suraksha</span>
          </Link>
          <Link
            href="/"
            className="text-xs md:text-sm font-black text-[#FF2A6D] hover:text-[#E01A4F] transition-all flex items-center gap-1.5 bg-[#FFF0F3] px-4 py-2 rounded-full border border-[#FFCCE1] hover:border-[#FF5C8A] hover:shadow-[0_4px_12px_rgba(255,92,138,0.15)] group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* SIDEBAR NAVIGATION (Sticky) */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-28 bg-white/95 backdrop-blur-md rounded-3xl border-1.5 border-[#FFCCE1] p-6 shadow-[0_8px_30px_rgba(255,92,138,0.06)]">
          <h3 className="text-xs font-black text-[#FF5C8A] uppercase tracking-wider mb-5 px-3">Table of Contents</h3>
          <nav className="flex flex-col space-y-1.5 custom-select-scrollbar max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-bold transition-all duration-300 border border-transparent ${
                  activeSection === section.id
                    ? 'bg-[#FF5C8A] text-white shadow-[0_6px_16px_rgba(255,92,138,0.35)] transform scale-[1.02] border-[#FF5C8A]'
                    : 'text-[#684E67] hover:bg-[#FFF0F3] hover:text-[#FF2A6D] hover:border-[#FFCCE1]'
                }`}
              >
                <span className={`flex-shrink-0 transition-colors ${activeSection === section.id ? 'text-white' : 'text-[#FF5C8A]'}`}>
                  {section.icon}
                </span>
                <span className="leading-tight">{section.title.replace(/^\d+\.\s/, '')}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN DOCUMENT */}
        <main className="flex-1 min-w-0 pb-12">
          <div className="space-y-5 mb-14">
            <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-[#FFCCE1] shadow-sm mb-2">
              <span className="w-2 h-2 rounded-full bg-[#FF2A6D] animate-pulse"></span>
              <span className="text-xs text-[#FF2A6D] font-black uppercase tracking-widest">Legal Document</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              <span className="heading-gradient-hero">Privacy </span>
              <span className="heading-gradient-rose">Policy</span>
            </h1>
            <p className="text-sm md:text-base text-[#684E67] font-semibold bg-white/60 px-4 py-2 rounded-xl border border-[#FFCCE1] inline-block mt-2">
              Effective Date: <span className="font-black text-[#2A0826]">September 2026</span>
            </p>
            <p className="text-base md:text-lg text-[#684E67] font-semibold leading-relaxed max-w-3xl mt-6">
              At Sakhi Suraksha SOS, your privacy and safety are our top priorities. This document outlines exactly what data we collect, how it's protected, and your rights regarding your personal information. We believe in complete transparency.
            </p>
          </div>

          <div className="space-y-8 lg:space-y-10">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-32 card-antique-pink rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden group"
              >
                {/* Decorative background element */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-[#FFCCE1]/40 to-[#FF5C8A]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FFCCE1] flex items-center justify-center text-[#FF2A6D] shadow-[0_4px_12px_rgba(255,92,138,0.1)] group-hover:scale-110 group-hover:border-[#FF5C8A] transition-all duration-300">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#2A0826] tracking-tight">
                    {section.title}
                  </h2>
                </div>
                <div className="text-base text-[#2A0826] font-semibold leading-relaxed pl-2 sm:pl-16 relative z-10">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t-2 border-[#FFCCE1]/60">
            <div className="text-center sm:text-left">
              <h4 className="text-lg font-black text-[#2A0826] mb-1">Need more information?</h4>
              <p className="text-sm text-[#684E67] font-semibold">Our support team is here to help you.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/terms" 
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl bg-white border-2 border-[#FFCCE1] text-[#2A0826] text-sm font-black hover:border-[#FF5C8A] hover:text-[#FF2A6D] hover:shadow-[0_6px_16px_rgba(255,92,138,0.15)] transition-all"
              >
                Read Terms of Service
              </Link>
              <Link 
                href="/contact" 
                className="w-full sm:w-auto text-center px-7 py-3.5 rounded-xl btn-3d-rose-pop text-sm font-black"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
