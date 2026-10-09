'use client';

import React, { useRef, useState } from 'react';

export const MagneticButton = ({
  children,
  className = '',
  style = {},
  onClick,
  pullStrength = 0.35,
  ...props
}) => {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * pullStrength;
    const distanceY = (e.clientY - centerY) * pullStrength;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  const isHiddenByTailwind =
    className &&
    (className.includes('hidden') ||
      className.includes('md:hidden') ||
      className.includes('lg:hidden'));

  return (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        display: isHiddenByTailwind ? undefined : 'inline-block',
        transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${isHovered ? 1.05 : 1})`,
        transition: isHovered
          ? 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease, filter 0.3s ease'
          : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease, filter 0.3s ease',
        cursor: 'pointer',
        willChange: 'transform',
        ...style,
      }}
      className={`magnetic-btn-wrapper ${isHovered ? 'magnetic-hovered' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default MagneticButton;
