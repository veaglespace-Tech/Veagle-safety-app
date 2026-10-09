'use client';

import React from 'react';

export const Logo3DFlip = ({ size = 44, className = '' }) => {
  return (
    <div
      className={`logo-3d-coin ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, perspective: '1000px' }}
    >
      <div
        className="logo-3d-inner"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* FRONT FACE (MARATHI/HINDI LOGO 4K CRISP) */}
        <div className="logo-3d-front">
          <img
            src="/images/logo-front.jpeg"
            alt="Sakhi Suraksha SOS Front Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'high-quality',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>

        {/* BACK FACE (ENGLISH LOGO 4K CRISP) */}
        <div className="logo-3d-back">
          <img
            src="/images/logo-back.jpeg"
            alt="Sakhi Suraksha SOS Back Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'high-quality',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Logo3DFlip;
