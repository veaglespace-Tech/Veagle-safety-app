'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { api } from '../../../utils/api.js';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !email) {
      setError('Invalid password reset link. Please request a new password reset link.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both passwords.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        token,
        newPassword,
      });

      setSuccess(res.data.message || '🎉 Password reset successfully!');
      setTimeout(() => {
        router.push('/auth?mode=login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout fullScreen>
      <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center p-4 sm:p-6 font-sans py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(255,42,109,0.18)] border-2 border-[#FFCCE1] space-y-6 relative">
          {/* TOP BADGE */}
          <div className="flex items-center justify-center">
            <div className="bg-[#FFF0F3] border border-[#FFCCE1] px-4 py-1.5 rounded-full flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#FF2A6D]" />
              <span className="text-[11px] font-black text-[#2A0826] uppercase tracking-wider">
                SET NEW PASSWORD
              </span>
            </div>
          </div>

          {/* TITLE */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-[#2A0826] tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs font-extrabold text-[#684E67]">
              Enter a strong new password for your account{' '}
              <span className="text-[#FF2A6D]">{email}</span>.
            </p>
          </div>

          {/* NOTIFICATIONS */}
          {error && (
            <div className="bg-[#FFF0F3] border-1.5 border-[#FF2A6D] text-[#FF2A6D] p-4 rounded-2xl text-xs font-black flex items-center space-x-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-[#E8F8F0] border-1.5 border-[#00C853] text-[#00C853] p-4 rounded-2xl text-xs font-black flex items-center space-x-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00C853]" />
              <span>{success} Redirecting to login...</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#684E67] font-extrabold mb-1">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold focus:border-[#FF2A6D] focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#684E67] hover:text-[#FF2A6D]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#684E67] font-extrabold mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-[#2A0826] font-bold focus:border-[#FF2A6D] focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#684E67] hover:text-[#FF2A6D]"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-3d-rose-pop py-4 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2.5 mt-6 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-white animate-pulse" />
              <span>{isLoading ? 'UPDATING PASSWORD...' : 'SAVE NEW PASSWORD'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/auth?mode=login"
              className="text-xs font-black text-[#FF2A6D] hover:underline"
            >
              ← Return to Login
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AppLayout fullScreen>
          <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center font-black text-xs text-[#2A0826]">
            Loading Reset Password Page...
          </div>
        </AppLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
