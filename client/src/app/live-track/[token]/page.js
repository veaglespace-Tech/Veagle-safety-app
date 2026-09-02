'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, SERVER_URL } from '../../../utils/api.js';
import { LiveLocationMap } from '../../../components/location/DynamicLiveLocationMap.js';
import {
  ShieldAlert,
  MapPin,
  PhoneCall,
  Clock,
  CheckCircle,
  Volume2,
  VolumeX,
  AlertTriangle,
  User,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { startEmergencySiren, stopEmergencySiren } from '../../../utils/sirenAudio.js';

export const dynamic = 'force-dynamic';

export default function LivePublicTrackingPage() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadPublicSos();
    // Fallback polling every 5 seconds for robust location updates
    const pollingInterval = setInterval(() => {
      if (token) loadPublicSos(true); // silent load
    }, 5000);

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (token) {
        socket.emit('join-track', { token });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for targeted location updates from the track:{token} room
    socket.on('location-updated', (data) => {
      setLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        recordedAt: data.timestamp,
      });
    });

    // Also listen for SOS_LOCATION_UPDATE (emitted to parent/guardian rooms)
    socket.on('SOS_LOCATION_UPDATE', (data) => {
      setSession((prev) => {
        // Only accept updates for this session's sosSessionId
        if (prev && data.sosSessionId && prev.id === data.sosSessionId) {
          setLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            recordedAt: data.timestamp,
          });
        }
        return prev;
      });
    });

    socket.on('SOS_ALARM_STOP', (data) => {
      // Only stop siren if this stop event relates to our session
      setSession((prev) => {
        if (!data?.sosId || !prev?.id || data.sosId === prev.id || String(data.sosId) === String(prev.id)) {
          stopEmergencySiren();
          setIsSirenPlaying(false);
        }
        return prev;
      });
    });

    return () => {
      clearInterval(pollingInterval);
      if (token) socket.emit('leave-track', { token });
      socket.disconnect();
      stopEmergencySiren();
    };
  }, [token]);

  const loadPublicSos = async (isSilent = false) => {
    try {
      const res = await api.get(`/sos/public-track/${token}`);
      const sosData = res.data.sosSession || res.data.session;
      setSession(sosData);
      if (sosData?.locations?.length > 0) {
        // Pick the latest location (last element since we now fetch in ascending order)
        setLocation(sosData.locations[sosData.locations.length - 1]);
      }
    } catch (err) {
      if (!isSilent) setError('Emergency link invalid, expired, or has ended.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleToggleSiren = () => {
    if (isSirenPlaying) {
      stopEmergencySiren();
      setIsSirenPlaying(false);
    } else {
      startEmergencySiren();
      setIsSirenPlaying(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF2A6D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#FFF0F3] p-4 flex items-center justify-center text-center">
        <div className="bg-white border-2 border-[#FFCCE1] rounded-3xl p-8 max-w-sm space-y-4 shadow-xl">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="font-black text-xl text-[#2A0826]">Tracking Link Resolved</h2>
          <p className="text-xs text-[#684E67] font-bold leading-relaxed">
            {error ||
              'This emergency live tracking session is no longer active or the user has confirmed safety.'}
          </p>
        </div>
      </div>
    );
  }

  const isEmergency = session.status === 'ACTIVE';
  const victimName = session.user?.fullName || 'Sakhi Member';
  const victimPhoto = session.user?.profilePhoto;
  const userInitials = victimName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const lat = location?.latitude || session?.latitude;
  const lng = location?.longitude || session?.longitude;

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#2A0826] font-sans p-4 lg:p-8 max-w-6xl mx-auto space-y-4 pb-12">
      {/* HEADER BANNER */}
      <div
        className={`p-5 rounded-3xl text-white flex items-center justify-between shadow-xl ${isEmergency ? 'bg-gradient-to-r from-[#FF2A6D] via-rose-500 to-[#FF2A6D] animate-pulse border-2 border-white' : 'bg-[#2A0826]'}`}
      >
        <div className="flex items-center space-x-3">
          {victimPhoto ? (
            <img
              src={victimPhoto}
              alt={victimName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shrink-0 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-base border-2 border-white shrink-0 shadow-md">
              {userInitials}
            </div>
          )}

          <div>
            <h1 className="font-black text-lg">{victimName} — Live GPS Stream</h1>
            <p className="text-xs text-white/90 font-bold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              {isConnected ? '🟢 LIVE SOCKET CONNECTION' : '🔴 DISCONNECTED / RECONNECTING'}
            </p>
          </div>
        </div>

        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
          ● {session.status}
        </span>
      </div>
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
        
        {/* LEFT COLUMN: MAP */}
        <div className="lg:col-span-8 mb-4 lg:mb-0">
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-80 sm:h-96 lg:h-[600px] w-full relative">
            <LiveLocationMap
              lat={lat || 28.6139}
              lng={lng || 77.209}
              accuracy={location?.accuracy || 15}
              userName={`${victimName} (EMERGENCY)`}
              isEmergency={isEmergency}
              locationHistory={session.locations || []}
            />
            {isEmergency && (
              <div className="absolute top-4 left-4 right-4 z-[999] pointer-events-none flex justify-center">
                <div className="bg-[#FF2A6D] text-white px-4 py-2 rounded-full text-xs font-black shadow-lg animate-bounce flex items-center gap-2 border-2 border-white">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                  LIVE EMERGENCY TRACKING ACTIVE
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS */}
        <div className="lg:col-span-4 space-y-4">
          {/* SIREN TRIGGER / UNMUTE BUTTON FOR GUARDIAN */}
          {isEmergency && (
            <div className="bg-white border-2 border-[#FF2A6D] rounded-2xl p-4 shadow-md flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FF2A6D]/15 text-[#FF2A6D] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-black text-[#FF2A6D]">GUARDIAN EMERGENCY ALARM</p>
                <p className="text-xs font-bold text-[#684E67] mt-1">
                  Tap button to play high-decibel siren on your device
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleSiren}
                className={`w-full px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border-2 ${
                  isSirenPlaying
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg animate-pulse'
                    : 'bg-[#FF2A6D] text-white border-[#FF2A6D] shadow-md hover:brightness-110'
                }`}
              >
                {isSirenPlaying ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4 animate-bounce" />
                )}
                <span>
                  {isSirenPlaying ? 'MUTE SIREN SOUND' : '🔊 PLAY EMERGENCY SIREN'}
                </span>
              </button>
            </div>
          )}

          {/* VICTIM DETAILS */}
          <div className="bg-white border-2 border-[#FFCCE1] rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs border-b border-[#FFCCE1] pb-3 font-bold">
              <span className="text-[#684E67]">Emergency User Phone:</span>
              {session.user?.phone ? (
                <a
                  href={`tel:${session.user?.phone}`}
                  className="font-black text-[#FF2A6D] hover:underline text-sm font-mono flex items-center space-x-1"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{session.user?.phone}</span>
                </a>
              ) : (
                <span className="font-mono text-[#2A0826]">Available in SOS Dispatch</span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#684E67]">Last GPS Timestamp:</span>
              <span className="font-mono text-[#2A0826]">
                {location?.recordedAt ? new Date(location.recordedAt).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>

          {/* DIRECT EMERGENCY HELPLINE CALL */}
          <a
            href="tel:112"
            className="w-full bg-[#FF2A6D] text-white py-4 rounded-2xl text-center shadow-md flex items-center justify-center space-x-2 text-xs uppercase tracking-wider font-black hover:bg-[#E01A4F] transition-all"
          >
            <PhoneCall className="w-5 h-5" />
            <span>CALL 112 NATIONAL EMERGENCY</span>
          </a>
          
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white border-2 border-[#FFCCE1] text-[#2A0826] py-3 rounded-2xl text-center shadow-sm flex items-center justify-center space-x-2 text-xs font-black hover:bg-rose-50 transition-all"
          >
            <Navigation className="w-5 h-5" />
            <span>GET DIRECTIONS (GOOGLE MAPS)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
