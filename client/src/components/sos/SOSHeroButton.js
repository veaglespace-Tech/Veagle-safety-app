'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldAlert, VolumeX, Volume2, Radio, Siren, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { startEmergencySos, resolveEmergencySos } from '../../redux/slices/sosSlice.js';
import { openWhatsAppSosEmergency } from '../../utils/whatsappHelper.js';
import { startEmergencySiren, stopEmergencySiren } from '../../utils/sirenAudio.js';
import { useRouter } from 'next/navigation';

export const SOSHeroButton = ({ onTriggerComplete }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isSilent, setIsSilent] = useState(false);
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const holdingRef = useRef(false); // Ref to avoid stale closure in endHold
  const triggeredRef = useRef(false); // Prevent double-trigger

  const { activeSession } = useSelector((state) => state?.sos || {});
  const { latitude, longitude } = useSelector((state) => state?.location || {});

  const HOLD_DURATION = 3000;

  const clearHoldInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startHold = useCallback((e) => {
    // Prevent default to stop context menu, text selection on mobile long press
    if (e) e.preventDefault();


    // Prevent duplicate start if already holding
    if (holdingRef.current) return;

    holdingRef.current = true;
    triggeredRef.current = false;
    setHolding(true);
    setProgress(0);
    setCountdown(3);
    startTimeRef.current = Date.now();

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    clearHoldInterval();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      const remainingSecs = Math.max(Math.ceil((HOLD_DURATION - elapsed) / 1000), 1);

      setProgress(pct);
      setCountdown(remainingSecs);

      if (elapsed >= HOLD_DURATION) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        handleTriggered();
      }
    }, 30);
  }, [activeSession, router, clearHoldInterval]);

  const endHold = useCallback((e) => {
    if (e) e.preventDefault();
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    setProgress(0);
    setCountdown(3);
    clearHoldInterval();
  }, [clearHoldInterval]);

  const handleTriggered = async () => {
    // Prevent double-trigger
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    holdingRef.current = false;
    setHolding(false);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 400]);
    }

    if (activeSession) {
      stopEmergencySiren();
      try {
        await dispatch(resolveEmergencySos(activeSession.id)).unwrap();
      } catch (e) {
        console.error('Failed to stop SOS:', e);
        alert('Failed to stop SOS. Please check your connection.');
      }
      return;
    }

    // Victim siren is kept OFF as per requirements to prevent escalating danger.
    // The siren will only sound on Admin, Organization, and Parent dashboards via Socket broadcast.

    if (!('geolocation' in navigator)) {
      alert('Your browser does not support Geolocation. Cannot trigger live tracking SOS.');
      return;
    }

    let realLat = latitude;
    let realLng = longitude;
    let realAcc = 15;

    try {
      // 1. Force fresh GPS fetch before SOS starts
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      realLat = position.coords.latitude;
      realLng = position.coords.longitude;
      realAcc = position.coords.accuracy;
    } catch (e) {
      console.error('[GPS Fetch Error]:', e);
      if (e.code === 1) {
        alert('Location permission denied. SOS will trigger WITHOUT live GPS tracking.');
      } else {
        alert('Unable to fetch GPS location. SOS will trigger WITHOUT live GPS tracking.');
      }
    }

    try {
      // 2. Generate a tracking token on the client to avoid async popup blocking
      const shareToken = crypto.randomUUID();

      // 3. Open WhatsApp synchronously during the click event!
      openWhatsAppSosEmergency({
        latitude: realLat,
        longitude: realLng,
        publicShareToken: shareToken,
      });

      // 4. Dispatch SOS to backend (pass the token so backend uses it)
      const res = await dispatch(
        startEmergencySos({
          isSilent,
          initialLat: realLat,
          initialLng: realLng,
          accuracy: realAcc,
          shareToken,
          emergencyMessage: isSilent
            ? 'Discreet Emergency SOS Triggered'
            : 'EMERGENCY SOS! I NEED HELP IMMEDIATELY!',
        })
      ).unwrap();

      if (onTriggerComplete) onTriggerComplete();
      router.push('/active-sos');
    } catch (e) {
      console.error('[SOS Trigger Error]:', e);
      alert('Failed to trigger SOS. Please check your connection.');
    }
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 124; // Radius = 124px
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center my-6 relative select-none">
      {/* 3D EMBLEM DYNAMIC CONTAINER */}
      <div className="relative w-84 h-84 flex items-center justify-center">
        {/* MULTI-LAYER DYNAMIC PULSING RADAR WAVES */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            holding
              ? 'bg-gradient-to-r from-[#FF2A6D] via-[#FF5C8A] to-[#FFD700] opacity-80 scale-125 blur-2xl animate-pulse'
              : activeSession
                ? 'bg-gradient-to-r from-[#FF0000] to-[#CC0000] opacity-80 blur-2xl animate-[ping_1s_ease-in-out_infinite]'
                : 'bg-gradient-to-r from-[#FF5C8A]/25 via-[#FF2A6D]/20 to-[#FFD166]/25 blur-2xl animate-pulse'
          }`}
        />

        {/* SPINNING NEON GRADIENT ORBIT RING */}
        <div className="absolute w-[306px] h-[306px] rounded-full border-2 border-dashed border-[#FFCCE1]/60 animate-[spin_20s_linear_infinite] pointer-events-none" />

        {/* ELEGANT GOLDEN SHIMMER ACCENT RING */}
        <div className="absolute w-[290px] h-[290px] rounded-full border-2 border-gold/50 shadow-md pointer-events-none" />

        {/* HIGH-PRECISION SVG TIMER RING */}
        <svg className="w-80 h-80 transform -rotate-90 pointer-events-none z-10">
          <circle
            cx="160"
            cy="160"
            r="124"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-[#FFCCE1]/40"
          />
          <circle
            cx="160"
            cy="160"
            r="124"
            stroke="url(#sosLuxuryDynamicGradient)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75 drop-shadow-[0_0_18px_rgba(255,42,109,0.95)]"
          />
          <defs>
            <linearGradient id="sosLuxuryDynamicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF2A6D" />
              <stop offset="50%" stopColor="#FF5C8A" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
        </svg>

        {/* MAIN 3D COLOR-CHANGING DYNAMIC SOS BUTTON */}
        <button
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', userSelect: 'none' }}
          className={`absolute w-56 h-56 rounded-full flex flex-col items-center justify-center z-30 transition-all duration-300 transform cursor-pointer shadow-[0_20px_60px_rgba(255,42,109,0.45)] border-4 border-white active:scale-95 ${
            holding
              ? 'bg-gradient-to-tr from-[#E01A4F] via-[#FF2A6D] to-[#FFD700] text-white scale-110 shadow-[0_0_80px_rgba(255,42,109,0.8)] animate-pulse'
              : activeSession
                ? 'bg-gradient-to-r from-[#FF0000] via-[#CC0000] to-[#990000] text-white animate-[pulse_0.6s_ease-in-out_infinite] shadow-[0_0_60px_rgba(255,0,0,0.7),0_0_120px_rgba(255,0,0,0.4)] border-red-300'
                : 'bg-gradient-to-br from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white hover:scale-105 hover:shadow-[0_25px_65px_rgba(255,42,109,0.55)]'
          }`}
        >
          {/* INNER GLASS & NEON SHADOW */}
          <div className="absolute inset-2.5 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-black/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5 text-center">
            {/* 3D ICON WITH DYNAMIC ANIMATION */}
            <div className="relative">
              <ShieldAlert
                className={`w-10 h-10 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-transform ${
                  holding ? 'scale-125 animate-bounce text-[#FFD700]' : 'animate-pulse'
                }`}
              />
              <Siren className="w-5 h-5 text-[#FFD700] absolute -top-2 -right-3 animate-pulse filter drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
            </div>

            {/* DYNAMIC TEXT COUNTDOWN / SOS */}
            <span className="text-3xl sm:text-4xl font-black tracking-widest text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              {holding ? `${countdown}s` : activeSession ? 'STOP' : 'SOS'}
            </span>

            {/* GLASSMORPHISM HOLD INSTRUCTION BADGE */}
            <span
              className={`text-[10px] font-black uppercase tracking-widest text-white px-4 py-1 rounded-full border backdrop-blur-md shadow-md transition-all flex items-center space-x-1.5 ${
                holding
                  ? 'bg-[#FF2A6D] border-white text-white animate-ping'
                  : 'bg-black/30 border-white/30 text-white/95'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${holding ? 'bg-gold animate-ping' : 'bg-emerald-400 animate-pulse'}`}
              />
              <span>
                {holding ? 'DISPATCHING...' : activeSession ? 'VIEW STATUS' : 'HOLD 3 SECONDS'}
              </span>
            </span>
          </div>
        </button>
      </div>

      {/* FOOTER SILENT MODE SWITCH */}
      <div className="mt-4 flex flex-col items-center space-y-3 z-30">
        <p className="text-xs font-extrabold text-[#684E67] text-center tracking-wide flex items-center space-x-1.5 bg-[#FFF0F3] px-4 py-2 rounded-2xl border border-[#FFCCE1] shadow-xs">
          <Radio className="w-4 h-4 text-[#FF2A6D] animate-pulse" />
          <span>Press & hold for 3 seconds to broadcast emergency GPS location</span>
        </p>

        <button
          type="button"
          onClick={() => setIsSilent(!isSilent)}
          className={`flex items-center space-x-2 text-xs font-black px-5 py-2.5 rounded-full transition-all border-2 shadow-sm cursor-pointer active:scale-95 ${
            isSilent
              ? 'bg-gradient-to-r from-[#FF2A6D] to-[#E01A4F] text-white border-white shadow-coral-glow'
              : 'bg-white text-[#2A0826] border-[#FFCCE1] hover:border-[#FF2A6D]'
          }`}
        >
          {isSilent ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#FF2A6D]" />
          )}
          <span>
            Silent Emergency Mode: {isSilent ? 'ON (Discreet Alert)' : 'OFF (Loud Siren)'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${isSilent ? 'bg-white animate-ping' : 'bg-emerald-500'}`}
          />
        </button>
      </div>
    </div>
  );
};
