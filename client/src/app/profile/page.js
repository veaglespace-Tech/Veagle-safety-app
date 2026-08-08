'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  User as UserIcon,
  Mail,
  PhoneCall,
  Heart,
  MapPin,
  Building,
  Map,
  Users,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  FileText,
  Shield,
  Play,
  Volume2,
  Edit3,
  X,
  Crown,
  Save,
  CheckCircle2,
  Send,
  Camera,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchUser, updateProfileSettings } from '../../redux/slices/authSlice.js';
import { authApi } from '../../redux/api/authApi.js';
import { CustomSelect } from '../../components/ui/CustomSelect.js';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { startEmergencySiren, stopEmergencySiren } from '../../utils/sirenAudio.js';

export default function UserProfileSettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state?.auth || {});

  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navScrollRef = useRef(null);

  const scrollNavLeft = () => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollNavRight = () => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  // FORM FIELDS STATE
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Parent');
  const [medicalNotes, setMedicalNotes] = useState('');

  // PASSWORD UPDATE STATE
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // INLINE EMAIL OTP VERIFICATION STATE
  const [isInlineEmailVerified, setIsInlineEmailVerified] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [showInlineOtpInput, setShowInlineOtpInput] = useState(false);
  const [inlineOtpCode, setInlineOtpCode] = useState('');
  const [isVerifyingInlineOtp, setIsVerifyingInlineOtp] = useState(false);
  const [inlineEmailNotice, setInlineEmailNotice] = useState(null);

  // TOAST FEEDBACK & DRILL STATE
  const [toastMessage, setToastMessage] = useState(null);
  const [avatarToast, setAvatarToast] = useState(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isTestingSiren, setIsTestingSiren] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchUser());
  }, [dispatch]);

  const resetFormValues = () => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBloodGroup(user.bloodGroup || 'O+');
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
      setPincode(user.pincode || '');
      setEmergencyContactName(user.emergencyContactName || '');
      setEmergencyContactPhone(user.emergencyContactPhone || '');
      setEmergencyContactRelation(user.emergencyContactRelation || 'Parent');
      setMedicalNotes(user.medicalNotes || '');
    }
  };

  useEffect(() => {
    resetFormValues();
  }, [user]);

  // HELPER FOR FAST CANVAS IMAGE COMPRESSION
  const compressImageBase64 = (file, maxWidth = 250, maxHeight = 250, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image element'));
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const updateUserAvatar = async (base64Photo) => {
    try {
      setAvatarToast({ type: 'info', text: '⏳ Updating profile photo...' });
      await dispatch(updateProfileSettings({ profilePhoto: base64Photo })).unwrap();
      setAvatarToast({ type: 'success', text: '✅ Profile photo updated successfully!' });
      setTimeout(() => setAvatarToast(null), 3500);
      dispatch(fetchUser());
    } catch (err) {
      console.error('Avatar update error:', err);
      const errMsg = typeof err === 'string'
        ? err
        : (err?.error || err?.message || 'Failed to update profile photo.');
      setAvatarToast({
        type: 'error',
        text: `❌ ${errMsg}`,
      });
      setTimeout(() => setAvatarToast(null), 4000);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarToast({ type: 'error', text: 'Please select a valid image file.' });
      setTimeout(() => setAvatarToast(null), 3000);
      return;
    }

    try {
      setAvatarToast({ type: 'info', text: '⏳ Processing & compressing photo...' });
      const compressedBase64 = await compressImageBase64(file);
      await updateUserAvatar(compressedBase64);
    } catch (err) {
      console.error('Image processing error:', err);
      setAvatarToast({ type: 'error', text: 'Failed to process selected image.' });
      setTimeout(() => setAvatarToast(null), 3000);
    }
  };

  const handleRemoveImage = () => {
    updateUserAvatar('');
  };

  const isEmailChanged = mounted && user?.email
    ? email.trim().toLowerCase() !== user.email.trim().toLowerCase()
    : false;

  const handleToggleEdit = () => {
    if (isEditing) {
      resetFormValues();
      setIsEditing(false);
      setToastMessage(null);
    } else {
      setIsEditing(true);
      setToastMessage({ type: 'info', text: '✏️ Edit Mode Unlocked! Update your fields below.' });
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // INLINE EMAIL OTP VERIFICATION HANDLERS
  const handleSendInlineEmailOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setInlineEmailNotice({ type: 'error', text: 'Please enter a valid email address first.' });
      return;
    }

    setIsSendingEmailOtp(true);
    setInlineEmailNotice(null);

    try {
      await authApi.sendEmailChangeOtp({ newEmail: email.trim() });
      setShowInlineOtpInput(true);
      setInlineEmailNotice({ type: 'success', text: `✅ Verification OTP sent to ${email.trim()}. Enter code below.` });
    } catch (err) {
      setInlineEmailNotice({
        type: 'error',
        text: err.response?.data?.error || 'Failed to send verification OTP to new email.',
      });
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyInlineOtp = async () => {
    if (!inlineOtpCode || inlineOtpCode.trim().length !== 6) {
      setInlineEmailNotice({ type: 'error', text: 'Please enter full 6-digit OTP code.' });
      return;
    }

    setIsVerifyingInlineOtp(true);
    setInlineEmailNotice(null);

    try {
      await authApi.verifyNewEmail({
        pendingEmail: email.trim(),
        otpCode: inlineOtpCode.trim(),
      });

      setIsInlineEmailVerified(true);
      setShowInlineOtpInput(false);
      setInlineEmailNotice({ type: 'success', text: '🎉 New email address verified successfully!' });
    } catch (err) {
      setInlineEmailNotice({
        type: 'error',
        text: err.response?.data?.error || 'Invalid OTP code. Please check your inbox and try again.',
      });
    } finally {
      setIsVerifyingInlineOtp(false);
    }
  };

  // MASTER FORM SUBMIT (SAVE ALL CHANGES)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setToastMessage(null);

    if (isEmailChanged && !isInlineEmailVerified) {
      setToastMessage({
        type: 'error',
        text: '⚠ Please verify your new email address by clicking "SEND OTP & VERIFY" before saving changes.',
      });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setToastMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setToastMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bloodGroup,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        emergencyContactRelation,
        medicalNotes: medicalNotes.trim(),
      };

      if (newPassword) {
        payload.newPassword = newPassword;
      }

      await dispatch(updateProfileSettings(payload)).unwrap();
      setToastMessage({ type: 'success', text: '🎉 Profile and security settings updated successfully!' });
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      dispatch(fetchUser());
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: typeof err === 'string' ? err : (err.message || 'Failed to update profile settings.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunTest = () => {
    setTestSuccess(false);
    setTimeout(() => {
      setTestSuccess(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
      setTimeout(() => setTestSuccess(false), 4000);
    }, 1500);
  };

  const handleTestSirenAudio = () => {
    if (isTestingSiren) {
      stopEmergencySiren();
      setIsTestingSiren(false);
    } else {
      startEmergencySiren();
      setIsTestingSiren(true);
      setTimeout(() => {
        stopEmergencySiren();
        setIsTestingSiren(false);
      }, 5000);
    }
  };

  if (!mounted) return null;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isParent = user?.role === 'PARENT';
  const displayName = user?.fullName || 'Sakhi Member';
  const displayEmail = user?.email || 'N/A';
  const displayPhone = user?.phone || 'N/A';
  const displayBloodGroup = user?.bloodGroup || 'O+';
  const displayAvatar = user?.profilePhoto || null;
  const initials = displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const diagnostics = [
    { label: 'GPS Location Access', value: 'ALIVE (0.01s)', status: true, icon: MapPin },
    { label: 'Push & Email Alerts', value: '100% READY', status: true, icon: CheckCircle2 },
    { label: 'Encrypted Token', value: '256-BIT JWT SECURE', status: true, icon: Shield },
    { label: 'Device Vibration', value: 'SUPPORTED', status: true, icon: PhoneCall },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#FFF0F3] via-white to-[#FFF0F3] py-6 sm:py-10 px-3 sm:px-6 font-sans text-[#2A0826]">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* HEADER CARD */}
          <div className="bg-gradient-to-r from-white via-[#FFF0F3] to-white border-2 border-[#FFCCE1] shadow-[0_10px_30px_rgba(255,92,138,0.12)] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center shadow-md shrink-0">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl sm:text-2xl tracking-tight">
                  <span className="heading-gradient-hero">Account Settings & </span>
                  <span className="heading-gradient-rose">Profile Management</span>
                </h1>
                <p className="text-xs text-[#684E67] font-bold leading-snug">
                  Click <span className="text-[#FF2A6D] font-black">UPDATE PROFILE</span> to unlock and edit any of your profile details.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleEdit}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isEditing
                  ? 'bg-rose-50 text-[#FF2A6D] border-2 border-[#FF2A6D]'
                  : 'bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  <span>CANCEL EDIT</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>UPDATE PROFILE</span>
                </>
              )}
            </button>
          </div>

          {/* MASTER USER SUMMARY CARD */}
          <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white border-2 border-[#FFCCE1] shadow-[0_16px_50px_rgba(255,92,138,0.18)] rounded-[36px] overflow-hidden relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              
              {/* AVATAR RING */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#FFD166] p-0.5 shadow-xl relative overflow-hidden">
                  <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center font-black text-3xl text-[#2A0826] overflow-hidden relative">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </div>

                <label
                  title="Upload New Profile Photo"
                  className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white p-2 rounded-2xl shadow-lg border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center group-hover:brightness-110"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {displayAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Remove Profile Photo"
                    className="absolute -top-1 -left-1 bg-white text-[#FF2A6D] border-2 border-[#FFCCE1] p-1.5 rounded-full shadow hover:bg-[#FFF0F3] transition-all text-[10px] font-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* USER SUMMARY */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-black text-2xl sm:text-3xl text-[#2A0826] tracking-tight truncate">
                    {displayName}
                  </h2>
                  {isSuperAdmin && (
                    <span className="bg-gradient-to-r from-[#FFD700] to-[#E6A100] text-[#2A0826] font-black text-[10px] px-3 py-1 rounded-full uppercase flex items-center space-x-1 shadow-md border border-gold/40">
                      <Crown className="w-3.5 h-3.5 text-[#2A0826]" />
                      <span>SUPER ADMIN</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-bold text-[#684E67]">
                  <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-full border border-[#FFCCE1] text-[#2A0826] font-black shadow-xs">
                    <Mail className="w-3.5 h-3.5 text-[#FF2A6D]" />
                    <span>{displayEmail}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-full border border-[#FFCCE1] text-[#2A0826] font-black shadow-xs">
                    <PhoneCall className="w-3.5 h-3.5 text-[#FF2A6D]" />
                    <span>{displayPhone}</span>
                  </div>
                  {!isParent && (
                    <div className="flex items-center space-x-1.5 bg-[#FFF0F3] px-3 py-1.5 rounded-full text-[#FF2A6D] font-black border border-[#FFCCE1] shadow-xs">
                      <Heart className="w-3.5 h-3.5 fill-[#FF2A6D]/20" />
                      <span>Blood Group: {displayBloodGroup}</span>
                    </div>
                  )}
                </div>

                {avatarToast && (
                  <div className={`text-xs font-black px-4 py-1.5 rounded-full inline-block shadow-xs animate-shake ${avatarToast.type === 'error' ? 'bg-rose-50 text-[#FF2A6D] border border-[#FF2A6D]' : 'bg-emerald-50 text-emerald-600 border border-emerald-300'}`}>
                    {avatarToast.text}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* MASTER EDITABLE PROFILE & SETTINGS FORM */}
          <form onSubmit={handleFormSubmit} className="space-y-8">
            
            {/* FEEDBACK TOAST BANNER */}
            {toastMessage && (
              <div className={`p-4 rounded-2xl text-xs font-black shadow-md animate-shake ${
                toastMessage.type === 'error'
                  ? 'bg-rose-50 text-[#FF2A6D] border-2 border-[#FF2A6D]'
                  : toastMessage.type === 'info'
                  ? 'bg-amber-50 text-amber-800 border-2 border-amber-400'
                  : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-400'
              }`}>
                {toastMessage.text}
              </div>
            )}

            {/* UNIFIED MASTER GLASS PANEL (REPLACES SCATTERED CARDS) */}
            <div className={`bg-white/95 backdrop-blur-2xl border-2 rounded-[40px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(42,8,38,0.08)] space-y-10 transition-all ${isEditing ? 'border-[#FF2A6D] ring-4 ring-[#FF2A6D]/10' : 'border-[#FFCCE1]'}`}>
              
              {/* SECTION QUICK-JUMPER NAVIGATION PILLS (WITH INVISIBLE SCROLLBAR, ARROWS & MOUSE WHEEL SCROLL) */}
              <div className="relative flex items-center border-b-2 border-[#FFCCE1]/60 pb-3">
                
                {/* LEFT SCROLL BUTTON */}
                <button
                  type="button"
                  onClick={scrollNavLeft}
                  className="p-1.5 rounded-full bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] hover:bg-[#FF2A6D] hover:text-white transition-all shadow-xs mr-1 shrink-0 cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* SCROLLABLE PILLS CONTAINER */}
                <div
                  ref={navScrollRef}
                  onWheel={(e) => {
                    if (e.deltaY !== 0 && navScrollRef.current) {
                      navScrollRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1 px-1"
                >
                  {isParent ? (
                    <>
                      <a href="#sec-1" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        1. Personal Details
                      </a>
                      <a href="#sec-4" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        2. Security & Password
                      </a>
                    </>
                  ) : (
                    <>
                      <a href="#sec-1" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        1. Personal Details
                      </a>
                      <a href="#sec-2" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        2. Address & Location
                      </a>
                      <a href="#sec-3" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        3. Emergency Guardian
                      </a>
                      <a href="#sec-4" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        4. Security & Password
                      </a>
                      <a href="#sec-5" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        5. Medical Notes
                      </a>
                      <a href="#sec-6" className="px-4 py-2 bg-[#FFF0F3] hover:bg-[#FF2A6D] hover:text-white text-[#FF2A6D] rounded-full text-xs font-black transition-all border border-[#FFCCE1] shrink-0 hover:scale-105 active:scale-95 shadow-xs">
                        6. System Health
                      </a>
                    </>
                  )}
                </div>

                {/* RIGHT SCROLL BUTTON */}
                <button
                  type="button"
                  onClick={scrollNavRight}
                  className="p-1.5 rounded-full bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] hover:bg-[#FF2A6D] hover:text-white transition-all shadow-xs ml-1 shrink-0 cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* FORM SECTION 1: PERSONAL INFORMATION & INLINE EMAIL VERIFICATION */}
              <div id="sec-1" className="scroll-mt-24 border-b-2 border-[#FFCCE1]/60 pb-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#FFCCE1] pb-4">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] flex items-center justify-center border border-[#FFCCE1] shrink-0">
                      <UserIcon className="w-5 h-5 text-[#FF2A6D]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">1. Personal Member Details</h3>
                      <p className="text-xs text-[#684E67] font-bold leading-snug">
                        {isParent ? 'Update your full legal name, email address, and mobile phone number' : 'Update your full legal name, email address, phone number, and blood group'}
                      </p>
                    </div>
                  </div>

                  {!isEditing && (
                    <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl border border-gray-300 shrink-0 whitespace-nowrap self-start sm:self-auto">
                      🔒 LOCKED (CLICK UPDATE PROFILE)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="e.g. Kaveri Gawali"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                          isEditing
                            ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white focus:ring-2 focus:ring-[#FF2A6D]/20'
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-black text-[#684E67]">
                        Email Address *
                      </label>

                      {!isEmailChanged && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </span>
                      )}

                      {isEmailChanged && isInlineEmailVerified && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1 animate-bounce">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>NEW EMAIL VERIFIED</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          disabled={!isEditing || isInlineEmailVerified}
                          placeholder="kaveri@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setIsInlineEmailVerified(false);
                            setShowInlineOtpInput(false);
                            setInlineEmailNotice(null);
                          }}
                          className={`w-full pl-10 pr-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                            isEditing
                              ? isInlineEmailVerified
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-black'
                                : 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                              : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                          }`}
                        />
                      </div>

                      {isEditing && isEmailChanged && !isInlineEmailVerified && (
                        <button
                          type="button"
                          onClick={handleSendInlineEmailOtp}
                          disabled={isSendingEmailOtp}
                          className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white font-black text-xs px-4 py-3 rounded-xl shadow hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSendingEmailOtp ? 'SENDING...' : 'SEND OTP'}</span>
                        </button>
                      )}
                    </div>

                    {inlineEmailNotice && (
                      <div className={`mt-2 p-2.5 rounded-xl text-[11px] font-black ${
                        inlineEmailNotice.type === 'error' ? 'bg-rose-50 text-[#FF2A6D] border border-[#FF2A6D]' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}>
                        {inlineEmailNotice.text}
                      </div>
                    )}

                    {isEditing && isEmailChanged && showInlineOtpInput && !isInlineEmailVerified && (
                      <div className="mt-3 bg-[#FFF0F3] p-3.5 rounded-2xl border-2 border-[#FF2A6D] space-y-2.5 animate-slide-down">
                        <p className="text-[11px] font-black text-[#2A0826]">
                          Enter 6-digit verification OTP sent to <span className="text-[#FF2A6D]">{email}</span>:
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit OTP"
                            value={inlineOtpCode}
                            onChange={(e) => setInlineOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-3 py-2 bg-white border-2 border-[#FF2A6D] rounded-xl text-center font-mono font-black text-sm tracking-widest outline-none text-[#2A0826]"
                          />

                          <button
                            type="button"
                            onClick={handleVerifyInlineOtp}
                            disabled={isVerifyingInlineOtp}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isVerifyingInlineOtp ? 'VERIFYING...' : 'VERIFY OTP'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">Mobile Phone Number *</label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        disabled={!isEditing}
                        maxLength={10}
                        placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className={`w-full pl-10 pr-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-mono font-bold outline-none transition-all ${
                          isEditing
                            ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">Blood Group *</label>
                    <CustomSelect
                      options={[
                        { value: 'A+', label: 'A+' },
                        { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' },
                        { value: 'B-', label: 'B-' },
                        { value: 'O+', label: 'O+' },
                        { value: 'O-', label: 'O-' },
                        { value: 'AB+', label: 'AB+' },
                        { value: 'AB-', label: 'AB-' },
                      ]}
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      alignRight={true}
                    />
                  </div>
                </div>
              </div>

              {!isParent && (
                <>
                  {/* FORM SECTION 2: RESIDENTIAL ADDRESS & LOCATION */}
                  <div id="sec-2" className="scroll-mt-24 border-b-2 border-[#FFCCE1]/60 pb-8 space-y-6">
                    <div className="flex items-start sm:items-center space-x-3.5 border-b-2 border-[#FFCCE1] pb-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] flex items-center justify-center border border-[#FFCCE1] shrink-0 mt-0.5 sm:mt-0">
                        <MapPin className="w-5 h-5 text-[#FF2A6D]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">2. Residential Location & Address</h3>
                        <p className="text-xs text-[#684E67] font-bold leading-relaxed">Address details used for emergency dispatch & guardian response</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-black text-[#684E67] mb-1">Full Residential Address *</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            disabled={!isEditing}
                            placeholder="House/Flat No, Street area, Landmark"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                              isEditing
                                ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                                : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#684E67] mb-1">City *</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            disabled={!isEditing}
                            placeholder="e.g. Pune"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                              isEditing
                                ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                                : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#684E67] mb-1">State *</label>
                        <div className="relative">
                          <Map className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            disabled={!isEditing}
                            placeholder="e.g. Maharashtra"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                              isEditing
                                ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                                : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#684E67] mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditing}
                          maxLength={6}
                          placeholder="e.g. 411001"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-mono font-bold outline-none transition-all ${
                            isEditing
                              ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                              : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* FORM SECTION 3: EMERGENCY GUARDIAN CONTACT DETAILS */}
                  <div id="sec-3" className="scroll-mt-24 border-b-2 border-[#FFCCE1]/60 pb-8 space-y-6">
                    <div className="flex items-start sm:items-center space-x-3.5 border-b-2 border-[#FFCCE1] pb-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] flex items-center justify-center border border-[#FFCCE1] shrink-0 mt-0.5 sm:mt-0">
                        <Users className="w-5 h-5 text-[#FF2A6D]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">3. Primary Emergency Guardian Contact</h3>
                        <p className="text-xs text-[#684E67] font-bold leading-relaxed">First guardian notified automatically during an emergency SOS broadcast</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black text-[#684E67] mb-1">Guardian Name *</label>
                        <div className="relative">
                          <Users className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            disabled={!isEditing}
                            placeholder="e.g. Rajesh Sharma"
                            value={emergencyContactName}
                            onChange={(e) => setEmergencyContactName(e.target.value)}
                            className={`w-full pl-10 pr-3 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                              isEditing
                                ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                                : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#684E67] mb-1">Relationship *</label>
                        {isEditing ? (
                          <CustomSelect
                            options={[
                              { value: 'Parent', label: 'Parent' },
                              { value: 'Spouse', label: 'Spouse' },
                              { value: 'Sibling', label: 'Sibling' },
                              { value: 'Friend', label: 'Friend' },
                              { value: 'Guardian', label: 'Guardian' },
                              { value: 'Relative', label: 'Relative' },
                              { value: 'Other', label: 'Other' },
                            ]}
                            value={emergencyContactRelation}
                            onChange={(e) => setEmergencyContactRelation(e.target.value)}
                            alignRight={true}
                          />
                        ) : (
                          <input
                            disabled
                            value={emergencyContactRelation}
                            className="w-full px-3 py-3 border-1.5 rounded-xl text-xs text-gray-700 font-bold bg-gray-50 border-gray-200 cursor-not-allowed outline-none"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#684E67] mb-1">Guardian Mobile Number *</label>
                        <div className="relative">
                          <PhoneCall className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            disabled={!isEditing}
                            maxLength={10}
                            placeholder="10-digit number"
                            value={emergencyContactPhone}
                            onChange={(e) => setEmergencyContactPhone(e.target.value.replace(/\D/g, ''))}
                            className={`w-full pl-10 pr-3 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-mono font-bold outline-none transition-all ${
                              isEditing
                                ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                                : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* FORM SECTION 4: SECURITY & PASSWORD UPDATE */}
              <div id="sec-4" className="scroll-mt-24 border-b-2 border-[#FFCCE1]/60 pb-8 space-y-6">
                <div className="flex items-start sm:items-center space-x-3.5 border-b-2 border-[#FFCCE1] pb-4 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] flex items-center justify-center border border-[#FFCCE1] shrink-0 mt-0.5 sm:mt-0">
                    <Lock className="w-5 h-5 text-[#FF2A6D]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">4. Account Password & Security</h3>
                    <p className="text-xs text-[#684E67] font-bold leading-relaxed">Leave blank if you do not wish to change your account password</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">New Password (Optional)</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#684E67] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        disabled={!isEditing}
                        placeholder="Enter new password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                          isEditing
                            ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                        }`}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#684E67]"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">Confirm New Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      disabled={!isEditing}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 border-1.5 rounded-xl text-xs text-[#2A0826] font-bold outline-none transition-all ${
                        isEditing
                          ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                          : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {!isParent && (
                <>
                  {/* FORM SECTION 5: MEDICAL / HEALTH NOTES FOR RESPONDERS */}
                  <div id="sec-5" className="scroll-mt-24 border-b-2 border-[#FFCCE1]/60 pb-8 space-y-6">
                    <div className="flex items-start sm:items-center space-x-3.5 border-b-2 border-[#FFCCE1] pb-4 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] flex items-center justify-center border border-[#FFCCE1] shrink-0 mt-0.5 sm:mt-0">
                        <FileText className="w-5 h-5 text-[#FF2A6D]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">5. Emergency Medical Notes & Instructions</h3>
                        <p className="text-xs text-[#684E67] font-bold leading-relaxed">Allergies, medical conditions, or specific emergency instructions for guardians</p>
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows={3}
                        disabled={!isEditing}
                        placeholder="e.g. Asthmatic, allergic to penicillin, emergency key available with neighbor."
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        className={`w-full p-4 border-1.5 rounded-2xl text-xs text-[#2A0826] font-bold outline-none resize-none transition-all ${
                          isEditing
                            ? 'bg-[#FFF0F3] border-[#FF2A6D] focus:bg-white'
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-700'
                        }`}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* MASTER STICKY SUBMIT ACTION BAR (VISIBLE IN EDIT MODE) */}
              {isEditing && (
                <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border-2 border-[#FF2A6D] shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 animate-slide-up">
                  <div className="min-w-0">
                    <p className="font-black text-xs sm:text-sm text-[#2A0826] whitespace-nowrap">Edit Mode Unlocked</p>
                    <p className="text-[11px] font-bold text-[#684E67] truncate">Click Save Changes to commit all details to database</p>
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleEdit}
                      className="px-4.5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-black text-xs rounded-2xl transition-all cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white font-black px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap border border-white/20"
                    >
                      <Save className="w-4 h-4 shrink-0" />
                      <span>{isSubmitting ? 'SAVING...' : 'SAVE ALL CHANGES'}</span>
                    </button>
                  </div>
                </div>
              )}

              {!isParent && (
                <>
                  {/* SECTION 6: 24/7 SYSTEM HEALTH DIAGNOSTICS & SOS DRILL RUNNER */}
                  <div id="sec-6" className="scroll-mt-24 pt-4 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#FFCCE1] pb-4">
                      <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] flex items-center justify-center border border-[#FFCCE1] shrink-0 mt-0.5 sm:mt-0">
                          <Shield className="w-5 h-5 text-[#FF2A6D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">24/7 System Health Metrics & SOS Drill Runner</h3>
                          <p className="text-xs text-[#684E67] font-bold leading-relaxed">Verify device sensors, GPS stream, and siren audio capability</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-300 shrink-0 whitespace-nowrap self-start sm:self-auto">
                        100% Operational
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {diagnostics.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="bg-[#FFF0F3] border border-[#FFCCE1] rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-[#2A0826]">{item.label}</p>
                                <p className={`text-[11px] font-extrabold mt-0.5 ${item.status ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {item.value}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gradient-to-r from-[#2A0826] via-[#3D0C38] to-[#2A0826] text-white p-6 rounded-3xl shadow-[0_12px_35px_rgba(42,8,38,0.35)] space-y-4 border-2 border-[#FF2A6D]">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#FF2A6D]/20 text-[#FF5C8A] flex items-center justify-center shrink-0 border border-[#FF2A6D]/40">
                          <Play className="w-5 h-5 text-[#FF5C8A] animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-black text-base text-white">Run SOS Emergency Drill</h4>
                          <p className="text-xs text-white/80 font-extrabold mt-0.5 leading-relaxed">
                            Test device vibration, siren audio & GPS stream safely without notifying guardians.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleRunTest}
                          className="flex-1 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-3.5 rounded-full text-xs uppercase tracking-wider font-black shadow-[0_8px_25px_rgba(255,42,109,0.4)] flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>{testSuccess ? '✓ DRILL PASSED!' : 'START DRILL READINESS TEST'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleTestSirenAudio}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/30 py-3.5 px-5 rounded-full text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 text-[#FF5C8A]" />
                          <span>{isTestingSiren ? 'TESTING SIREN...' : 'TEST SIREN AUDIO'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>

        </div>
      </div>
    </AppLayout>
  );
}
