'use client';

import Link from 'next/link';
import { Logo3DFlip } from '../../components/ui/Logo3DFlip.js';
import { Footer } from '../../components/layout/Footer.js';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans">
      {/* HEADER */}
      <div className="bg-white/95 backdrop-blur-xl border-b-1.5 border-[#FFCCE1] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <Logo3DFlip size={28} />
            <span className="text-sm font-black text-[#2A0826]">Sakhi Suraksha SOS</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-black text-[#FF2A6D] hover:text-[#E01A4F] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            <span className="heading-gradient-hero">Terms of </span>
            <span className="heading-gradient-rose">Service</span>
          </h1>
          <p className="text-xs text-[#684E67] font-bold">Last updated: July 2026</p>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing and using Sakhi Suraksha SOS ("the App"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the App immediately.',
          },
          {
            title: '2. Description of Service',
            body: 'Sakhi Suraksha SOS is a women safety application that provides emergency SOS alerts, live location tracking, guardian contact management, and related safety features. The App is designed for personal safety use only.',
          },
          {
            title: '3. User Responsibilities',
            body: 'You agree to provide accurate information during registration, keep your account credentials secure, not misuse the SOS system with false emergency triggers, and ensure your emergency contacts have consented to receive alerts.',
          },
          {
            title: '4. Emergency Services Disclaimer',
            body: 'Sakhi Suraksha SOS supplements but does not replace official emergency services. Always contact national emergency number 112 directly for immediate life-threatening situations. The App is not liable for delays caused by network, device, or location service issues.',
          },
          {
            title: '5. Subscription & Billing',
            body: 'The App is offered on an annual subscription basis. All prices are inclusive of applicable GST. Subscriptions are non-refundable once activated. Payment is processed securely through our payment partner.',
          },
          {
            title: '6. Intellectual Property',
            body: 'All content, design, and technology within the App are the intellectual property of Veagle Space Technology Pvt. Ltd. Unauthorized reproduction or distribution is strictly prohibited.',
          },
          {
            title: '7. Limitation of Liability',
            body: 'To the maximum extent permitted by law, Veagle Space Technology Pvt. Ltd. shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the App.',
          },
          {
            title: '8. Modifications',
            body: 'We reserve the right to update these Terms at any time. Continued use of the App after changes constitutes acceptance of the revised Terms.',
          },
          {
            title: '9. Contact',
            body: 'For queries regarding these Terms, contact us at legal@veaglesafety.org or visit our Contact page.',
          },
        ].map((section) => (
          <div
            key={section.title}
            className="bg-white/90 border-1.5 border-[#FFCCE1] rounded-2xl p-6 space-y-2"
          >
            <h2 className="text-sm font-black text-[#FF2A6D]">{section.title}</h2>
            <p className="text-xs text-[#684E67] font-bold leading-relaxed">{section.body}</p>
          </div>
        ))}

        <div className="text-center pt-4">
          <Link href="/privacy" className="text-xs font-black text-[#FF2A6D] hover:underline">
            View Privacy Policy →
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
