'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { VolumeX, Volume2, AlertTriangle, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function EmergencyAlarmPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const intervalRef = useRef(null);

  const startSiren = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(1.0, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;

      let high = false;
      intervalRef.current = setInterval(() => {
        if (oscRef.current && audioCtxRef.current) {
          const targetFreq = high ? 700 : 1500;
          oscRef.current.frequency.exponentialRampToValueAtTime(
            targetFreq,
            audioCtxRef.current.currentTime + 0.25
          );
          high = !high;
        }
      }, 350);

      setIsPlaying(true);
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    } catch (err) {
      console.error('Audio Context Error:', err);
    }
  };

  const stopSiren = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (oscRef.current) {
      oscRef.current.stop();
      oscRef.current.disconnect();
    }
    if (audioCtxRef.current) audioCtxRef.current.close();
    if ('vibrate' in navigator) navigator.vibrate(0);
    oscRef.current = null;
    audioCtxRef.current = null;
    setIsPlaying(false);
  };

  useEffect(() => () => stopSiren(), []);

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 pt-5 pb-4 space-y-5 lg:max-w-2xl">
        <div className="animate-fade-up">
          <h1 className="text-xl font-extrabold text-tichi-text tracking-tight">Emergency Siren</h1>
          <p className="text-xs text-tichi-muted mt-0.5">
            Maximum volume loud alarm to deter threats and attract attention
          </p>
        </div>

        <div className="bg-white border border-blush-border rounded-2xl shadow-card overflow-hidden animate-fade-up">
          <div
            className={`px-5 py-3 border-b border-blush-border flex items-center space-x-2 transition-colors ${isPlaying ? 'bg-tichi-emergency' : 'bg-blush-subtle'}`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-white animate-ping' : 'bg-tichi-muted'}`}
            ></span>
            <span
              className={`text-xs font-extrabold uppercase tracking-widest ${isPlaying ? 'text-white' : 'text-tichi-muted'}`}
            >
              {isPlaying ? 'ALARM ACTIVE — BROADCASTING' : 'ALARM STANDBY'}
            </span>
          </div>

          <div className="relative flex items-center justify-center py-16 overflow-hidden">
            {isPlaying && (
              <>
                <div className="absolute w-72 h-72 rounded-full border-2 border-tichi-emergency/20 animate-ping" />
                <div className="absolute w-56 h-56 rounded-full border-2 border-tichi-emergency/30 animate-ping [animation-delay:0.3s]" />
                <div className="absolute w-40 h-40 rounded-full border-2 border-tichi-emergency/50 animate-ping [animation-delay:0.6s]" />
                <div className="absolute w-28 h-28 rounded-full bg-tichi-emergency/10 animate-pulse" />
              </>
            )}

            <button
              onClick={isPlaying ? stopSiren : startSiren}
              className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
                isPlaying
                  ? 'bg-tichi-emergency text-white shadow-sos-holding'
                  : 'bg-plum text-white shadow-plum-lg hover:bg-plum-dark'
              }`}
            >
              {isPlaying ? (
                <VolumeX className="w-14 h-14 mb-1" />
              ) : (
                <Volume2 className="w-14 h-14 mb-1" />
              )}
              <span className="font-extrabold text-sm tracking-wider">
                {isPlaying ? 'STOP' : 'ACTIVATE'}
              </span>
              <span className="text-[10px] font-semibold opacity-75 mt-0.5">
                {isPlaying ? 'TAP TO MUTE' : 'LOUD ALARM'}
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-blush-border rounded-card shadow-card p-4 space-y-3 animate-fade-up">
          <h3 className="font-bold text-sm text-tichi-text">How to use the emergency alarm</h3>
          <div className="space-y-2.5">
            {[
              { step: '1', text: 'Tap ACTIVATE to start the high-decibel siren alarm immediately' },
              {
                step: '2',
                text: 'Hold the device near you or place it on a surface to maximize volume',
              },
              { step: '3', text: 'The alarm will also trigger your device vibration pattern' },
              { step: '4', text: "Tap STOP when you're in a safe environment" },
            ].map((item) => (
              <div key={item.step} className="flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-plum-50 text-plum text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </span>
                <p className="text-xs text-tichi-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start space-x-3 bg-amber-50 border border-amber-200 rounded-card p-4 animate-fade-up">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">For Genuine Emergencies Only</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Use in public or isolated spaces to deter attackers and signal for help. Maximum
              device volume recommended.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 bg-plum-50 border border-plum-200 rounded-card p-4 animate-fade-up">
          <Info className="w-4 h-4 text-plum shrink-0 mt-0.5" />
          <p className="text-xs text-plum font-medium">
            <strong>Pro tip:</strong> Combine with the SOS button on the home screen for full
            emergency response — the alarm draws attention while SOS notifies your trusted contacts
            automatically.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
