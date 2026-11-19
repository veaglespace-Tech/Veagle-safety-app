'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Footer } from '../../components/layout/Footer.js';
import { fetchPlans } from '../../redux/slices/planSlice.js';
import { fetchUser } from '../../redux/slices/authSlice.js';
import {
  Shield,
  Lock,
  CreditCard,
  ArrowRight,
  AlertCircle,
  User,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../redux/api/apiClient.js';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get('planId');

  const dispatch = useDispatch();
  const router = useRouter();
  const { plans = [] } = useSelector((state) => state.plan || {});
  const { token, user, registrationToken } = useSelector((state) => state.auth || {});

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    dispatch(fetchPlans());
    if (token && !user) {
      dispatch(fetchUser());
    }
  }, [dispatch, token, user]);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!isMounted) return null;

  const selectedPlan =
    plans.find((p) => String(p.id) === String(planIdParam)) ||
    plans[0] || {
      id: 2,
      name: 'Sakhi Suraksha 365 Yearly Protection Plan',
      basePrice: 24.0,
      gstPercentage: 18.0,
      totalPrice: 28.32,
      durationDays: 365,
    };

  const originalBasePrice = Number(selectedPlan.basePrice || 0);
  let basePrice = originalBasePrice;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      basePrice = basePrice - (basePrice * appliedCoupon.discountValue) / 100;
    } else if (appliedCoupon.discountType === 'FLAT_AMOUNT') {
      basePrice = basePrice - appliedCoupon.discountValue;
    }
    if (basePrice < 0) basePrice = 0;
  }

  const isFreePlan = originalBasePrice === 0;
  const isZeroPrice = basePrice === 0;

  const rawGst =
    selectedPlan.gstPercentage !== undefined &&
    selectedPlan.gstPercentage !== null &&
    !isNaN(Number(selectedPlan.gstPercentage))
      ? Number(selectedPlan.gstPercentage)
      : 18.0;
  const gstRate = isZeroPrice ? 0 : rawGst;
  const gstAmount = isZeroPrice || gstRate === 0 ? 0 : Number(((basePrice * gstRate) / 100).toFixed(2));
  const totalPrice = isZeroPrice ? 0 : Number((basePrice + gstAmount).toFixed(2));

  const currentRegToken =
    registrationToken ||
    (typeof window !== 'undefined' ? localStorage.getItem('tichi_reg_token') : null);

  let subscriberInfo = user || {};
  if ((!subscriberInfo || !subscriberInfo.email) && currentRegToken) {
    try {
      const payload = JSON.parse(atob(currentRegToken.split('.')[1]));
      subscriberInfo = {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        emergencyContactName: payload.emergencyContactName,
        emergencyContactPhone: payload.emergencyContactPhone,
      };
    } catch (e) {
      console.warn('Could not decode registrationToken:', e.message);
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await apiClient.post('/coupons/validate', {
        code: couponCodeInput.trim(),
        planId: selectedPlan.id,
        registrationToken: currentRegToken,
      });
      if (res.data?.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponError(null);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
  };

  // Razorpay Payment Flow
  const handleRazorpayCheckout = async () => {
    if (!token && !currentRegToken) {
      router.push('/auth?mode=register');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Razorpay order on backend
      const res = await apiClient.post('/payment/razorpay-create-order', {
        planId: selectedPlan.id,
        amount: totalPrice,
        registrationToken: currentRegToken,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      });

      // FREE plan handled directly
      if (res.data?.isFree) {
        if (res.data.token) {
          localStorage.setItem('tichi_token', res.data.token);
          localStorage.setItem('tichi_auth_token', res.data.token);
          localStorage.setItem('token', res.data.token);
        }
        localStorage.removeItem('tichi_reg_token');
        router.push(`/payment/success?status=success&txnid=${res.data.txnid}&free=true&token=${res.data.token || ''}`);
        return;
      }

      const payData = res.data?.paymentData;
      if (!payData?.orderId || !payData?.keyId) {
        throw new Error('Razorpay order initialization failed. Please try again.');
      }

      // 2. Open Razorpay checkout popup
      const options = {
        key: payData.keyId,
        amount: payData.amount,
        currency: payData.currency || 'INR',
        name: 'Sakhi Suraksha',
        description: payData.description || payData.productinfo,
        order_id: payData.orderId,
        prefill: {
          name: payData.name || subscriberInfo.fullName || '',
          email: payData.email || subscriberInfo.email || '',
          contact: payData.phone || subscriberInfo.phone || '',
        },
        theme: { color: '#FF2A6D' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError('Payment cancelled. Please try again.');
          },
        },
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            const verifyRes = await apiClient.post('/payment/razorpay-verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              txnid: payData.txnid,
              registrationToken: currentRegToken,
            });

            if (verifyRes.data?.success) {
              if (verifyRes.data.token) {
                localStorage.setItem('tichi_token', verifyRes.data.token);
                localStorage.setItem('tichi_auth_token', verifyRes.data.token);
                localStorage.setItem('token', verifyRes.data.token);
              }
              localStorage.removeItem('tichi_reg_token');
              router.push(
                `/payment/success?status=success&txnid=${payData.txnid}&amount=${payData.amountDisplay}&token=${verifyRes.data.token || ''}`
              );
            } else {
              throw new Error('Payment verification failed. Please contact support.');
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed.');
            setIsProcessing(false);
          }
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        await apiClient.post('/payment/failure', {
          txnid: payData.txnid,
          razorpay_order_id: payData.orderId,
        }).catch(() => {});
        setError(`Payment failed: ${response.error?.description || 'Please try again.'}`);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay Checkout Error:', err);
      setError(err.response?.data?.error || err.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans relative overflow-hidden flex flex-col">
      <PublicNavbar />

      {/* BACKGROUND NEON GLOW BLURS */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#FF5C8A]/12 blur-[170px] top-[-100px] left-[-250px] pointer-events-none animate-pulse" />
      <div className="absolute w-[750px] h-[750px] rounded-full bg-[#FFCCE1]/25 blur-[160px] bottom-[50px] right-[-250px] pointer-events-none animate-pulse" />

      <div className="flex-1 max-w-5xl mx-auto px-4 py-12 sm:py-16 w-full relative z-10 space-y-10">
        {/* HEADER */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white text-[#FF2A6D] border-2 border-[#FFCCE1] px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(255,92,138,0.12)]">
            <CreditCard className="w-4 h-4 text-[#FF2A6D] animate-pulse" />
            <span>Secure Checkout Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            <span className="heading-gradient-hero">Complete Your </span>
            <span className="heading-gradient-rose">Protection</span>
          </h1>
          <p className="text-xs sm:text-sm font-extrabold text-[#684E67] leading-relaxed">
            Review your plan summary with itemized GST breakdown before secure Razorpay activation.
          </p>
        </div>

        {error && (
          <div className="bg-rose/10 border-2 border-rose/30 text-[#FF2A6D] p-5 rounded-3xl text-xs font-black flex items-start space-x-3 shadow-md max-w-3xl mx-auto animate-fade-up">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#FF2A6D] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start max-w-4xl mx-auto">
          {/* SUBSCRIBER DETAILS */}
          <div className="lg:col-span-2 bg-white/75 backdrop-blur-xl border-2 border-[#FFCCE1] rounded-3xl p-6 space-y-6 shadow-[0_15px_40px_rgba(255,92,138,0.06)] animate-fade-up">
            <div className="flex items-center space-x-2.5 border-b border-[#FFCCE1] pb-4">
              <div className="w-7 h-7 rounded-lg bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-[#2A0826] uppercase tracking-wider">Subscriber Details</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-[#FFF0F3]/50 rounded-2xl border border-[#FFCCE1]/50 space-y-1">
                <span className="text-[#684E67] block text-[9.5px] uppercase font-black tracking-wider">Full Name</span>
                <span className="font-black text-xs text-[#2A0826]">{subscriberInfo?.fullName || 'Sakhi Member'}</span>
              </div>
              <div className="p-3.5 bg-[#FFF0F3]/50 rounded-2xl border border-[#FFCCE1]/50 space-y-1">
                <span className="text-[#684E67] block text-[9.5px] uppercase font-black tracking-wider">Email Address</span>
                <span className="font-mono text-xs font-bold text-[#2A0826] break-all">{subscriberInfo?.email || 'Registered Email'}</span>
              </div>
              <div className="p-3.5 bg-[#FFF0F3]/50 rounded-2xl border border-[#FFCCE1]/50 space-y-1">
                <span className="text-[#684E67] block text-[9.5px] uppercase font-black tracking-wider">Mobile Number</span>
                <span className="font-mono text-xs font-bold text-[#2A0826]">{subscriberInfo?.phone || '+91 Mobile Number'}</span>
              </div>
              {subscriberInfo?.emergencyContactName && (
                <div className="p-3.5 bg-[#FFF0F3]/70 rounded-2xl border-2 border-[#FFCCE1] space-y-1.5">
                  <span className="text-[#684E67] block text-[9.5px] uppercase font-black tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#FF2A6D]" />
                    <span>Primary Guardian</span>
                  </span>
                  <div className="text-xs font-black text-[#2A0826]">
                    {subscriberInfo.emergencyContactName}
                    <span className="block font-mono text-[11px] text-[#684E67] font-bold mt-0.5">
                      {subscriberInfo.emergencyContactPhone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BILLING SUMMARY */}
          <div className="lg:col-span-3 bg-gradient-to-br from-white via-[#FFF0F3] to-white border-2 border-[#FF2A6D] shadow-[0_20px_60px_rgba(255,42,109,0.14)] rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden animate-fade-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

            <div className="flex items-center space-x-3 border-b border-[#FFCCE1] pb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF0F3] to-[#FFCCE1] text-[#FF2A6D] border border-[#FF5C8A] flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2A0826] tracking-tight">{selectedPlan.name}</h3>
                <span className="inline-block text-[10px] bg-[#FF2A6D]/10 text-[#FF2A6D] font-black px-2.5 py-0.5 rounded-full border border-[#FF2A6D]/20 uppercase tracking-widest mt-0.5">
                  {selectedPlan.durationDays || 365} Days Active Protection
                </span>
              </div>
            </div>

            {/* BILLING BLOCK */}
            <div className="bg-white/90 p-5 rounded-2xl border border-[#FFCCE1] space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs font-extrabold text-[#684E67]">
                <span>Base Plan Price (Net):</span>
                <span className="font-mono text-sm font-black text-[#2A0826]">₹{originalBasePrice.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-xs font-extrabold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <span>Discount Applied ({appliedCoupon.code}):</span>
                  <span className="font-mono text-sm font-black">-₹{(originalBasePrice - basePrice).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-extrabold text-[#684E67] border-b border-dashed border-[#FFCCE1] pb-4">
                <span>GST Tax Added ({gstRate}%):</span>
                <span className="font-mono text-sm font-black text-[#2A0826]">
                  {isZeroPrice || gstRate === 0 ? '₹0.00 (0% GST)' : `₹${gstAmount.toFixed(2)}`}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="font-black text-xs uppercase text-[#FF2A6D] tracking-wider">Total Payable Amount:</span>
                <span className="font-mono text-2xl font-black text-[#FF2A6D] drop-shadow-xs">
                  {isZeroPrice ? '₹0.00 (FREE TRIAL)' : `₹${totalPrice.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* COUPON SECTION */}
            <div className="bg-white/90 p-5 rounded-2xl border border-[#FFCCE1] shadow-sm">
              {!appliedCoupon ? (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 border border-[#FFCCE1] rounded-xl px-4 py-2 text-xs font-bold text-[#2A0826] focus:outline-none focus:border-[#FF2A6D] uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCodeInput}
                      className="bg-[#FF2A6D] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-[#FF2A6D] font-bold">{couponError}</p>}
                </div>
              ) : (
                <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-black text-emerald-700">Coupon Applied: {appliedCoupon.code}</p>
                      <p className="text-[10px] font-bold text-emerald-600">
                        {appliedCoupon.discountType === 'PERCENTAGE'
                          ? `${appliedCoupon.discountValue}% OFF`
                          : `₹${appliedCoupon.discountValue} OFF`}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className="text-[10px] text-rose-500 font-bold uppercase underline cursor-pointer">
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* RAZORPAY CHECKOUT BUTTON */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-wider font-black shadow-[0_8px_25px_rgba(255,42,109,0.35)] hover:shadow-[0_12px_35px_rgba(255,42,109,0.50)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer border border-white/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? isZeroPrice
                      ? 'ACTIVATING FREE TRIAL...'
                      : 'OPENING RAZORPAY...'
                    : isZeroPrice
                      ? 'ACTIVATE 100% FREE TRIAL NOW'
                      : `PAY ₹${totalPrice.toFixed(2)} VIA RAZORPAY`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-2 text-[10px] text-[#684E67] font-black pt-1">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit SSL Secured via Razorpay Payment Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center font-bold text-rose">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
