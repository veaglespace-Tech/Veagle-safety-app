'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { settingApi } from '../../../redux/api/settingApi';
import {
  Save,
  Plus,
  Trash2,
  Settings,
  Mail,
  Image as ImageIcon,
  Video,
  Eye,
  Layout,
  ShieldCheck,
  Link2,
  ArrowLeft,
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('gallery');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [supportEmail, setSupportEmail] = useState('');
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryMeta, setGalleryMeta] = useState({
    title: 'Visual Gallery & Feature Showcase',
    subtitle:
      "Explore images and videos of Sakhi Suraksha SOS's emergency response interfaces, GPS tracking, and safety tools.",
    categories: 'ALL, EMERGENCY, TRACKING, NETWORK, AUTOMATION, COMMAND',
  });

  const [collapsedItems, setCollapsedItems] = useState({});

  // Track original states for unsaved changes detection
  const [originalState, setOriginalState] = useState({ email: '', items: [], meta: null });

  useEffect(() => {
    if (!token || user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchSettings();
  }, [token, user]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      const res = await settingApi.fetchSettings([
        'SUPPORT_EMAIL',
        'GALLERY_ITEMS',
        'GALLERY_META',
      ]);
      if (res.success) {
        const fetchedEmail = res.data.SUPPORT_EMAIL || 'support@veagle-safety.com';
        const fetchedItems = res.data.GALLERY_ITEMS || [];
        const fetchedMeta = res.data.GALLERY_META || {
          title: 'Visual Gallery & Feature Showcase',
          subtitle:
            "Explore images and videos of Sakhi Suraksha SOS's emergency response interfaces, GPS tracking, and safety tools.",
          categories: 'ALL, EMERGENCY, TRACKING, NETWORK, AUTOMATION, COMMAND',
        };

        setSupportEmail(fetchedEmail);
        setGalleryItems(fetchedItems);
        setGalleryMeta(fetchedMeta);

        setOriginalState({
          email: fetchedEmail,
          items: JSON.parse(JSON.stringify(fetchedItems)),
          meta: JSON.parse(JSON.stringify(fetchedMeta)),
        });
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (supportEmail && !emailRegex.test(supportEmail)) {
      showToast('error', 'Please enter a valid support email address');
      return;
    }

    if (!galleryMeta.title || !galleryMeta.title.trim()) {
      showToast('error', 'Gallery Page Title is required');
      setActiveTab('gallery');
      return;
    }

    setSaving(true);
    try {
      await settingApi.updateSettings({
        SUPPORT_EMAIL: supportEmail,
        GALLERY_ITEMS: galleryItems,
        GALLERY_META: galleryMeta,
      });
      showToast('success', 'Settings saved successfully!');

      setOriginalState({
        email: supportEmail,
        items: JSON.parse(JSON.stringify(galleryItems)),
        meta: JSON.parse(JSON.stringify(galleryMeta)),
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const checkUnsavedChanges = (newEmail, newItems, newMeta) => {
    const emailChanged = newEmail !== originalState.email;
    const itemsChanged = JSON.stringify(newItems) !== JSON.stringify(originalState.items);
    const metaChanged = JSON.stringify(newMeta) !== JSON.stringify(originalState.meta);
    setHasUnsavedChanges(emailChanged || itemsChanged || metaChanged);
  };

  const handleEmailChange = (val) => {
    setSupportEmail(val);
    checkUnsavedChanges(val, galleryItems, galleryMeta);
  };

  const handleMetaChange = (field, val) => {
    const newMeta = { ...galleryMeta, [field]: val };
    setGalleryMeta(newMeta);
    checkUnsavedChanges(supportEmail, galleryItems, newMeta);
  };

  const addGalleryItem = () => {
    let firstCategory = 'ALL';
    if (galleryMeta?.categories) {
      if (Array.isArray(galleryMeta.categories) && galleryMeta.categories.length > 0) {
        firstCategory = galleryMeta.categories[0];
      } else if (typeof galleryMeta.categories === 'string') {
        const parts = galleryMeta.categories.split(',').filter(Boolean);
        if (parts.length > 0) firstCategory = parts[0].trim();
      }
    }

    const newItems = [
      ...galleryItems,
      {
        id: Date.now().toString(),
        title: '',
        subtitle: '',
        description: '',
        badge: '',
        category: firstCategory,
        mediaUrl: '',
        mediaType: 'image',
      },
    ];
    setGalleryItems(newItems);
    checkUnsavedChanges(supportEmail, newItems, galleryMeta);
  };

  const updateGalleryItem = (index, field, value) => {
    const newItems = [...galleryItems];
    newItems[index][field] = value;
    setGalleryItems(newItems);
    checkUnsavedChanges(supportEmail, newItems, galleryMeta);
  };

  const handleFileUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('info', 'Uploading file...');
      const result = await settingApi.uploadMedia(file);
      if (result.success) {
        const newItems = [...galleryItems];
        newItems[index].mediaUrl = result.url;
        newItems[index].mediaType = result.mediaType;
        setGalleryItems(newItems);
        checkUnsavedChanges(supportEmail, newItems, galleryMeta);
        showToast('success', 'File uploaded successfully!');
      } else {
        showToast('error', result.message || 'Upload failed');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Error uploading file. Max size 50MB.');
    }
  };

  const removeGalleryItem = (index) => {
    if (!confirm('Are you sure you want to remove this gallery item?')) return;
    const newItems = galleryItems.filter((_, i) => i !== index);
    setGalleryItems(newItems);
    checkUnsavedChanges(supportEmail, newItems, galleryMeta);
  };

  const toggleCollapse = (index) => {
    setCollapsedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const moveGalleryItem = (index, direction) => {
    const newItems = [...galleryItems];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];

      // Keep collapsed states in sync
      const newCollapsed = { ...collapsedItems };
      const tempCol = newCollapsed[index];
      newCollapsed[index] = newCollapsed[index - 1];
      newCollapsed[index - 1] = tempCol;
      setCollapsedItems(newCollapsed);
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

      const newCollapsed = { ...collapsedItems };
      const tempCol = newCollapsed[index];
      newCollapsed[index] = newCollapsed[index + 1];
      newCollapsed[index + 1] = tempCol;
      setCollapsedItems(newCollapsed);
    } else {
      return;
    }
    setGalleryItems(newItems);
    checkUnsavedChanges(supportEmail, newItems, galleryMeta);
  };

  // Prevent leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF2A6D]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Global Toast */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-3 animate-fade-in ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#059669] text-white'
            }`}
          >
            <span>{toast.text}</span>
          </div>
        )}

        {/* Back Button */}
        <div>
          <button
            onClick={() => router.back()}
            className="group flex items-center space-x-2 text-sm font-black text-gray-400 hover:text-[#FF2A6D] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#FFF0F3] flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Back to Command Dashboard</span>
          </button>
        </div>

        {/* Header section */}
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#FF5C8A] to-[#FF2A6D] text-white flex items-center justify-center shadow-lg shadow-[#FF2A6D]/30">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#2A0826] tracking-tight">
                Platform Configuration
              </h1>
              <p className="text-sm font-bold text-gray-500 mt-1">
                Manage global public-facing settings
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg ${
              hasUnsavedChanges && !saving
                ? 'bg-gradient-to-r from-[#059669] to-[#10B981] text-white hover:scale-105 hover:shadow-emerald-500/30'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT SIDEBAR TABS */}
          <div className="lg:w-72 shrink-0 space-y-2">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center space-x-3 transition-all ${
                activeTab === 'gallery'
                  ? 'bg-white text-[#FF2A6D] border border-[#FFCCE1] shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Media Gallery</span>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center space-x-3 transition-all ${
                activeTab === 'general'
                  ? 'bg-white text-[#FF2A6D] border border-[#FFCCE1] shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Layout className="w-5 h-5" />
              <span>General Settings</span>
            </button>
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="flex-1">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-6 md:p-8 animate-fade-in space-y-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#2A0826]">General Settings</h3>
                  <p className="text-sm font-bold text-gray-500">
                    Core operational contact details
                  </p>
                </div>

                <div className="max-w-xl space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-black text-[#684E67] uppercase tracking-wider">
                      <Mail className="w-4 h-4 text-[#FF5C8A]" />
                      <span>Support Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#2A0826] outline-none focus:border-[#FF5C8A] focus:bg-white transition-all shadow-inner"
                      placeholder="support@domain.com"
                    />
                    <p className="text-xs font-bold text-gray-400">
                      This email is publicly displayed on the Contact Us page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GALLERY TAB */}
            {activeTab === 'gallery' && (
              <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-6 md:p-8 animate-fade-in space-y-10 min-h-[600px]">
                {/* 1. Page Content Section */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#2A0826]">Page Content</h3>
                    <p className="text-sm font-bold text-gray-500">
                      Configure the public Gallery page headers and filter categories.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAFAFA] p-6 rounded-[28px] border border-gray-200">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                        Page Title
                      </label>
                      <input
                        type="text"
                        value={galleryMeta.title}
                        onChange={(e) => handleMetaChange('title', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2A0826] outline-none focus:border-[#FF5C8A] transition-colors"
                        placeholder="e.g. Visual Gallery & Feature Showcase"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                        Page Subtitle
                      </label>
                      <textarea
                        value={galleryMeta.subtitle}
                        onChange={(e) => handleMetaChange('subtitle', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2A0826] outline-none focus:border-[#FF5C8A] transition-colors h-20 resize-none"
                        placeholder="Explore our images..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                        Filter Categories
                      </label>
                      <input
                        type="text"
                        value={galleryMeta.categories}
                        onChange={(e) => handleMetaChange('categories', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2A0826] outline-none focus:border-[#FF5C8A] transition-colors"
                        placeholder="ALL, EVENTS, MEETINGS, TEAM"
                      />
                      <p className="text-[10px] font-bold text-gray-400">
                        Comma-separated list of categories. Ensure 'ALL' is included if you want an
                        'All' filter.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Media Items Section */}
                <div className="pt-6 border-t border-gray-200 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-[#2A0826]">Media Items</h3>
                      <p className="text-sm font-bold text-gray-500">
                        Add URLs to images/videos to display on the public Gallery page.
                      </p>
                    </div>
                    <button
                      onClick={addGalleryItem}
                      className="bg-[#FFF0F3] text-[#FF2A6D] hover:bg-[#FF5C8A] hover:text-white border border-[#FFCCE1] hover:border-transparent px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Media</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {galleryItems.length === 0 ? (
                      <div className="text-center py-20 bg-[#FAFAFA] rounded-[32px] border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-base font-black text-[#684E67]">
                          No gallery items added yet.
                        </p>
                        <p className="text-sm font-bold text-gray-400 mt-2">
                          Click 'Add Media' to populate your showcase.
                        </p>
                      </div>
                    ) : (
                      galleryItems.map((item, index) => (
                        <div
                          key={item.id || index}
                          className={`p-6 border border-gray-200 rounded-[28px] bg-[#FAFAFA] relative group hover:border-[#FFCCE1] transition-all ${collapsedItems[index] ? 'pb-6' : 'space-y-6'}`}
                        >
                          {/* Header & Controls */}
                          <div className="flex items-center justify-between gap-4">
                            <div
                              className="flex items-center space-x-3 cursor-pointer"
                              onClick={() => toggleCollapse(index)}
                            >
                              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                                {collapsedItems[index] ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-[#2A0826] flex items-center space-x-2">
                                  <span>{item.title || `Media Item #${index + 1}`}</span>
                                  {item.badge && (
                                    <span className="text-[9px] bg-[#FF2A6D] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {item.badge}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                                  {item.mediaType} • {item.category || 'Uncategorized'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => moveGalleryItem(index, 'up')}
                                disabled={index === 0}
                                className="p-2 text-gray-400 hover:text-[#FF2A6D] disabled:opacity-30 disabled:hover:text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors"
                                title="Move Up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveGalleryItem(index, 'down')}
                                disabled={index === galleryItems.length - 1}
                                className="p-2 text-gray-400 hover:text-[#FF2A6D] disabled:opacity-30 disabled:hover:text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors"
                                title="Move Down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <div className="w-px h-6 bg-gray-200 mx-1"></div>
                              <button
                                onClick={() => removeGalleryItem(index)}
                                className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors"
                                title="Remove Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Content */}
                          {!collapsedItems[index] && (
                            <div className="flex flex-col xl:flex-row gap-8 pt-4 border-t border-gray-200">
                              {/* Live Preview Pane */}
                              <div className="xl:w-1/3 shrink-0">
                                <label className="flex items-center space-x-2 text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                                  <Eye className="w-4 h-4 text-[#FF5C8A]" />
                                  <span>Live Preview</span>
                                </label>
                                <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center shadow-inner relative">
                                  {!item.mediaUrl ? (
                                    <span className="text-xs font-bold text-gray-400">
                                      No URL provided
                                    </span>
                                  ) : item.mediaType === 'video' ? (
                                    <video
                                      src={item.mediaUrl}
                                      className="w-full h-full object-cover"
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                    />
                                  ) : (
                                    <img
                                      src={item.mediaUrl}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '';
                                        e.target.onerror = null;
                                        e.target.parentElement.innerHTML =
                                          '<span class="text-xs font-bold text-red-400">Broken Link</span>';
                                      }}
                                    />
                                  )}

                                  {/* Preview Overlay info */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    {item.badge && (
                                      <span className="text-[10px] bg-[#FF2A6D] text-white px-2 py-0.5 rounded-full w-fit uppercase font-black mb-1">
                                        {item.badge}
                                      </span>
                                    )}
                                    <span className="text-white font-black text-sm truncate">
                                      {item.title || 'Untitled'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Data Input Form */}
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                                {/* Media URL */}
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span>Media URL</span>
                                  </label>
                                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <select
                                      value={item.mediaType}
                                      onChange={(e) =>
                                        updateGalleryItem(index, 'mediaType', e.target.value)
                                      }
                                      className="w-full sm:w-32 bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A]"
                                    >
                                      <option value="image">Image</option>
                                      <option value="video">Video</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={item.mediaUrl}
                                      onChange={(e) =>
                                        updateGalleryItem(index, 'mediaUrl', e.target.value)
                                      }
                                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A] transition-all"
                                      placeholder="https://example.com/asset.png"
                                    />

                                    {/* Upload Button */}
                                    <div className="relative flex shrink-0">
                                      <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={(e) => handleFileUpload(index, e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      />
                                      <button
                                        type="button"
                                        className="w-full sm:w-auto bg-gray-100 text-gray-600 hover:bg-[#FFF0F3] hover:text-[#FF2A6D] border border-gray-200 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                                      >
                                        <Upload className="w-4 h-4" />
                                        <span>Upload</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) =>
                                      updateGalleryItem(index, 'title', e.target.value)
                                    }
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A]"
                                    placeholder="e.g. SOS Trigger"
                                  />
                                </div>

                                {/* Subtitle */}
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Subtitle
                                  </label>
                                  <input
                                    type="text"
                                    value={item.subtitle}
                                    onChange={(e) =>
                                      updateGalleryItem(index, 'subtitle', e.target.value)
                                    }
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A]"
                                    placeholder="e.g. Instant Alert"
                                  />
                                </div>

                                {/* Description */}
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Description
                                  </label>
                                  <textarea
                                    value={item.description}
                                    onChange={(e) =>
                                      updateGalleryItem(index, 'description', e.target.value)
                                    }
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A] h-24 resize-none"
                                    placeholder="Feature explanation..."
                                  />
                                </div>

                                {/* Badge */}
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Badge Text
                                  </label>
                                  <input
                                    type="text"
                                    value={item.badge}
                                    onChange={(e) =>
                                      updateGalleryItem(index, 'badge', e.target.value)
                                    }
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A]"
                                    placeholder="e.g. NEW FEATURE"
                                  />
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Category
                                  </label>
                                  <select
                                    value={item.category}
                                    onChange={(e) =>
                                      updateGalleryItem(index, 'category', e.target.value)
                                    }
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#FF5C8A]"
                                  >
                                    {(() => {
                                      let cats = ['ALL'];
                                      if (galleryMeta?.categories) {
                                        if (Array.isArray(galleryMeta.categories)) {
                                          cats = galleryMeta.categories;
                                        } else if (typeof galleryMeta.categories === 'string') {
                                          cats = galleryMeta.categories
                                            .split(',')
                                            .map((c) => c.trim())
                                            .filter(Boolean);
                                        }
                                      }
                                      // Ensure current item category is in the list so it doesn't appear blank
                                      if (item.category && !cats.includes(item.category)) {
                                        cats.push(item.category);
                                      }
                                      if (cats.length === 0) cats = ['ALL'];

                                      return cats.map((cat) => (
                                        <option key={cat} value={cat}>
                                          {cat}
                                        </option>
                                      ));
                                    })()}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
