'use client';

import React, { useState, useEffect, useCallback } from 'react';

const BANNERS = [
  {
    id: 1,
    src: '/images/banner-1.jpg',
    alt: 'Sakhi Suraksha SOS App Banner 1',
  },
  {
    id: 2,
    src: '/images/banner-2.jpg',
    alt: 'Sakhi Suraksha SOS App Banner 2',
  },
  {
    id: 3,
    src: '/images/cards-banner.jpeg',
    alt: 'Sakhi Suraksha SOS App Banner 3',
  },
];

export const HeroBannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % BANNERS.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 3500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden">
      {/* DIRECT IMAGE BANNER SPREAD FILLING THE EXACT OPEN SPACE */}
      <div className="relative w-full h-[220px] sm:h-[320px] md:h-[400px] lg:h-[450px] flex items-center justify-center">
        {BANNERS.map((banner, index) => (
          <img
            key={banner.id}
            src={banner.src}
            alt={banner.alt}
            className={`absolute inset-0 w-full h-full object-contain object-center transition-all duration-700 ease-in-out drop-shadow-[0_20px_50px_rgba(255,42,109,0.2)] ${
              index === currentIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
