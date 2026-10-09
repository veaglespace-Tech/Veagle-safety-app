'use client';

import React, { useState } from 'react';
import { RotateCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const Feature3DCard = ({
  icon: Icon,
  title,
  desc,
  backTitle,
  points,
  badgeText,
  gradient = 'bg-gradient-to-br from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F]',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = (e) => {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  return (
    <div
      className="perspective-1000 w-full h-[270px] cursor-pointer group select-none"
      onClick={handleCardClick}
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
          setIsFlipped(true);
        }
      }}
      onMouseLeave={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
          setIsFlipped(false);
        }
      }}
    >
      <div
        className={`relative w-full h-full duration-700 transform-style-3d transition-transform ease-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT FACE OF 3D CARD */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden bg-white/95 backdrop-blur-2xl p-8 rounded-3xl border-1.5 border-[#FFCCE1] hover:border-[#FF5C8A] shadow-[0_10px_30px_rgba(255,92,138,0.10)] hover:shadow-[0_20px_50px_rgba(255,92,138,0.25)] flex flex-col justify-between transition-all duration-300 ${
            isFlipped
              ? 'pointer-events-none opacity-0 sm:opacity-100'
              : 'pointer-events-auto opacity-100'
          }`}
        >
          <div>
            <div className="w-11 h-11 rounded-full bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] flex items-center justify-center mb-5 shrink-0 group-hover:scale-110 group-hover:bg-[#FFCCE1]/60 transition-all duration-300">
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>

            <h3 className="text-xl font-black text-[#2A0826] group-hover:text-[#FF2A6D] transition-colors duration-300 min-h-[56px] flex items-start leading-tight mb-2">
              {title}
            </h3>

            <p className="text-xs text-[#684E67] font-bold leading-relaxed">{desc}</p>
          </div>
        </div>

        {/* BACK FACE OF 3D CARD (MATCHED TO WEBSITE BRAND PALETTE) */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-7 rounded-3xl border-2 border-white/30 text-white flex flex-col justify-between shadow-[0_20px_60px_rgba(255,42,109,0.35)] relative overflow-hidden ${gradient} ${
            isFlipped
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0 sm:opacity-100'
          }`}
        >
          {/* AMBIENT BACKGROUND GLOW INSIDE BACK FACE */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 backdrop-blur-md text-white px-3.5 py-1 rounded-full border border-white/35 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck size={13} className="text-[#FFE600]" />
                <span>{badgeText || '3D SAFETY SPECS'}</span>
              </span>
              <RotateCw size={13} className="text-white/80 animate-spin" />
            </div>

            <h4 className="text-lg font-black tracking-tight mb-2.5 text-white">
              {backTitle || title}
            </h4>

            <ul className="space-y-2 text-xs font-extrabold text-white/95">
              {points?.map((pt, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/25 shadow-xs"
                >
                  <CheckCircle2 size={15} className="text-[#FFE600] shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="leading-snug">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 pt-2 border-t border-white/25 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/90">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#FFE600]" />
              <span>Sakhi 365 Security</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
