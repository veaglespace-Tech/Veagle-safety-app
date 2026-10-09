'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '../../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../../components/admin/AdminHeaderNav.js';
import { api } from '../../../../utils/api.js';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  Crown,
  Edit3,
  Trash2,
  PhoneCall,
  Mail,
  MapPin,
  AlertOctagon,
  Plus,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  Camera,
  Upload,
  UserPlus,
} from 'lucide-react';
import { CustomSelect } from '../../../../components/ui/CustomSelect.js';

const RELATIONSHIPS = [
  'Sister',
  'Mother',
  'Father',
  'Brother',
  'Friend',
  'Spouse',
  'Guardian',
  'Colleague',
];

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // MODAL STATES
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // EDIT USER FORM STATE
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'USER',
    profilePhoto: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ASSIGN / RENEW PLAN FORM STATE
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customDays, setCustomDays] = useState('365');

  // ADMIN CONTACT MANAGEMENT STATE
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: 'Sister',
    phone: '',
    email: '',
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUserDetails = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/users/${userId}`);
      setUserData(res.data.user || null);
      setAllPlans(res.data.allPlans || []);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUserDetails();
  }, [userId]);

  const openEditModal = () => {
    if (!userData) return;
    setEditForm({
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'USER',
      profilePhoto: userData.profilePhoto || '',
      bloodGroup: userData.bloodGroup || '',
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      pincode: userData.pincode || '',
      emergencyContactName: userData.emergencyContactName || '',
      emergencyContactPhone: userData.emergencyContactPhone || '',
      medicalNotes: userData.medicalNotes || '',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const compressImageBase64 = (file, maxWidth = 500, maxHeight = 500, quality = 0.82) => {
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

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select a valid image file');
        return;
      }
      try {
        const compressedBase64 = await compressImageBase64(file);
        setEditForm((prev) => ({ ...prev, profilePhoto: compressedBase64 }));
      } catch (err) {
        showToast('error', 'Failed to process selected image file');
      }
    }
  };

  const handleSaveProfileEdit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.put(`/admin/users/${userId}`, editForm);
      showToast('success', res.data.message || 'Member profile updated successfully');
      setIsEditModalOpen(false);
      fetchUserDetails();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!userData) return;
    const isBlocked = userData.safetyStatus === 'BLOCKED';
    const action = isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} "${userData.fullName}"?`)) return;

    try {
      const res = await api.post(`/admin/users/${userId}/block`);
      showToast('success', res.data.message);
      fetchUserDetails();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to toggle block status');
    }
  };

  const handleAssignFreePlan = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        planId: selectedPlanId ? parseInt(selectedPlanId, 10) : undefined,
        durationDays: selectedPlanId ? undefined : parseInt(customDays, 10) || 365,
      };

      const res = await api.post(`/admin/users/${userId}/grant-subscription`, payload);
      showToast(
        'success',
        res.data.message || 'Plan assigned successfully (Free Admin Grant - ₹0)'
      );
      setIsPlanModalOpen(false);
      fetchUserDetails();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to assign plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADMIN CONTACT HANDLERS
  const openAddContactModal = () => {
    setEditingContact(null);
    setContactForm({ name: '', relationship: 'Sister', phone: '', email: '' });
    setIsContactModalOpen(true);
  };

  const openEditContactModal = (c) => {
    setEditingContact(c);
    setContactForm({
      name: c.name || '',
      relationship: c.relationship || 'Sister',
      phone: c.phone || '',
      email: c.email || '',
    });
    setIsContactModalOpen(true);
  };

  const handleSaveAdminContact = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingContact) {
        await api.put(`/admin/contacts/${editingContact.id}`, contactForm);
        showToast('success', 'Trusted contact updated successfully');
      } else {
        await api.post(`/admin/users/${userId}/contacts`, contactForm);
        showToast('success', 'Trusted contact added successfully');
      }
      setIsContactModalOpen(false);
      fetchUserDetails();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save trusted contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdminContact = async (contactId, contactName) => {
    if (!confirm(`Are you sure you want to remove "${contactName}" from trusted contacts?`)) return;
    try {
      await api.delete(`/admin/contacts/${contactId}`);
      showToast('success', 'Trusted contact removed successfully');
      fetchUserDetails();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to remove contact');
    }
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#FF2A6D] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#684E67]">Loading member profile & details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!userData) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
          <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-[#2A0826]">Member Profile Not Found</h2>
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="px-5 py-2.5 bg-[#FF2A6D] text-white text-xs font-black rounded-xl cursor-pointer"
          >
            Back to User Management
          </button>
        </div>
      </AppLayout>
    );
  }

  const isBlocked = userData.safetyStatus === 'BLOCKED';
  const isActiveSub = userData.subscriptionStatus === 'ACTIVE';
  const expiresAt = userData.subscriptionExpiresAt
    ? new Date(userData.subscriptionExpiresAt)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : true;

  let daysRemaining = 0;
  if (expiresAt && !isExpired) {
    const diffTime = Math.abs(expiresAt - new Date());
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* TOP BACK BUTTON & NAVIGATION */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="inline-flex items-center space-x-2 text-xs font-black text-[#684E67] hover:text-[#FF2A6D] transition-colors cursor-pointer bg-white px-4 py-2.5 rounded-2xl border border-[#FFCCE1] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Members</span>
          </button>

          <span className="text-xs font-bold text-gray-500">Member ID #{userData.id}</span>
        </div>

        <AdminHeaderNav metrics={{ totalUsers: 1 }} toast={toast} activeTabOverride="users" />

        {/* MEMBER PROFILE HEADER CARD */}
        <div className="bg-white rounded-[36px] border-2 border-[#FFCCE1] p-5 sm:p-8 shadow-xl relative overflow-hidden space-y-6 animate-fade-up">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 pt-2 text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 w-full lg:w-auto">
              {/* PROFILE PHOTO AVATAR WITH PREVIEW & FALLBACK */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[#FF2A6D]/30 border-2 border-white shrink-0 overflow-hidden mx-auto sm:mx-0">
                {userData.profilePhoto ? (
                  <img
                    src={userData.profilePhoto}
                    alt={userData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : userData.fullName ? (
                  userData.fullName.charAt(0).toUpperCase()
                ) : (
                  'U'
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#2A0826] tracking-tight">
                    {userData.fullName}
                  </h2>
                  {userData.role === 'SUPER_ADMIN' ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-3 py-0.5 rounded-full uppercase">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>SUPERADMIN</span>
                    </span>
                  ) : userData.role === 'ORGANIZATION' ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 px-3 py-0.5 rounded-full uppercase">
                      <span>ORGANIZATION HQ</span>
                    </span>
                  ) : userData.role === 'PARENT' ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-300 px-3 py-0.5 rounded-full uppercase">
                      <span>PARENT GUARDIAN</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-3 py-0.5 rounded-full uppercase">
                      SAKHI MEMBER
                    </span>
                  )}

                  {isBlocked ? (
                    <span className="text-[10px] font-black bg-rose-600 text-white px-3 py-0.5 rounded-full uppercase">
                      ACCOUNT BLOCKED
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-black px-3 py-0.5 rounded-full uppercase ${
                        isActiveSub && !isExpired
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                          : 'bg-rose-50 text-rose-600 border border-rose-300'
                      }`}
                    >
                      {isActiveSub && !isExpired ? 'ACTIVE PROTECTION' : 'PLAN EXPIRED'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-[#684E67] font-bold">
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#FF2A6D] shrink-0" />
                    <span>{userData.email}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-[#FF2A6D] shrink-0" />
                    <span>{userData.phone || 'No Phone'}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF2A6D] shrink-0" />
                    <span>
                      {userData.city || 'Pune'}, {userData.state || 'Maharashtra'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-end gap-2.5 w-full lg:w-auto pt-2 lg:pt-0">
              <button
                type="button"
                onClick={openEditModal}
                className="px-4 py-2.5 bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] rounded-2xl text-xs font-black hover:bg-[#FF2A6D] hover:text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>EDIT PROFILE & PHOTO</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPlanModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-xs font-black hover:scale-105 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20 w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>ASSIGN / RENEW PLAN (FREE)</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBlock}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm w-full sm:w-auto ${
                  isBlocked
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white'
                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-600 hover:text-white'
                }`}
              >
                {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isBlocked ? 'UNBLOCK ACCOUNT' : 'BLOCK ACCOUNT'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* DETAILED SECTIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: PERSONAL, ADDRESS & SUBSCRIPTION DETAILS */}
          <div className="lg:col-span-2 space-y-8">
            {/* SUBSCRIPTION & PLAN STATUS CARD */}
            <div className="bg-white p-5 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#FFCCE1] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-[#2A0826]">
                      Current Subscription & Plan
                    </h3>
                    <p className="text-xs text-[#684E67] font-bold">
                      Admin can assign or renew any plan for free at 0 cost
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer w-full sm:w-auto shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>UPDATE / RENEW PLAN (FREE)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FFF0F3]/60 p-5 rounded-3xl border border-[#FFCCE1]">
                <div>
                  <span className="text-[10px] font-black text-[#684E67] uppercase block mb-1">
                    Plan Status
                  </span>
                  <span
                    className={`inline-block text-xs font-black px-3 py-1 rounded-full uppercase ${
                      isActiveSub && !isExpired
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isActiveSub && !isExpired ? 'ACTIVE' : 'INACTIVE / EXPIRED'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black text-[#684E67] uppercase block mb-1">
                    Validity Expiry Date
                  </span>
                  <p className="text-xs font-black text-[#2A0826]">
                    {expiresAt
                      ? expiresAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No Active Plan'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black text-[#684E67] uppercase block mb-1">
                    Days Remaining
                  </span>
                  <p className="text-xs font-black text-[#FF2A6D]">
                    {isActiveSub && !isExpired ? `${daysRemaining} Days Left` : '0 Days'}
                  </p>
                </div>
              </div>
            </div>

            {/* PERSONAL & ADDRESS DETAILS */}
            <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-6">
              <h3 className="font-black text-lg text-[#2A0826] border-b border-[#FFCCE1] pb-3">
                Personal Profile & Address Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">Full Name</span>
                  <p className="font-black text-[#2A0826] text-sm">{userData.fullName}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">
                    Email Address
                  </span>
                  <p className="font-bold text-[#2A0826] text-sm">{userData.email}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">
                    Phone Number
                  </span>
                  <p className="font-bold text-[#2A0826]">{userData.phone || 'Not Specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">
                    Blood Group
                  </span>
                  <p className="font-bold text-[#FF2A6D]">{userData.bloodGroup || 'O+'}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">
                    Street Address
                  </span>
                  <p className="font-bold text-[#2A0826]">{userData.address || 'Not Specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">
                    City, State, Country & Pincode
                  </span>
                  <p className="font-bold text-[#2A0826]">
                    {userData.city || 'Pune'}, {userData.state || 'Maharashtra'},{' '}
                    {userData.country || 'India'} - {userData.pincode || '411001'}
                  </p>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="font-black text-[#684E67] uppercase text-[10px]">
                    Medical Notes & Allergies
                  </span>
                  <p className="font-bold text-[#2A0826] bg-[#FFF0F3] p-3 rounded-2xl border border-[#FFCCE1]">
                    {userData.medicalNotes ||
                      'No special medical conditions or allergies recorded.'}
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT TRANSACTION HISTORY */}
            <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-4">
              <h3 className="font-black text-lg text-[#2A0826] border-b border-[#FFCCE1] pb-3">
                Payment & Grant Audit History
              </h3>

              {userData.paymentHistories && userData.paymentHistories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FFF0F3] text-[10px] font-black text-[#684E67] uppercase">
                        <th className="p-3">Txn ID & Date</th>
                        <th className="p-3">Plan Name</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Mode</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FFCCE1]/60 font-extrabold text-[#2A0826]">
                      {userData.paymentHistories.map((p) => (
                        <tr key={p.id}>
                          <td className="p-3">
                            <p className="font-mono text-xs text-[#FF2A6D]">{p.txnid}</p>
                            <p className="text-[10px] text-gray-500 font-bold">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="p-3 font-bold">{p.plan?.name || 'Protection Plan'}</td>
                          <td className="p-3 font-mono font-black">₹{p.amount?.toFixed(2)}</td>
                          <td className="p-3 text-[11px] font-bold text-gray-600">
                            {p.paymentMode || 'ONLINE'}
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-bold text-center py-4">
                  No payment history recorded for this member.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT 1 COL: EMERGENCY GUARDIANS & TRUSTED CONTACTS */}
          <div className="space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-5">
              {/* STYLISH MODERN HEADER */}
              <div className="space-y-4 border-b border-[#FFCCE1] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center shadow-md shadow-[#FF2A6D]/20 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#2A0826]">Emergency Guardians</h3>
                    <p className="text-xs text-[#684E67] font-bold">
                      Trusted contact network ({userData.trustedContacts?.length || 0}/5)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openAddContactModal}
                  className="w-full py-3 bg-[#FFF0F3] hover:bg-[#FF2A6D] text-[#FF2A6D] hover:text-white border-2 border-dashed border-[#FFCCE1] hover:border-[#FF2A6D] rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs group"
                >
                  <Plus className="w-4 h-4 text-[#FF2A6D] group-hover:text-white transition-colors" />
                  <span>ADD NEW EMERGENCY GUARDIAN</span>
                </button>
              </div>

              {/* PRIMARY CONTACT */}
              <div className="bg-[#FFF0F3] p-4 rounded-2xl border border-[#FFCCE1] space-y-1">
                <span className="text-[10px] font-black text-[#FF2A6D] uppercase">
                  Primary Emergency Contact
                </span>
                <p className="font-black text-sm text-[#2A0826]">
                  {userData.emergencyContactName || 'Not Specified'}
                </p>
                <p className="text-xs font-bold text-[#684E67]">
                  {userData.emergencyContactPhone || 'No Phone'}
                </p>
              </div>

              {/* TRUSTED CONTACTS LIST WITH EDIT & DELETE */}
              <div className="space-y-3">
                <span className="text-xs font-black text-[#2A0826] block">
                  Verified Guardian Network ({userData.trustedContacts?.length || 0}/5):
                </span>
                {userData.trustedContacts && userData.trustedContacts.length > 0 ? (
                  userData.trustedContacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#FFCCE1] space-y-1 shadow-xs hover:border-[#FF5C8A] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="font-black text-xs text-[#2A0826]">{c.name}</p>
                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {c.relationship}
                          </span>
                        </div>

                        {/* ACTION BUTTONS FOR ADMIN */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditContactModal(c)}
                            className="p-1.5 rounded-lg text-[#684E67] hover:text-[#FF2A6D] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
                            title="Edit Guardian"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdminContact(c.id, c.name)}
                            className="p-1.5 rounded-lg text-[#684E67] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Guardian"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#684E67] font-bold">{c.phone}</p>
                      {c.email && (
                        <p className="text-[11px] text-[#FF2A6D] font-extrabold flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {c.email}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 font-bold italic">
                    No additional trusted contacts added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 1: EDIT PROFILE & PHOTO MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-lg w-full shadow-2xl border-2 border-[#FF2A6D] relative animate-scale-up overflow-hidden flex flex-col max-h-[90vh]">
              {/* STICKY HEADER */}
              <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] p-6 pb-4 bg-white shrink-0">
                <h3 className="font-black text-lg text-[#2A0826]">Edit Member Profile & Photo</h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* INNER SCROLLABLE CONTENT BODY */}
              <div className="p-6 sm:p-8 pb-36 overflow-y-auto flex-1 space-y-6">
                <form onSubmit={handleSaveProfileEdit} className="space-y-4">
                  {/* CLEAN PROFILE PHOTO UPLOAD CONTROL */}
                  <div className="bg-[#FFF0F3] p-4 rounded-2xl border border-[#FFCCE1] space-y-3">
                    <label className="block text-xs font-black text-[#2A0826]">
                      Member Profile Photo
                    </label>

                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black shadow overflow-hidden shrink-0 border-2 border-white">
                        {editForm.profilePhoto ? (
                          <img
                            src={editForm.profilePhoto}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF2A6D] text-white rounded-xl text-xs font-black hover:bg-[#E01A4F] transition-all cursor-pointer shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoFileChange}
                              className="hidden"
                            />
                          </label>

                          {editForm.profilePhoto && (
                            <button
                              type="button"
                              onClick={() => setEditForm((prev) => ({ ...prev, profilePhoto: '' }))}
                              className="px-3 py-2 bg-white text-rose-600 border border-rose-300 rounded-xl text-xs font-bold hover:bg-rose-50 cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold">
                          Supported: JPG, PNG, WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">Role</label>
                      <CustomSelect
                        options={[
                          { value: 'USER', label: 'Standard Sakhi Member' },
                          { value: 'ORGANIZATION', label: 'Organization HQ' },
                          { value: 'PARENT', label: 'Parent Guardian' },
                          { value: 'SUPER_ADMIN', label: 'SuperAdmin Dispatcher' },
                        ]}
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">
                        Blood Group
                      </label>
                      <CustomSelect
                        options={[
                          { value: 'A+', label: 'A+' },
                          { value: 'A-', label: 'A-' },
                          { value: 'B+', label: 'B+' },
                          { value: 'B-', label: 'B-' },
                          { value: 'AB+', label: 'AB+' },
                          { value: 'AB-', label: 'AB-' },
                          { value: 'O+', label: 'O+' },
                          { value: 'O-', label: 'O-' },
                        ]}
                        value={editForm.bloodGroup || 'O+'}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={editForm.emergencyContactName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, emergencyContactName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#684E67] mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="text"
                        value={editForm.emergencyContactPhone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, emergencyContactPhone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      Medical Notes & Conditions
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.medicalNotes}
                      onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
                      className="w-full p-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#FFCCE1]">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ASSIGN / RENEW SUBSCRIPTION PLAN (FREE) */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-emerald-500 relative animate-scale-up">
              <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-4">
                <div>
                  <h3 className="font-black text-lg text-[#2A0826]">
                    Assign / Renew Plan (Free Admin Grant)
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">
                    Zero cost grant for {userData.fullName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAssignFreePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Select System Subscription Plan *
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-500 rounded-xl text-xs font-black text-[#2A0826] outline-none cursor-pointer"
                  >
                    <option value="">Custom Duration Pass</option>
                    {allPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.durationDays} Days - Admin Grant ₹0)
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedPlanId && (
                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      Custom Duration (Days) *
                    </label>
                    <input
                      type="number"
                      required
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-emerald-500 rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                    />
                  </div>
                )}

                <div className="bg-emerald-50 p-4 rounded-2xl border border-[#A7F3D0] text-xs font-extrabold text-emerald-900 space-y-1">
                  <p className="flex items-center space-x-1.5 text-emerald-700 font-black">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Free Admin Upgrade & Renewal</span>
                  </p>
                  <p className="text-[11px] font-bold text-emerald-800">
                    This will immediately activate the member's protection plan until the new expiry
                    date. No charges or payment gateway will be invoked.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'UPGRADING...' : 'GRANT / RENEW PLAN NOW'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADMIN TRUSTED CONTACT ADD / EDIT MODAL */}
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#FF2A6D] relative animate-scale-up">
              <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] pb-4">
                <div>
                  <h3 className="font-black text-lg text-[#2A0826]">
                    {editingContact ? 'Edit Emergency Guardian' : 'Add Emergency Guardian'}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">For user: {userData.fullName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveAdminContact} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Guardian Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Gawali"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      Relationship *
                    </label>
                    <select
                      value={contactForm.relationship}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, relationship: e.target.value })
                      }
                      className="w-full px-3.5 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-black outline-none cursor-pointer"
                    >
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="guardian@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#FFCCE1]">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'SAVING...'
                      : editingContact
                        ? 'UPDATE GUARDIAN'
                        : 'ADD GUARDIAN NOW'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
