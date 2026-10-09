'use client';

import React from 'react';
import Lottie from 'lottie-react';

// HIGH-QUALITY SAFETY LOTTIE JSON ANIMATION PRESETS
export const sosRadarLottieData = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 200,
  h: 200,
  nm: 'SOS Radar Beacon',
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Radar Ring 3',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [80] },
            { t: 90, s: [0] },
          ],
          ix: 11,
        },
        s: {
          a: 1,
          k: [
            { t: 0, s: [40, 40, 100] },
            { t: 90, s: [140, 140, 100] },
          ],
          ix: 6,
        },
      },
      shapes: [
        {
          ty: 'el',
          p: { k: [100, 100] },
          s: { k: [100, 100] },
        },
        {
          ty: 'st',
          c: { k: [1, 0.16, 0.42, 1] },
          w: { k: 4 },
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Radar Center Core',
      sr: 1,
      ks: {
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 45, s: [105, 105, 100] },
            { t: 90, s: [90, 90, 100] },
          ],
          ix: 6,
        },
      },
      shapes: [
        {
          ty: 'el',
          p: { k: [100, 100] },
          s: { k: [70, 70] },
        },
        {
          ty: 'fl',
          c: { k: [1, 0.16, 0.42, 1] },
        },
      ],
    },
  ],
};

export const gpsMapLottieData = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'GPS Pin Pulse',
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'GPS Pin Core',
      sr: 1,
      ks: {
        p: {
          a: 1,
          k: [
            { t: 0, s: [100, 90, 0] },
            { t: 30, s: [100, 75, 0] },
            { t: 60, s: [100, 90, 0] },
          ],
          ix: 2,
        },
      },
      shapes: [
        {
          ty: 'el',
          p: { k: [100, 90] },
          s: { k: [50, 50] },
        },
        {
          ty: 'fl',
          c: { k: [1, 0.36, 0.54, 1] },
        },
      ],
    },
  ],
};

const LottieComponent = typeof Lottie === 'function' ? Lottie : Lottie?.default || Lottie;

export const LottieAnimation = ({
  type = 'sos',
  className = 'w-28 h-28',
  loop = true,
  autoplay = true,
}) => {
  let animationData = sosRadarLottieData;
  if (type === 'gps') animationData = gpsMapLottieData;

  const ResolvedComponent =
    typeof LottieComponent === 'function' ? LottieComponent : LottieComponent?.default;

  if (ResolvedComponent) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ResolvedComponent animationData={animationData} loop={loop} autoplay={autoplay} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center relative ${className}`}>
      <div className="absolute inset-0 rounded-full border-2 border-[#FF2A6D] animate-ping" />
      <div className="w-20 h-20 rounded-full sos-btn-gradient flex flex-col items-center justify-center border-4 border-white shadow-sos-glow">
        <span className="text-white text-xs font-black">SOS</span>
      </div>
    </div>
  );
};
