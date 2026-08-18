'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../components/admin/AdminHeaderNav.js';
import { couponApi } from '../../../redux/api/couponApi.js';
import { Ticket, Plus, X, Trash2, PowerOff, Power, Edit } from 'lucide-react';

export default function AdminCouponsPage() {
  const [mounted, setMounted] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);

  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await couponApi.getAllCoupons();
      if (res.success) setCoupons(res.coupons || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (isEditMode) {
        res = await couponApi.updateCoupon(editingCouponId, form);
      } else {
        res = await couponApi.createCoupon(form);
      }

      if (res.success) {
        showToast(
          'success',
          isEditMode ? 'Coupon updated successfully!' : 'Coupon created successfully!'
        );
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingCouponId(null);
        setForm({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          maxUses: '',
          validFrom: '',
          validUntil: '',
        });
        fetchCoupons();
      }
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.message ||
          (isEditMode ? 'Failed to update coupon' : 'Failed to create coupon')
      );
    }
  };

  const handleEditClick = (coupon) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses || '',
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
    });
    setIsEditMode(true);
    setEditingCouponId(coupon.id);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
    });
    setIsEditMode(false);
    setEditingCouponId(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await couponApi.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      if (res.success) {
        showToast('success', 'Coupon status updated');
        fetchCoupons();
      }
    } catch (err) {
      showToast('error', 'Failed to update status');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await couponApi.deleteCoupon(id);
      if (res.success) {
        showToast('success', 'Coupon deleted');
        fetchCoupons();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        <AdminHeaderNav toast={toast} onRefresh={fetchCoupons} />

        <div className="space-y-8 animate-fade-up">
          {/* HEADER SECTION */}
          <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Ticket className="w-6 h-6 transform -rotate-45" />
              </div>
              <div>
                <h2 className="font-black text-2xl text-[#2A0826]">Discount Coupons</h2>
                <p className="text-xs font-bold text-[#684E67]">
                  Manage promotional codes for first-time subscription upgrades.
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="px-5 py-3.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-xs font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          {/* COUPONS LIST */}
          <div className="bg-white rounded-[36px] border-2 border-[#FFCCE1] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#FFF0F3]/60 border-b-2 border-[#FFCCE1]">
                    <th className="p-5 text-[11px] font-black text-[#2A0826] uppercase tracking-widest">
                      Code
                    </th>
                    <th className="p-5 text-[11px] font-black text-[#2A0826] uppercase tracking-widest text-center">
                      Discount
                    </th>
                    <th className="p-5 text-[11px] font-black text-[#2A0826] uppercase tracking-widest text-center">
                      Usage
                    </th>
                    <th className="p-5 text-[11px] font-black text-[#2A0826] uppercase tracking-widest text-center">
                      Validity
                    </th>
                    <th className="p-5 text-[11px] font-black text-[#2A0826] uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="p-5 text-[11px] font-black text-[#2A0826] uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFCCE1]/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm font-bold text-[#684E67]">
                        Loading coupons...
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm font-bold text-[#684E67]">
                        No coupons found.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-[#FFF0F3]/30 transition-colors">
                        <td className="p-5">
                          <span className="bg-[#2A0826] text-white text-sm font-black px-4 py-2 rounded-xl uppercase border border-[#684E67] tracking-widest shadow-sm">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="inline-flex items-center space-x-1.5 bg-rose-50 text-[#FF2A6D] font-black px-3 py-1.5 rounded-xl border border-rose-200 text-sm">
                            {coupon.discountType === 'PERCENTAGE'
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} OFF`}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <p className="text-sm font-black text-[#2A0826]">
                            {coupon.usesCount}{' '}
                            <span className="text-[#684E67] font-bold text-xs">
                              / {coupon.maxUses || '∞'}
                            </span>
                          </p>
                        </td>
                        <td className="p-5 text-center text-xs font-bold text-[#684E67]">
                          {coupon.validUntil
                            ? new Date(coupon.validUntil).toLocaleDateString()
                            : 'Lifetime'}
                        </td>
                        <td className="p-5 text-center">
                          {coupon.isActive ? (
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditClick(coupon)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                              title="Edit Coupon"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(coupon)}
                              className={`p-2 rounded-xl transition-colors ${coupon.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              title={coupon.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                            >
                              {coupon.isActive ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A0826]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] border-2 border-[#FFCCE1] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#FFCCE1] flex items-center justify-between bg-[#FFF0F3]/30">
              <h3 className="font-black text-lg text-[#2A0826] flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-[#FF2A6D] transform -rotate-45" />
                <span>{isEditMode ? 'Edit Coupon' : 'Create New Coupon'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#FFCCE1] rounded-full text-[#684E67] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                  Coupon Code *
                </label>
                <input
                  required
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-[#FFF0F3]/30 border border-[#FFCCE1] rounded-2xl text-sm font-black text-[#FF2A6D] tracking-widest outline-none focus:border-[#FF2A6D] focus:ring-2 focus:ring-[#FF2A6D]/20 transition-all uppercase"
                  placeholder="e.g. SUMMER50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                    Type *
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3]/30 border border-[#FFCCE1] rounded-2xl text-sm font-bold outline-none focus:border-[#FF2A6D]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                    Value *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3]/30 border border-[#FFCCE1] rounded-2xl text-sm font-bold outline-none focus:border-[#FF2A6D]"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                  Max Uses (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FFF0F3]/30 border border-[#FFCCE1] rounded-2xl text-sm font-bold outline-none focus:border-[#FF2A6D]"
                  placeholder="Leave blank for unlimited"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3]/30 border border-[#FFCCE1] rounded-2xl text-xs font-bold outline-none focus:border-[#FF2A6D]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#2A0826] uppercase tracking-wider">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3]/30 border border-[#FFCCE1] rounded-2xl text-xs font-bold outline-none focus:border-[#FF2A6D]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                  {isEditMode ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
