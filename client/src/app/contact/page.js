'use client';

import React, { useState } from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Footer } from '../../components/layout/Footer.js';
import { api } from '../../utils/api.js';
import { settingApi } from '../../redux/api/settingApi.js';
import {
  PhoneCall,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  Phone,
  Sparkles,
  Shield,
  HeartHandshake,
  Headphones,
} from 'lucide-react';
import { AnimatedHeading } from '../../components/common/AnimatedHeading.jsx';
import { MagneticButton } from '../../components/ui/MagneticButton.js';

export const dynamic = 'force-dynamic';

export default function ContactSupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [supportEmail, setSupportEmail] = useState('support@sakhisuraksha.org');

  React.useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await settingApi.fetchSettings(['SUPPORT_EMAIL']);
        if (res.success && res.data.SUPPORT_EMAIL) {
          setSupportEmail(res.data.SUPPORT_EMAIL);
        }
      } catch (err) {
        // Fallback to default
      }
    };
    fetchEmail();
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Safety Inquiry');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice(null);
    setLoading(true);

    try {
      await api.post('/contact', {
        fullName: name,
        email,
        phone,
        subject,
        message,
      });
      setSubmitted(true);
    } catch (err) {
      setErrorNotice(err.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden">
      <PublicNavbar />

      {/* BACKGROUND AMBIENT GLOW MESHES */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-140px] left-[-240px] pointer-events-none" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[60px] right-[-220px] pointer-events-none" />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-14 relative z-10">
        {/* TOP HERO HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <AnimatedHeading
            as="h1"
            variant="shimmer"
            className="text-4xl sm:text-6xl font-black tracking-tight leading-tight"
          >
            <span className="heading-gradient-hero">We Are </span>
            <span className="heading-highlight-pill">Always Here For You</span>
          </AnimatedHeading>

          <p className="text-[#684E67] text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
            Reach out to our safety command team, access 24/7 national emergency helplines, or send
            us a direct inquiry.
          </p>
        </div>

        {/* 2-COLUMN MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto items-start">
          {/* LEFT COLUMN: EMERGENCY HELPLINES & DETAILS */}
          <div className="space-y-8">
            {/* NATIONAL EMERGENCY HELPLINES CARD */}
            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl space-y-6 border-1.5 border-[#FFCCE1] shadow-[0_10px_35px_rgba(255,92,138,0.12)] relative overflow-hidden">
              {/* ACCENT GLOW STRIP */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF0F3] to-[#FFCCE1] text-[#FF2A6D] flex items-center justify-center border-1.5 border-[#FF5C8A] shadow-sm">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#2A0826] tracking-tight">
                      Emergency Helplines
                    </h3>
                    <p className="text-xs text-[#684E67] font-extrabold">
                      Instant Toll-Free Emergency Dispatch
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#FF2A6D] bg-[#FFF0F3] px-3.5 py-1.5 rounded-full border-1.5 border-[#FF5C8A] uppercase tracking-wider shadow-sm animate-pulse">
                  24/7 ACTIVE
                </span>
              </div>

              <ul className="space-y-3.5 text-xs">
                {/* 112 HELPLINE */}
                <li className="flex justify-between items-center bg-[#FFF0F3]/80 p-4 rounded-2xl border-1.5 border-[#FFCCE1] hover:border-[#FF5C8A] transition-all">
                  <div>
                    <span className="font-black text-[#2A0826] text-sm block">
                      National Emergency Number
                    </span>
                    <span className="text-[11px] text-[#684E67] font-bold">
                      Police, Ambulance, Fire Dispatch
                    </span>
                  </div>
                  <a
                    href="tel:112"
                    className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-[0_4px_14px_rgba(255,92,138,0.35)] hover:shadow-[0_8px_25px_rgba(255,42,109,0.50)] hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center space-x-1.5 no-underline shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>CALL 112</span>
                  </a>
                </li>

                {/* 1091 HELPLINE */}
                <li className="flex justify-between items-center bg-[#FFF0F3]/80 p-4 rounded-2xl border-1.5 border-[#FFCCE1] hover:border-[#FF5C8A] transition-all">
                  <div>
                    <span className="font-black text-[#2A0826] text-sm block">
                      Women Helpline (All India)
                    </span>
                    <span className="text-[11px] text-[#684E67] font-bold">
                      24/7 National Women Safety Support
                    </span>
                  </div>
                  <a
                    href="tel:1091"
                    className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-[0_4px_14px_rgba(255,92,138,0.35)] hover:shadow-[0_8px_25px_rgba(255,42,109,0.50)] hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center space-x-1.5 no-underline shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>CALL 1091</span>
                  </a>
                </li>

                {/* 181 HELPLINE */}
                <li className="flex justify-between items-center bg-[#FFF0F3]/80 p-4 rounded-2xl border-1.5 border-[#FFCCE1] hover:border-[#FF5C8A] transition-all">
                  <div>
                    <span className="font-black text-[#2A0826] text-sm block">
                      Domestic Abuse & Violence
                    </span>
                    <span className="text-[11px] text-[#684E67] font-bold">
                      NCW Women Support Line
                    </span>
                  </div>
                  <a
                    href="tel:181"
                    className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-[0_4px_14px_rgba(255,92,138,0.35)] hover:shadow-[0_8px_25px_rgba(255,42,109,0.50)] hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center space-x-1.5 no-underline shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>CALL 181</span>
                  </a>
                </li>

                {/* 100 HELPLINE */}
                <li className="flex justify-between items-center bg-[#FFF0F3]/80 p-4 rounded-2xl border-1.5 border-[#FFCCE1] hover:border-[#FF5C8A] transition-all">
                  <div>
                    <span className="font-black text-[#2A0826] text-sm block">
                      Police Control Room
                    </span>
                    <span className="text-[11px] text-[#684E67] font-bold">
                      Local City Police Dispatch
                    </span>
                  </div>
                  <a
                    href="tel:100"
                    className="bg-[#FFF0F3] border-1.5 border-[#FF5C8A] text-[#FF2A6D] text-xs font-black px-4 py-2.5 rounded-full shadow-sm hover:shadow-[0_8px_22px_rgba(255,92,138,0.35)] hover:scale-105 hover:-translate-y-1 active:scale-95 hover:bg-[#FF5C8A] hover:text-white transition-all duration-300 flex items-center space-x-1.5 no-underline shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>CALL 100</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* COMMAND CENTER CARD */}
            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl space-y-5 border-1.5 border-[#FFCCE1] shadow-[0_10px_35px_rgba(255,92,138,0.10)] relative overflow-hidden">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF0F3] to-[#FFCCE1] text-[#FF2A6D] flex items-center justify-center border-1.5 border-[#FF5C8A] shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#2A0826]">Sakhi Suraksha SOS Command</h3>
                  <p className="text-xs text-[#684E67] font-bold">
                    Veagle Safety Network Operations
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#684E67] leading-relaxed font-bold">
                Veagle Safety Network Operations, Pune & Mumbai Data Centers, Maharashtra, India.
              </p>

              <div className="pt-3 border-t-1.5 border-[#FFCCE1] space-y-2.5 text-xs font-extrabold">
                <div className="flex items-center space-x-2.5 text-[#2A0826]">
                  <Mail className="w-4 h-4 text-[#FF5C8A] shrink-0" />
                  <span>
                    Email:{' '}
                    <a href={`mailto:${supportEmail}`} className="text-[#FF2A6D] underline">
                      {supportEmail}
                    </a>
                  </span>
                </div>
                <div className="flex items-center space-x-2.5 text-[#2A0826]">
                  <Clock className="w-4 h-4 text-[#FF5C8A] shrink-0" />
                  <span>Hours: 24/7 / 365 Days Non-Stop Safety Monitoring</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl space-y-6 border-1.5 border-[#FFCCE1] shadow-[0_12px_40px_rgba(255,92,138,0.14)] relative overflow-hidden">
            {/* ACCENT GLOW STRIP */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-[#2A0826]">Send Message to Safety</h3>
              <p className="text-xs text-[#684E67] font-bold">
                Fill out the details below and our dedicated safety command team will respond
                shortly.
              </p>
            </div>

            {submitted ? (
              <div className="bg-[#FFF0F3] border-2 border-[#FF5C8A] text-[#2A0826] p-8 rounded-3xl text-center space-y-4 animate-fade-up">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-black text-[#2A0826]">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-[#684E67] font-bold max-w-sm mx-auto leading-relaxed">
                  Thank you for contacting us,{' '}
                  <span className="font-black text-[#FF2A6D]">{name || 'valued user'}</span>. Our
                  safety team will review your message and reach back within 2 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white text-xs font-black px-6 py-3 rounded-full uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                <div>
                  <label className="block text-[#2A0826] font-black mb-1.5">Your Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#FF5C8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] text-[#2A0826] font-bold placeholder-[#684E67]/60 focus:outline-none focus:border-[#FF5C8A] focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#2A0826] font-black mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#FF5C8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="priya@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] text-[#2A0826] font-bold placeholder-[#684E67]/60 focus:outline-none focus:border-[#FF5C8A] focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#2A0826] font-black mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#FF5C8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] text-[#2A0826] font-bold placeholder-[#684E67]/60 focus:outline-none focus:border-[#FF5C8A] focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#2A0826] font-black mb-1.5">Inquiry Topic</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] text-[#2A0826] font-black focus:outline-none focus:border-[#FF5C8A] focus:bg-white transition-all shadow-inner"
                  >
                    <option value="General Safety Inquiry">General Safety Inquiry</option>
                    <option value="Technical Support">Technical Support / App Assistance</option>
                    <option value="Billing / Plan Assistance">
                      Billing / Plan Formalities Assistance
                    </option>
                    <option value="Emergency Escalation">Emergency Escalation Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#2A0826] font-black mb-1.5">Your Message *</label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-[#FF5C8A] absolute left-3.5 top-3.5" />
                    <textarea
                      rows={4}
                      required
                      placeholder="How can our safety team assist you today?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFF0F3] border-1.5 border-[#FFCCE1] text-[#2A0826] font-bold placeholder-[#684E67]/60 focus:outline-none focus:border-[#FF5C8A] focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="btn-3d-rose-pop px-9 py-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-3 whitespace-nowrap"
                  >
                    <span>SEND INQUIRY TO SAFETY</span>
                    <Send className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
