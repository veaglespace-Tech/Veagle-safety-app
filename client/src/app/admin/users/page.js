'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../components/admin/AdminHeaderNav.js';
import { api } from '../../../utils/api.js';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Crown,
  Command,
  Edit3,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronRight as ArrowRightIcon,
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect.js';

export default function AdminUsersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // FILTERS & PAGINATION
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSubFilter, setUserSubFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 8;

  // MODAL STATES
  const [editingUser, setEditingUser] = useState(null);
  const [grantingUser, setGrantingUser] = useState(null);
  const [freePlanDuration, setFreePlanDuration] = useState('365');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState('');

  // USER EDIT FORM STATE
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingUserEdit, setIsSubmittingUserEdit] = useState(false);

  // CREATE USER FORM STATE
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [newCity, setNewCity] = useState('Pune');
  const [newAddress, setNewAddress] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [newChildIdentifier, setNewChildIdentifier] = useState('');
  const [grantFreePlanOnCreate, setGrantFreePlanOnCreate] = useState(true);
  const [isSubmittingCreateUser, setIsSubmittingCreateUser] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) {
      showToast('error', 'Please fill in name, email, and password');
      return;
    }
    try {
      setIsSubmittingCreateUser(true);
      const res = await api.post('/admin/users/create', {
        fullName: newFullName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        role: newRole,
        city: newCity,
        address: newAddress,
        bloodGroup: newBloodGroup,
        emergencyContactName: newEmergencyName,
        emergencyContactPhone: newEmergencyPhone,
        childIdentifier: newChildIdentifier,
        grantFreePlan: grantFreePlanOnCreate,
        planDurationDays: 365,
      });

      showToast('success', res.data.message || 'Account created successfully');
      setIsCreateModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewRole('USER');
      setNewCity('Pune');
      setNewAddress('');
      setNewBloodGroup('O+');
      setNewEmergencyName('');
      setNewEmergencyPhone('');
      setNewChildIdentifier('');
      setGrantFreePlanOnCreate(true);
      fetchUsersData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create account');
    } finally {
      setIsSubmittingCreateUser(false);
    }
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsersData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUsersData();
  }, []);

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditRole(u.role || 'USER');
    setEditPassword('');
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setIsSubmittingUserEdit(true);
      const payload = {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      };

      const res = await api.put(`/admin/users/${editingUser.id}`, payload);
      showToast('success', res.data.message || 'User details updated successfully');
      setEditingUser(null);
      fetchUsersData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update user profile');
    } finally {
      setIsSubmittingUserEdit(false);
    }
  };

  const handleToggleUserBlock = async (user) => {
    const isCurrentlyBlocked = user.safetyStatus === 'BLOCKED' || user.isBlocked;
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} user "${user.fullName}"?`)) return;

    try {
      const res = await api.post(`/admin/users/${user.id}/toggle-block`);
      showToast('success', res.data.message);
      fetchUsersData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to toggle user block status');
    }
  };

  const handleGrantFreeSubscription = async () => {
    if (!grantingUser) return;
    try {
      const payload = {
        durationDays: parseInt(freePlanDuration, 10),
        planName:
          freePlanDuration === '365'
            ? 'Free 1-Year Sakhi Protection'
            : `Free ${freePlanDuration}-Day Pass`,
        ...(customStartDate && { customStartDate }),
        ...(customExpiryDate && { customExpiryDate }),
      };

      const res = await api.post(`/admin/users/${grantingUser.id}/grant-subscription`, payload);
      showToast('success', res.data.message);
      setGrantingUser(null);
      fetchUsersData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to grant free plan');
    }
  };

  if (!mounted) return null;

  // FILTER & PAGINATION COMPUTATIONS FOR USERS
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.city || '').toLowerCase().includes(q);

    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSub = userSubFilter === 'ALL' || u.subscriptionStatus === userSubFilter;
    const isBlocked = u.safetyStatus === 'BLOCKED' || u.isBlocked;
    const matchesStatus =
      userStatusFilter === 'ALL' ||
      (userStatusFilter === 'BLOCKED' && isBlocked) ||
      (userStatusFilter === 'ACTIVE' && !isBlocked);

    return matchesSearch && matchesRole && matchesSub && matchesStatus;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );

  const metrics = {
    totalUsers: users.length,
    activePlansCount: users.filter((u) => u.subscriptionStatus === 'ACTIVE').length,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* HEADER NAVIGATION */}
        <AdminHeaderNav
          metrics={metrics}
          onRefresh={fetchUsersData}
          toast={toast}
          activeTabOverride="users"
        />

        {/* USER MANAGEMENT CONTENT */}
        <div className="space-y-6 animate-fade-up">
          {/* DIRECTORY ACTION HEADER BAR */}
          <div className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#FF2A6D]" />
                <h3 className="font-black text-lg text-[#2A0826]">
                  Sakhi Member Directory ({users.length})
                </h3>
              </div>
              <p className="text-xs font-bold text-[#684E67] mt-0.5">
                Register new accounts directly, edit details, and grant safety protection plans
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                generateRandomPassword();
                setIsCreateModalOpen(true);
              }}
              className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-xs font-black px-5 py-3.5 rounded-2xl shadow hover:scale-105 transition-all flex items-center justify-center space-x-2 border border-white/20 uppercase tracking-wider cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>ADD NEW MEMBER</span>
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-5 sm:p-6 rounded-[28px] sm:rounded-3xl border-2 border-[#FFCCE1] shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-[#684E67] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member name, email, phone, city..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: 'USER', label: 'Standard Sakhi Member (USER)' },
                  { value: 'ORGANIZATION', label: 'Organization HQ (ORGANIZATION)' },
                  { value: 'PARENT', label: 'Parent Guardian (PARENT)' },
                  { value: 'SUPER_ADMIN', label: 'SuperAdmin (SUPER_ADMIN)' },
                ]}
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
              />

              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Subscriptions' },
                  { value: 'ACTIVE', label: 'Active Plan' },
                  { value: 'INACTIVE', label: 'Inactive / Expired' },
                ]}
                value={userSubFilter}
                onChange={(e) => {
                  setUserSubFilter(e.target.value);
                  setUserPage(1);
                }}
              />

              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Account States' },
                  { value: 'ACTIVE', label: 'Active Accounts' },
                  { value: 'BLOCKED', label: 'Blocked Accounts' },
                ]}
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setUserPage(1);
                }}
                alignRight={true}
              />
            </div>
          </div>

          {/* USERS DATA TABLE */}
          <div className="bg-white rounded-[36px] border-2 border-[#FFCCE1] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F3] border-b border-[#FFCCE1] text-[11px] font-black text-[#684E67] uppercase tracking-wider">
                    <th className="py-4 px-6">Member ID & Name</th>
                    <th className="py-4 px-6">Contact & City</th>
                    <th className="py-4 px-6 text-center">Role & Status</th>
                    <th className="py-4 px-6 text-right">Emergency Contact</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#FFCCE1]/60 text-xs font-extrabold text-[#2A0826]">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((u) => {
                      const isBlocked = u.safetyStatus === 'BLOCKED' || u.isBlocked;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                          className="hover:bg-[#FFF0F3] cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center font-black shadow-sm shrink-0">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-black text-[#2A0826] group-hover:text-[#FF2A6D]">
                                  {u.fullName}
                                </p>
                                <span className="text-[10px] text-gray-500 font-bold">
                                  ID #{u.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 space-y-0.5">
                            <p className="font-bold text-[#2A0826]">{u.email}</p>
                            <p className="text-[11px] text-[#684E67]">
                              {u.phone || 'No Phone'} • {u.city || 'Pune'}
                            </p>
                          </td>

                          <td className="py-4 px-6 text-center space-y-1.5">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                              {u.role === 'SUPER_ADMIN' ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full uppercase shrink-0 whitespace-nowrap shadow-xs">
                                  <Command className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>SUPERADMIN</span>
                                </span>
                              ) : u.role === 'ORGANIZATION' ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-full uppercase shrink-0 whitespace-nowrap shadow-xs">
                                  <span>ORGANIZATION</span>
                                </span>
                              ) : u.role === 'PARENT' ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-300 px-2.5 py-1 rounded-full uppercase shrink-0 whitespace-nowrap shadow-xs">
                                  <span>PARENT</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-black bg-gray-100 text-gray-700 border border-gray-300 px-2.5 py-1 rounded-full uppercase shrink-0 whitespace-nowrap shadow-xs">
                                  MEMBER
                                </span>
                              )}

                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 whitespace-nowrap shadow-xs ${
                                  u.subscriptionStatus === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                                    : 'bg-rose-50 text-rose-600 border border-rose-300'
                                }`}
                              >
                                {u.subscriptionStatus === 'ACTIVE' ? 'ACTIVE PLAN' : 'INACTIVE'}
                              </span>
                            </div>

                            {isBlocked && (
                              <div className="pt-0.5">
                                <span className="inline-block text-[9px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                                  ACCOUNT BLOCKED
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right text-xs text-[#684E67] font-bold">
                            {u.emergencyContactName ? (
                              <p className="font-black text-[#2A0826]">
                                {u.emergencyContactName}{' '}
                                <span className="text-gray-500 font-bold">
                                  ({u.emergencyContactPhone || 'N/A'})
                                </span>
                              </p>
                            ) : u.trustedContacts && u.trustedContacts.length > 0 ? (
                              <div>
                                <p className="font-black text-[#2A0826]">
                                  {u.trustedContacts[0].name}{' '}
                                  <span className="text-gray-500 font-bold">
                                    ({u.trustedContacts[0].phone || 'N/A'})
                                  </span>
                                </p>
                                <span className="text-[9px] font-black text-[#FF2A6D] bg-[#FFF0F3] px-2 py-0.5 rounded-full border border-[#FFCCE1] inline-block mt-0.5">
                                  {u.trustedContacts.length} Guardian
                                  {u.trustedContacts.length > 1 ? 's' : ''} Listed
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not Specified</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 font-bold">
                        No Sakhi members found matching search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="p-5 bg-[#FFF0F3]/60 border-t border-[#FFCCE1] flex items-center justify-between">
              <span className="text-xs font-black text-[#684E67]">
                Showing {filteredUsers.length === 0 ? 0 : (userPage - 1) * usersPerPage + 1} -{' '}
                {Math.min(userPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}{' '}
                Members
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={userPage === 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-white border border-[#FFCCE1] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#2A0826]" />
                </button>

                <span className="text-xs font-black text-[#2A0826] px-2">
                  Page {userPage} of {totalUserPages}
                </span>

                <button
                  type="button"
                  disabled={userPage >= totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  className="p-2 rounded-xl bg-white border border-[#FFCCE1] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#2A0826]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL 0: CREATE NEW USER MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[36px] max-w-lg w-full p-6 sm:p-8 pb-36 space-y-5 shadow-2xl border-2 border-[#FFCCE1] relative my-8 animate-scale-up">
              <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] flex items-center justify-center font-black">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#2A0826]">Add New Account</h3>
                    <p className="text-xs text-[#684E67] font-bold">
                      Register a new Sakhi member or SuperAdmin account
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-black text-[#2A0826] mb-1">
                    {newRole === 'ORGANIZATION'
                      ? 'Organization / Institution Name *'
                      : newRole === 'PARENT'
                        ? 'Parent / Guardian Name *'
                        : 'Full Legal Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newRole === 'ORGANIZATION'
                        ? 'e.g. Pune Women College'
                        : newRole === 'PARENT'
                          ? 'e.g. Rajesh Sharma (Parent)'
                          : 'e.g. Kaveri Sharma'
                    }
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#2A0826] mb-1">
                      {newRole === 'ORGANIZATION' ? 'Official Org Email *' : 'Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#2A0826] mb-1">
                      {newRole === 'ORGANIZATION' ? 'HQ Mobile Number' : 'Mobile Number'}
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-[#2A0826]">Login Password *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-black text-[#FF2A6D] hover:underline cursor-pointer"
                    >
                      ↻ Generate Password
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Set secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-mono font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#2A0826] mb-1">
                      Account Role *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-black text-[#2A0826] outline-none cursor-pointer"
                    >
                      <option value="USER">Standard Sakhi Member</option>
                      <option value="ORGANIZATION">Organization HQ</option>
                      <option value="PARENT">Parent Guardian</option>
                      <option value="SUPER_ADMIN">SuperAdmin Dispatcher</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#2A0826] mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pune"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                    />
                  </div>
                </div>

                {/* ROLE SPECIFIC EXTRA FIELDS */}
                {newRole === 'ORGANIZATION' && (
                  <div>
                    <label className="block text-xs font-black text-[#2A0826] mb-1">
                      Organization HQ Address
                    </label>
                    <input
                      type="text"
                      placeholder="Campus / Office Address"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                    />
                  </div>
                )}

                {newRole === 'PARENT' && (
                  <div>
                    <label className="block text-xs font-black text-[#2A0826] mb-1">
                      Link Child Account (Mobile or Email)
                    </label>
                    <input
                      type="text"
                      placeholder="Child's 10-digit mobile or email address"
                      value={newChildIdentifier}
                      onChange={(e) => setNewChildIdentifier(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                    />
                  </div>
                )}

                {newRole === 'USER' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[#2A0826] mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        placeholder="Guardian Name"
                        value={newEmergencyName}
                        onChange={(e) => setNewEmergencyName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#2A0826] mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="Guardian Phone"
                        value={newEmergencyPhone}
                        onChange={(e) => setNewEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-bold text-[#2A0826] outline-none focus:border-[#FF2A6D] font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="grantFreePlan"
                    checked={grantFreePlanOnCreate}
                    onChange={(e) => setGrantFreePlanOnCreate(e.target.checked)}
                    className="w-4 h-4 accent-[#FF2A6D] cursor-pointer"
                  />
                  <label
                    htmlFor="grantFreePlan"
                    className="text-xs font-black text-[#2A0826] cursor-pointer"
                  >
                    Grant 1-Year Free Active Protection Plan immediately
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-[#FFCCE1]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-black text-xs rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingCreateUser}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white font-black text-xs rounded-2xl shadow hover:scale-105 active:scale-95 transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCreateUser ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 1: EDIT USER MODAL */}
        {editingUser && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#FF2A6D] relative animate-scale-up">
              <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] pb-4">
                <h3 className="font-black text-lg text-[#2A0826]">Edit Member Details</h3>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Account Role
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'USER', label: 'Standard Sakhi Member' },
                      { value: 'ORGANIZATION', label: 'Organization HQ' },
                      { value: 'PARENT', label: 'Parent Guardian' },
                      { value: 'SUPER_ADMIN', label: 'SuperAdmin Dispatcher' },
                    ]}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#FFCCE1]">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingUserEdit}
                    className="px-6 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingUserEdit ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: GRANT FREE SUBSCRIPTION MODAL */}
        {grantingUser && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-emerald-500 relative animate-scale-up">
              <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-4">
                <div>
                  <h3 className="font-black text-lg text-[#2A0826]">
                    Grant Free Subscription Pass
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">For: {grantingUser.fullName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGrantingUser(null)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Select Free Plan Duration *
                  </label>
                  <select
                    value={freePlanDuration}
                    onChange={(e) => setFreePlanDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-500 rounded-xl text-xs font-black text-[#2A0826] outline-none cursor-pointer"
                  >
                    <option value="365">1 Year Full Protection (365 Days)</option>
                    <option value="90">3 Months Pass (90 Days)</option>
                    <option value="30">1 Month Trial Pass (30 Days)</option>
                    <option value="7">7 Days Free Trial Pass</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setGrantingUser(null)}
                    className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleGrantFreeSubscription}
                    className="px-6 py-3 rounded-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-wider shadow cursor-pointer"
                  >
                    GRANT FREE PLAN NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
