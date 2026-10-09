'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  alignRight = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom'); // 'bottom' | 'top'
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  // Smart viewport & modal bounds detection to flip up if near bottom
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < 210 && spaceAbove > 180) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${className}`}
    >
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 px-3.5 sm:px-4 py-3 bg-[#FFF0F3] border-1.5 border-[#FFCCE1] rounded-2xl text-xs font-black text-[#2A0826] hover:border-[#FF2A6D] focus:border-[#FF2A6D] focus:ring-2 focus:ring-[#FF2A6D]/20 transition-all cursor-pointer shadow-xs active:scale-[0.99] outline-none"
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#FF2A6D] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* CUSTOM FLOATING DROPDOWN MENU */}
      {isOpen && (
        <div
          className={`absolute ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            alignRight ? 'right-0' : 'left-0'
          } w-full min-w-full bg-white border-2 border-[#FFCCE1] rounded-2xl shadow-[0_16px_40px_rgba(42,8,38,0.22)] z-[9999] animate-fade-in overflow-hidden`}
          style={{ maxWidth: '100vw' }}
        >
          <div
            className="p-1 max-h-48 sm:max-h-56 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#FF5C8A #FFF0F3',
            }}
          >
            <div className="space-y-0.5">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange({ target: { value: opt.value } });
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#FFF0F3] text-[#FF2A6D] font-black shadow-xs'
                        : 'text-[#2A0826] hover:bg-[#FFF0F3]/80 hover:text-[#FF2A6D]'
                    }`}
                  >
                    <span className="truncate pr-1.5">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#FF2A6D] shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
