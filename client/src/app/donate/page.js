'use client';

import React, { useState, useEffect } from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Footer } from '../../components/layout/Footer.js';
import { Heart, User, Mail, Phone, IndianRupee, ExternalLink, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../redux/api/apiClient.js';
import { useRouter } from 'next/navigation';

export default function DonatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [amount, setAmount] = useState('100');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset processing state if user navigates back from PayU
    const handlePageShow = (e) => {
      if (e.persisted) {
        setIsProcessing(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const predefinedAmounts = ['50', '100', '500'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmountSelect = (val) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    if (val) {
      setAmount('custom');
    } else {
      setAmount('100');
    }
  };

  const getFinalAmount = () => {
    return amount === 'custom' ? customAmount : amount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalAmount = getFinalAmount();

    if (!formData.name || !formData.email || !formData.phone || !finalAmount || Number(finalAmount) <= 0) {
      setError('Please fill all required fields and select a valid amount.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await apiClient.post('/donations/initiate', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        amount: finalAmount,
      });

      const payData = res.data?.paymentData;

      if (!payData || !payData.actionUrl || !payData.hash) {
        throw new Error('Payment gateway initialization failed.');
      }

      // Create a hidden form to submit POST request to PayU Gateway
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payData.actionUrl;

      const fields = {
        key: payData.key,
        txnid: payData.txnid,
        amount: payData.amount,
        productinfo: payData.productinfo,
        firstname: payData.firstname,
        email: payData.email,
        phone: payData.phone,
        surl: payData.surl,
        furl: payData.furl,
        hash: payData.hash,
        service_provider: 'payu_paisa',
      };

      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        input.value = v || '';
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('Donation Initiate Error:', err);
      setError(
        err.response?.data?.error || err.message || 'Payment processing failed. Please try again.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden flex flex-col">
      <PublicNavbar />

      {/* BACKGROUND NEON GLOW BLURS */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-100px] left-[-250px] pointer-events-none animate-pulse" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[50px] right-[-250px] pointer-events-none animate-pulse" />

      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-16 w-full relative z-10 space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white text-[#FF2A6D] border-2 border-[#FFCCE1] px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(255,92,138,0.12)]">
            <Heart className="w-4 h-4 text-[#FF2A6D] animate-pulse" />
            <span>Support Women Safety</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            <span className="heading-gradient-hero">Make a </span>
            <span className="heading-gradient-rose">Donation</span>
          </h1>
          <p className="text-sm font-extrabold text-[#684E67] leading-relaxed">
            Your generous contribution helps us empower and protect women. Every rupee makes a difference.
          </p>
        </div>

        {error && (
          <div className="bg-rose/10 border-2 border-rose/30 text-[#FF2A6D] p-5 rounded-3xl text-xs font-black flex items-start space-x-3 shadow-md max-w-3xl mx-auto animate-fade-up">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#FF2A6D] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border-2 border-[#FFCCE1] rounded-3xl p-6 sm:p-10 space-y-8 shadow-[0_15px_40px_rgba(255,92,138,0.06)] animate-fade-up">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[#2A0826] uppercase tracking-wider border-b border-[#FFCCE1] pb-2">
                Personal Information
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-[#684E67] ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[#FF2A6D]" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#FFF0F3]/50 border border-[#FFCCE1] rounded-xl text-sm font-bold text-[#2A0826] focus:outline-none focus:border-[#FF2A6D] focus:ring-1 focus:ring-[#FF2A6D] transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-[#684E67] ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-[#FF2A6D]" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#FFF0F3]/50 border border-[#FFCCE1] rounded-xl text-sm font-bold text-[#2A0826] focus:outline-none focus:border-[#FF2A6D] focus:ring-1 focus:ring-[#FF2A6D] transition-all"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-wider text-[#684E67] ml-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-[#FF2A6D]" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#FFF0F3]/50 border border-[#FFCCE1] rounded-xl text-sm font-bold text-[#2A0826] focus:outline-none focus:border-[#FF2A6D] focus:ring-1 focus:ring-[#FF2A6D] transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-[#2A0826] uppercase tracking-wider border-b border-[#FFCCE1] pb-2">
                Donation Amount
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {predefinedAmounts.map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => handleAmountSelect(val)}
                    className={`py-3 rounded-xl border-2 text-lg font-black transition-all flex items-center justify-center gap-1 ${
                      amount === val
                        ? 'border-[#FF2A6D] bg-[#FF2A6D]/10 text-[#FF2A6D]'
                        : 'border-[#FFCCE1] bg-white text-[#684E67] hover:border-[#FF5C8A] hover:text-[#FF2A6D]'
                    }`}
                  >
                    <IndianRupee className="w-4 h-4" />
                    {val}
                  </button>
                ))}
                
                <div className="col-span-2 relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-[#FF2A6D]" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    onFocus={() => setAmount('custom')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-lg font-black transition-all border-2 ${
                      amount === 'custom'
                        ? 'border-[#FF2A6D] bg-[#FF2A6D]/5 text-[#FF2A6D] focus:outline-none'
                        : 'border-[#FFCCE1] bg-white text-[#684E67] focus:outline-none focus:border-[#FF2A6D]'
                    }`}
                    placeholder="Custom Amount"
                  />
                </div>
              </div>
              
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-4 rounded-2xl text-sm uppercase tracking-wider font-black shadow-[0_8px_25px_rgba(255,42,109,0.35)] hover:shadow-[0_12px_35px_rgba(255,42,109,0.50)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span>PROCESSING...</span>
                  ) : (
                    <>
                      <span>DONATE ₹{getFinalAmount() || '0'} SECURELY</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
