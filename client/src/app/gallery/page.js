'use client';

import React, { useState, useEffect } from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar.js';
import { Footer } from '../../components/layout/Footer.js';
import { Shield, Zap, ArrowRight, Maximize2, X } from 'lucide-react';
import Link from 'next/link';
import { AnimatedHeading } from '../../components/common/AnimatedHeading.jsx';
import { MagneticButton } from '../../components/ui/MagneticButton.js';
import { settingApi } from '../../redux/api/settingApi.js';

export const dynamic = 'force-dynamic';

export default function PlatformGalleryPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryMeta, setGalleryMeta] = useState({
    title: 'Visual Gallery & Feature Showcase',
    subtitle:
      "Explore images and videos of Sakhi Suraksha SOS's emergency response interfaces, GPS tracking, and safety tools.",
    categories: 'ALL, EMERGENCY, TRACKING, NETWORK, AUTOMATION, COMMAND',
  });
  const [loading, setLoading] = useState(true);

  const categories = galleryMeta.categories
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      const res = await settingApi.fetchSettings(['GALLERY_ITEMS', 'GALLERY_META']);
      if (res.success) {
        if (res.data.GALLERY_ITEMS) {
          setGalleryItems(res.data.GALLERY_ITEMS);
        }
        if (res.data.GALLERY_META) {
          setGalleryMeta(res.data.GALLERY_META);
        }
      }
    } catch (error) {
      console.error('Failed to fetch gallery items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems =
    activeTab === 'ALL' ? galleryItems : galleryItems.filter((item) => item.category === activeTab);

  const renderMedia = (item, isModal = false) => {
    const className = isModal
      ? 'w-full h-auto max-h-[60vh] object-contain rounded-2xl'
      : 'w-full h-full object-contain transition-transform duration-500 group-hover:scale-105';

    if (!item.mediaUrl) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-100 text-gray-400 font-bold ${isModal ? 'h-64 rounded-2xl' : 'w-full h-full'}`}
        >
          No Media Available
        </div>
      );
    }

    if (item.mediaType === 'video') {
      return <video src={item.mediaUrl} autoPlay loop muted playsInline className={className} />;
    }

    return <img src={item.mediaUrl} alt={item.title} className={className} />;
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
            className="text-4xl sm:text-6xl font-black tracking-tight leading-normal pb-2"
          >
            <span className="heading-gradient-hero">{galleryMeta.title}</span>
          </AnimatedHeading>

          <p className="text-[#684E67] text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
            {galleryMeta.subtitle}
          </p>

          {/* CATEGORY FILTER CAPSULE BAR (SMOOTH HORIZONTAL SWIPE ON MOBILE, CENTERED ON DESKTOP) */}
          <div className="w-full max-w-full flex items-center justify-center pt-4 sm:pt-6 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white/90 backdrop-blur-xl border-1.5 border-[#FFCCE1] rounded-full shadow-[0_4px_20px_rgba(255,92,138,0.1)] max-w-full overflow-x-auto no-scrollbar scrollbar-none px-2 sm:px-3">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shrink-0 ${
                    activeTab === cat
                      ? 'bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white shadow-md shadow-[#FF5C8A]/35 scale-105 border border-white/30'
                      : 'text-[#2A0826] hover:bg-[#FFF0F3] hover:text-[#FF5C8A] bg-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* GALLERY GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF2A6D]"></div>
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-[#FFCCE1]">
            <h3 className="text-xl font-black text-[#684E67]">Gallery is empty</h3>
            <p className="text-sm font-bold text-[#FF5C8A] mt-2">
              The SuperAdmin has not uploaded any gallery media yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div key={item.id} className="space-y-3 flex flex-col group cursor-pointer">
                {/* CARD MEDIA PREVIEW WITH LIGHTBOX HOVER ICON */}
                <div className="relative w-full h-64 sm:h-72 lg:h-80 rounded-[2rem] overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-1 flex items-center justify-center">
                  {renderMedia(item, false)}
                  {item.badge && (
                    <span className="absolute top-4 left-4 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-white text-[#FF2A6D] shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* TITLE & DETAILS */}
                <div className="px-2 space-y-0.5">
                  <h3 className="text-xl font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm font-bold text-[#684E67] line-clamp-1">{item.subtitle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM CTA BANNER WITH MAGNETIC BUTTON */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 text-center space-y-4 max-w-2xl mx-auto rounded-[24px] border border-[#FFCCE1] shadow-lg relative overflow-hidden">
          {/* ACCENT GLOW STRIP */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]" />

          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#2A0826]">
              Ready to Protect Yourself & Your Loved Ones?
            </h2>
            <p className="text-xs text-[#684E67] font-bold max-w-lg mx-auto leading-relaxed">
              Get complete 365-day emergency SOS protection for just ₹24/year (only ₹2/month). Setup
              in under 2 minutes.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <MagneticButton pullStrength={0.2}>
              <Link
                href="/auth?mode=register"
                className="bg-gradient-to-r from-[#FFF0F3] via-[#FFE6EE] to-[#FFCCE1] border border-[#FF5C8A] text-[#2A0826] hover:bg-gradient-to-r hover:from-[#FF5C8A] hover:to-[#FF2A6D] hover:text-white hover:border-transparent px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-95 whitespace-nowrap group"
              >
                <span>REGISTER FOR ₹24 YEARLY PLAN</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF2A6D] group-hover:text-white shrink-0 transition-colors" />
              </Link>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
