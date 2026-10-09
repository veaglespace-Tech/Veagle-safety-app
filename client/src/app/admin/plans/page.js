'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../../components/layout/AppLayout.js';
import { AdminHeaderNav } from '../../../components/admin/AdminHeaderNav.js';
import { api } from '../../../utils/api.js';
import { Sliders, Plus, X } from 'lucide-react';

export default function AdminPlansPage() {
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState([]);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [planForm, setPlanForm] = useState({
    id: null,
    name: '',
    description: '',
    basePrice: '',
    gstPercentage: 18,
    durationDays: 365,
    features: [],
    isActive: true,
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPlansData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to fetch subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGstSettings = async () => {
    try {
      const res = await api.get('/admin/gst');
      if (res.data?.gstPercentage !== undefined) {
        setGstPercentage(res.data.gstPercentage);
      }
    } catch (err) {}
  };

  useEffect(() => {
    setMounted(true);
    fetchPlansData();
    fetchGstSettings();
  }, []);

  const handleUpdateGlobalGst = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/gst', { gstPercentage: parseFloat(gstPercentage) });
      showToast('success', res.data.message);
      fetchPlansData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update GST rate');
    }
  };

  const handleTogglePlanActive = async (planId) => {
    try {
      const res = await api.post(`/admin/plans/${planId}/toggle`);
      showToast('success', res.data.message);
      fetchPlansData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to toggle plan status');
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...planForm,
        durationDays: parseInt(planForm.durationDays, 10) || 0,
        basePrice: parseFloat(planForm.basePrice) || 0,
        gstPercentage:
          planForm.gstPercentage !== undefined &&
          planForm.gstPercentage !== null &&
          planForm.gstPercentage !== ''
            ? parseFloat(planForm.gstPercentage)
            : parseFloat(gstPercentage !== undefined ? gstPercentage : 18),
        features: (planForm.features || []).filter(
          (f) => f && typeof f === 'string' && f.trim().length > 0
        ),
      };
      const res = await api.post('/admin/plans', payload);
      showToast('success', res.data.message);
      setIsPlanModalOpen(false);
      fetchPlansData();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save plan');
    }
  };

  if (!mounted) return null;

  const metrics = {
    activePlansCount: plans.filter((p) => p.isActive).length,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* HEADER NAVIGATION */}
        <AdminHeaderNav
          metrics={metrics}
          onRefresh={fetchPlansData}
          toast={toast}
          activeTabOverride="plans"
        />

        {/* PLANS CONTENT */}
        <div className="space-y-8 animate-fade-up">
          {/* GLOBAL GST CONTROLLER CARD */}
          <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-4">
            <div className="flex items-center space-x-3 border-b border-[#FFCCE1] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#2A0826]">
                  Global Dynamic GST Rate Control
                </h3>
                <p className="text-xs text-[#684E67] font-bold">
                  Modifying GST percentage instantly recalculates total pricing for all subscription
                  plans
                </p>
              </div>
            </div>

            <form
              onSubmit={handleUpdateGlobalGst}
              className="flex flex-col sm:flex-row items-center gap-4 pt-2"
            >
              <div className="flex items-center space-x-3 flex-1 w-full">
                <label className="text-xs font-black text-[#2A0826] shrink-0">
                  Global GST Percentage (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  className="w-32 px-4 py-3 bg-white border-2 border-[#FF2A6D] rounded-2xl text-center text-base font-black text-[#2A0826] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white text-xs font-black rounded-2xl shadow hover:scale-105 transition-all cursor-pointer uppercase tracking-wider"
              >
                UPDATE GST RATE
              </button>
            </form>
          </div>

          {/* SUBSCRIPTION PLANS LIST & MANAGEMENT */}
          <div className="bg-white p-6 sm:p-8 rounded-[36px] border-2 border-[#FFCCE1] shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#FFCCE1] pb-4">
              <div className="min-w-0">
                <h3 className="font-black text-base sm:text-lg text-[#2A0826] tracking-tight">
                  Subscription Plans in Database
                </h3>
                <p className="text-xs text-[#684E67] font-bold mt-0.5">
                  Dynamic subscription offerings for Sakhi Suraksha members
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPlanForm({
                    id: null,
                    name: '',
                    description: '',
                    basePrice: '',
                    gstPercentage: gstPercentage,
                    durationDays: 365,
                    features: [
                      'Instant 3-Second Hold Emergency SOS',
                      '5 Guardian Emergency Alerts (SMS & Push)',
                      'Encrypted Real-Time Live GPS Map Sharing',
                      'High-Decibel Siren Alarm & Siren Control',
                      'Direct 112 & 1091 Helpline Access',
                      '24/7 Active Safety Command Support',
                    ],
                    isActive: true,
                  });
                  setIsPlanModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white font-black text-xs px-5 py-3 rounded-2xl shadow hover:scale-105 transition-all flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider shrink-0 whitespace-nowrap active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>CREATE NEW PLAN</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((p) => {
                const base = parseFloat(p.basePrice || 0);
                const gst =
                  base === 0
                    ? 0
                    : p.gstPercentage !== undefined &&
                      p.gstPercentage !== null &&
                      !isNaN(parseFloat(p.gstPercentage))
                    ? parseFloat(p.gstPercentage)
                    : gstPercentage !== undefined &&
                      gstPercentage !== null &&
                      !isNaN(parseFloat(gstPercentage))
                    ? parseFloat(gstPercentage)
                    : 18;
                const total = base === 0 ? 0 : parseFloat((base + (base * gst) / 100).toFixed(2));
                const planFeats = Array.isArray(p.features) ? p.features : [];

                return (
                  <div
                    key={p.id}
                    className={`p-6 rounded-3xl border-2 space-y-4 transition-all relative ${
                      p.isActive
                        ? 'bg-white border-[#FF2A6D] shadow-md'
                        : 'bg-gray-50 border-gray-300 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {p.isActive ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <h4 className="font-black text-lg text-[#2A0826] mt-2">{p.name}</h4>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-2xl text-[#FF2A6D]">₹{total}</p>
                        <p className="text-[10px] font-bold text-[#684E67]">
                          {base === 0
                            ? '100% FREE TRIAL'
                            : gst === 0
                            ? `₹${base} (0% GST)`
                            : `₹${base} + ${gst}% GST`}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#684E67] font-bold whitespace-pre-line leading-relaxed">
                      {p.description}
                    </p>

                    {planFeats.length > 0 && (
                      <div className="pt-2 border-t border-[#FFCCE1]/60 space-y-1">
                        <span className="text-[10px] font-black text-[#FF2A6D] uppercase">
                          Key Features ({planFeats.length}):
                        </span>
                        <ul className="text-xs font-bold text-[#2A0826] space-y-1 pl-2">
                          {planFeats.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A6D]" />
                              <span>{f}</span>
                            </li>
                          ))}
                          {planFeats.length > 4 && (
                            <li className="text-[10px] font-black text-[#FF2A6D]">
                              + {planFeats.length - 4} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#FFCCE1]">
                      <span className="text-xs font-black text-[#2A0826] whitespace-nowrap shrink-0">
                        Validity: {p.durationDays} Days
                      </span>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            let parsedFeats = [];
                            if (p.features) {
                              try {
                                parsedFeats =
                                  typeof p.features === 'string'
                                    ? JSON.parse(p.features)
                                    : p.features;
                              } catch (e) {
                                parsedFeats = p.features.split('\n').filter(Boolean);
                              }
                            }
                            if (!Array.isArray(parsedFeats) || parsedFeats.length === 0) {
                              parsedFeats = [
                                'Instant 3-Second Hold Emergency SOS',
                                '5 Guardian Emergency Alerts (SMS & Push)',
                                'Encrypted Real-Time Live GPS Map Sharing',
                                'High-Decibel Siren Alarm & Siren Control',
                                'Direct 112 & 1091 Helpline Access',
                                '24/7 Active Safety Command Support',
                              ];
                            }

                            setPlanForm({
                              id: p.id,
                              name: p.name,
                              description: p.description,
                              basePrice: p.basePrice,
                              gstPercentage:
                                p.gstPercentage !== undefined && p.gstPercentage !== null
                                  ? p.gstPercentage
                                  : gstPercentage,
                              durationDays: p.durationDays,
                              features: parsedFeats,
                              isActive: p.isActive,
                            });
                            setIsPlanModalOpen(true);
                          }}
                          className="bg-[#FFF0F3] text-[#FF2A6D] font-black text-xs px-3.5 py-2 rounded-xl border border-[#FFCCE1] hover:bg-[#FF2A6D] hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
                        >
                          EDIT PLAN
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePlanActive(p.id)}
                          className={`font-black text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                            p.isActive
                              ? 'bg-rose-50 text-[#FF2A6D] border-rose-300 hover:bg-[#FF2A6D] hover:text-white'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {p.isActive ? 'DISABLE' : 'ENABLE'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL 3: CREATE / EDIT PLAN FORM */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[36px] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-[#FF2A6D] relative animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b-2 border-[#FFCCE1] pb-4">
                <h3 className="font-black text-lg text-[#2A0826]">
                  {planForm.id ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="p-2 text-[#684E67] hover:text-[#FF2A6D] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Plan Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sakhi Suraksha 365 Plan"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#684E67] mb-1">
                    Plan Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe plan features & coverage..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="w-full p-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      Base Price (INR ₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 24.00"
                      value={planForm.basePrice}
                      onChange={(e) => setPlanForm({ ...planForm, basePrice: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#684E67] mb-1">
                      Duration (Days) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 365"
                      value={
                        Number.isNaN(planForm.durationDays) ||
                        planForm.durationDays === null ||
                        planForm.durationDays === undefined
                          ? ''
                          : planForm.durationDays
                      }
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          durationDays:
                            e.target.value === '' ? '' : parseInt(e.target.value, 10) || '',
                        })
                      }
                      className="w-full px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                    />
                  </div>
                </div>

                {/* DYNAMIC PLAN FEATURES MANAGEMENT */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-[#684E67]">
                      Plan Features & Highlights
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(planForm.features || [])];
                        updated.push('');
                        setPlanForm({ ...planForm, features: updated });
                      }}
                      className="text-[11px] font-black text-[#FF2A6D] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Feature</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto p-1 border-1.5 border-[#FFCCE1] rounded-2xl bg-[#FFF0F3]/50">
                    {(planForm.features || []).map((feat, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder={`Feature #${idx + 1} (e.g. 24/7 Live Support)...`}
                          value={feat}
                          onChange={(e) => {
                            const updated = [...planForm.features];
                            updated[idx] = e.target.value;
                            setPlanForm({ ...planForm, features: updated });
                          }}
                          className="flex-1 px-3.5 py-2 bg-white border border-[#FFCCE1] rounded-xl text-xs font-bold text-[#2A0826] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = planForm.features.filter((_, i) => i !== idx);
                            setPlanForm({ ...planForm, features: updated });
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Remove feature"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(planForm.features || []).length === 0 && (
                      <p className="text-[11px] text-gray-400 font-bold p-2 text-center">
                        No features added. Click "+ Add Feature" to customize bullet points.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#FFCCE1]">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-5 py-3 rounded-full text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] uppercase tracking-wider shadow cursor-pointer"
                  >
                    SAVE PLAN
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
