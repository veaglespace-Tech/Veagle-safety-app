'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { checkActiveSos, clearSosState } from '../../redux/slices/sosSlice.js';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  MapPin,
  ExternalLink,
  PhoneCall,
  X,
  BellRing,
  MessageSquare,
} from 'lucide-react';
import { startEmergencySiren, stopEmergencySiren } from '../../utils/sirenAudio.js';

export const EmergencyAlarmListener = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state?.auth || {});
  const [alarmData, setAlarmData] = useState(null);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const dismissedSosIdsRef = useRef(new Set());
  const socketRef = useRef(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const registerUserRooms = (socketInstance, u) => {
    if (!socketInstance || !u) return;
    const cleanPhone = u.phone ? u.phone.replace(/\D/g, '') : null;
    const userEmail = u.email ? u.email.trim().toLowerCase() : null;

    socketInstance.emit('register-user', {
      email: userEmail,
      phone: cleanPhone,
      role: u.role,
    });

    if (userEmail) socketInstance.emit('join-room', `user:${userEmail}`);
    if (cleanPhone) socketInstance.emit('join-room', `user:${cleanPhone}`);
    if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') {
      socketInstance.emit('join-room', 'admin-ops');
    }
  };

  useEffect(() => {
    let socket = null;

    const connectSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const { SERVER_URL } = await import('../../utils/api.js');
        socket = io(SERVER_URL, {
          path: '/api/socket.io',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          timeout: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[EmergencyAlarmListener] Connected to emergency server');
          if (userRef.current) {
            registerUserRooms(socket, userRef.current);
          }
        });

        socket.on('SOS_ALARM_BROADCAST', (data) => {
          const sosId = data?.sosId || data?.id || data?.sosSessionId;
          if (sosId && dismissedSosIdsRef.current.has(String(sosId))) {
            return; // Ignore recurring broadcast for explicitly dismissed session
          }

          // CRITICAL: Do NOT show siren alert to the victim who triggered SOS!
          // The victim might be in danger — a loud siren + fullscreen alert on their
          // device could attract unwanted attention and put them at greater risk.
          const currentUser = userRef.current;
          if (currentUser) {
            const victimId = data?.victimId;
            const victimEmail = (data?.victimEmail || '').trim().toLowerCase();
            const victimPhone = (data?.victimPhone || '').replace(/\D/g, '');
            const userEmail = (currentUser.email || '').trim().toLowerCase();
            const userPhone = (currentUser.phone || '').replace(/\D/g, '');

            const isVictim =
              (currentUser.id && victimId && currentUser.id === victimId) ||
              (userEmail && victimEmail && userEmail === victimEmail) ||
              (userPhone && victimPhone && userPhone.slice(-10) === victimPhone.slice(-10));

            if (isVictim) {
              console.log('[EmergencyAlarmListener] Suppressed siren for SOS victim (self-triggered)');
              return;
            }
          }

          console.log('[EmergencyAlarmListener] SOS ALARM BROADCAST received:', data);
          setAlarmData(data);
          try {
            startEmergencySiren();
            setIsSirenActive(true);
          } catch (e) {
            console.warn('Audio requires user click gesture');
          }
        });

        socket.on('SOS_ALARM_STOP', (data) => {
          setAlarmData(null);
          stopEmergencySiren();
          setIsSirenActive(false);
          // Admin resolved SOS — clear victim's active session immediately + confirm with API
          dispatch(clearSosState());
          dispatch(checkActiveSos());
        });
      } catch (err) {
        console.warn('[EmergencyAlarmListener] Socket error:', err.message);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
      stopEmergencySiren();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && user) {
      registerUserRooms(socketRef.current, user);
    }
  }, [user]);

  const handleStartAudioSiren = () => {
    if (isSirenActive) {
      stopEmergencySiren();
      setIsSirenActive(false);
    } else {
      startEmergencySiren();
      setIsSirenActive(true);
    }
  };

  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    stopEmergencySiren();
    setIsSirenActive(false);
    if (alarmData) {
      const sosId = alarmData.sosId || alarmData.id || alarmData.sosSessionId;
      if (sosId) {
        dismissedSosIdsRef.current.add(String(sosId));
      }
    }
    setAlarmData(null);
  };

  if (!alarmData) return null;

  const hasVictimPhoto = alarmData.victimPhoto && typeof alarmData.victimPhoto === 'string';
  const currentUser = userRef.current;
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // ==========================================
  // UI 1: COMPACT ADMIN BANNER
  // ==========================================
  if (isAdmin) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in w-max">
        <div className="bg-gradient-to-r from-red-600 to-rose-700 shadow-2xl rounded-full px-6 py-3 flex items-center space-x-6 border-2 border-red-400">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            <span className="text-white font-black text-sm tracking-wide">
              🚨 CRITICAL SOS: {alarmData.victimName}
            </span>
          </div>

          <div className="flex items-center space-x-3 pl-4 border-l border-red-500/50">
            <button
              onClick={handleStartAudioSiren}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-2 ${
                isSirenActive
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-white text-red-600 hover:bg-gray-100'
              }`}
            >
              {isSirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSirenActive ? 'MUTE SIREN' : 'PLAY SIREN'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full bg-red-800 text-red-200 hover:text-white hover:bg-red-900 transition-all cursor-pointer active:scale-95"
              title="Dismiss Alert Banner"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI 2: FULL SCREEN MODAL (For Parents/Users)
  // ==========================================
  return (
    <div className="fixed inset-0 z-[9999] bg-[#2A0826]/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[40px] p-6 sm:p-8 space-y-6 shadow-[0_30px_90px_rgba(255,42,109,0.35)] border-3 border-[#FF2A6D] relative text-[#2A0826] overflow-hidden my-auto animate-scale-up">
        {/* GLOWING AMBIENT ACCENT BAR */}
        <div className="bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] h-3 w-full absolute top-0 left-0 right-0 animate-pulse pointer-events-none" />

        {/* CLOSE (X) DISMISS BUTTON */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#FF2A6D] p-2.5 rounded-2xl hover:bg-[#FFF0F3] transition-all cursor-pointer z-30 flex items-center justify-center active:scale-90"
          title="Dismiss Alert"
          aria-label="Close Emergency Alert"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* 3D SIREN ICON DOCK & TITLE */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative w-22 h-22 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-[#FF2A6D]/25 animate-ping pointer-events-none" />
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white flex items-center justify-center mx-auto shadow-2xl shadow-[#FF2A6D]/40 border-4 border-white relative z-10 animate-bounce">
              <ShieldAlert className="w-10 h-10 text-white stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[#FF2A6D] to-[#E01A4F] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md border border-white/20">
              <BellRing className="w-3.5 h-3.5 animate-spin" />
              <span>CRITICAL EMERGENCY GUARDIAN BROADCAST</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#FF2A6D] tracking-tight">
              🚨 EMERGENCY SIREN ALERT!
            </h2>

            <p className="text-xs font-bold text-[#684E67] max-w-sm mx-auto leading-relaxed">
              <strong className="text-[#2A0826] font-black">{alarmData.victimName}</strong> has
              triggered an emergency SOS broadcast alert!
            </p>
          </div>
        </div>

        {/* GUARDIAN SIREN SOUND CONTROL BUTTON */}
        <button
          type="button"
          onClick={handleStartAudioSiren}
          className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2.5 border-2 cursor-pointer shadow-lg active:scale-95 ${
            isSirenActive
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-500/30 animate-pulse'
              : 'bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white border-[#FF2A6D] shadow-[#FF2A6D]/30 hover:scale-[1.02]'
          }`}
        >
          {isSirenActive ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5 animate-bounce" />
          )}
          <span>
            {isSirenActive
              ? 'MUTE SIREN SOUND'
              : '🔊 TAP HERE TO PLAY EMERGENCY SIREN ON YOUR DEVICE'}
          </span>
        </button>

        {/* DETAILS GLASS CARD */}
        <div className="bg-gradient-to-br from-[#FFF0F3]/80 via-white to-[#FFF0F3]/80 p-5 rounded-3xl border-2 border-[#FFCCE1] space-y-3.5 text-xs font-bold shadow-xs">
          <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-3">
            <span className="text-[#684E67]">Victim Name:</span>
            <div className="flex items-center space-x-2">
              {hasVictimPhoto && (
                <img
                  src={alarmData.victimPhoto}
                  alt={alarmData.victimName}
                  className="w-7 h-7 rounded-full object-cover border-2 border-[#FF2A6D]"
                />
              )}
              <span className="text-sm font-black text-[#2A0826]">{alarmData.victimName}</span>
            </div>
          </div>

          {alarmData.victimPhone && (
            <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-3">
              <span className="text-[#684E67]">Phone Number:</span>
              <a
                href={`tel:${alarmData.victimPhone}`}
                className="font-mono text-[#FF2A6D] bg-white px-3 py-1.5 rounded-xl border border-[#FFCCE1] hover:border-[#FF2A6D] font-black flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{alarmData.victimPhone}</span>
              </a>
            </div>
          )}

          {alarmData.latitude && alarmData.longitude && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#684E67]">GPS Coordinates:</span>
              <span className="font-mono text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-inner select-all">
                {alarmData.latitude}, {alarmData.longitude}
              </span>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="space-y-3 pt-2">
          {alarmData.trackingUrl && (
            <a
              href={alarmData.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-gradient-to-r from-[#FF2A6D] to-[#E01A4F] hover:from-[#E01A4F] hover:to-[#C01540] text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2.5 transition-all shadow-lg shadow-[#FF2A6D]/25 active:scale-95 border border-[#FF5C8A]"
            >
              <MapPin className="w-5 h-5 animate-pulse" />
              <span>OPEN LIVE GPS MAP & SIREN CONTROLS</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </a>
          )}

          {alarmData.whatsappShareUrl && (
            <a
              href={alarmData.whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2.5 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 border border-emerald-400"
            >
              <MessageSquare className="w-5 h-5" />
              <span>DISPATCH WHATSAPP EMERGENCY ALERT</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
