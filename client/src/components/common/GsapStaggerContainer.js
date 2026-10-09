'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export const GsapStaggerContainer = ({
  children,
  className = '',
  staggerDuration = 0.12,
  yOffset = 30,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const childrenElements = container.children;
    if (!childrenElements || childrenElements.length === 0) return;

    gsap.fromTo(
      childrenElements,
      {
        opacity: 0,
        y: yOffset,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: staggerDuration,
        ease: 'power3.out',
      }
    );
  }, [staggerDuration, yOffset]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};
