'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.js';
import { useSelector } from 'react-redux';
import { api } from '../../utils/api.js';
import {
  Navigation,
  Clock,
  ShieldCheck,
  Info,
  MapPin,
  ArrowRight,
  Shield,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export default function UserTrackJourneyPage() {
  const { latitude, longitude } = useSelector((state) => state?.location || {});
  const [activeTab, setActiveTab] = useState('JOURNEY');
  const [destination, setDestination] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [isCustomMinutes, setIsCustomMinutes] = useState(false);
  const [journey, setJourney] = useState(null);

  const [checkinInterval, setCheckinInterval] = useState('15');
  const [isCustomCheckin, setIsCustomCheckin] = useState(false);
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(false);

  // Autocomplete State
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [destLat, setDestLat] = useState(null);
  const [destLng, setDestLng] = useState(null);
  const searchTimeoutRef = React.useRef(null);

  useEffect(() => {
    loadActiveJourney();
    loadActiveCheckin();
  }, []);

  const loadActiveJourney = async () => {
    try {
      const res = await api.get('/journey/active');
      setJourney(res.data.journey);
    } catch (err) {
      console.warn('No active journey found or failed to load.');
    }
  };

  const loadActiveCheckin = async () => {
    try {
      const res = await api.get('/checkin/active');
      setCheckin(res.data.checkin);
    } catch (err) {
      console.warn('No active checkin found or failed to load.');
    }
  };

  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    setShowDropdown(true);

    try {
      // Free OpenStreetMap Nominatim API for location search
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Location search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDestinationChange = (e) => {
    const val = e.target.value;
    setDestination(val);
    
    // Clear previous selected coordinates if they start typing again
    setDestLat(null);
    setDestLng(null);

    // Debounce the search API call
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(val);
    }, 500);
  };

  const handleSelectLocation = (loc) => {
    setDestination(loc.display_name);
    setDestLat(parseFloat(loc.lat));
    setDestLng(parseFloat(loc.lon));
    setShowDropdown(false);
  };

  const handleStartJourney = async (e) => {
    e.preventDefault();
    if (!destination || !minutes || Number(minutes) <= 0) {
      alert('Please enter a valid destination and travel duration in minutes.');
      return;
    }
    if (!destLat || !destLng) {
      alert('Please select a specific location from the dropdown suggestions.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/journey/start', {
        destinationName: destination,
        originLat: latitude,
        originLng: longitude,
        destLat: destLat,
        destLng: destLng,
        minutesToArrive: minutes,
      });
      setJourney(res.data.journey);
    } catch (err) {
      alert('Failed to start journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJourney = async () => {
    if (!journey) return;
    try {
      await api.post('/journey/complete', { journeyId: journey.id });
      setJourney(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete journey.');
    }
  };

  const handleStartCheckin = async () => {
    if (!checkinInterval || Number(checkinInterval) <= 0) {
      alert('Please enter a valid check-in interval in minutes.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/checkin/start', { intervalMins: checkinInterval });
      setCheckin(res.data.checkin);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSafeCheckin = async () => {
    if (!checkin) return;
    try {
      await api.post('/checkin/safe', { checkinId: checkin.id });
      setCheckin(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm safety.');
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* BACKGROUND BLOBS */}
        <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#FF5C8A]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed top-[40%] -right-[10%] w-[40%] h-[40%] bg-[#9B6B9E]/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 space-y-6 relative z-10 animate-fade-up lg:max-w-4xl xl:max-w-5xl">
          {/* PAGE TITLE HEADER */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFF0F3] via-white to-[#FFF0F3] text-[#FF2A6D] border-2 border-[#FFCCE1] flex items-center justify-center mx-auto shadow-[0_8px_25px_rgba(255,92,138,0.2)]">
              <Navigation className="w-8 h-8 text-[#FF2A6D] animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              <span className="heading-gradient-hero">Stay </span>
              <span className="heading-gradient-rose">Protected</span>
            </h1>
            <p className="text-xs sm:text-sm font-extrabold text-[#684E67] max-w-md mx-auto">
              Real-time GPS trip tracking & custom safety check-in timer alarms
            </p>
          </div>

          {/* DUAL TAB SWITCHER */}
          <div className="bg-gradient-to-r from-white via-[#FFF0F3] to-white p-2 border-2 border-[#FFCCE1] shadow-md flex gap-2 rounded-2xl">
            {[
              { key: 'JOURNEY', label: 'Track Journey', icon: Navigation },
              { key: 'CHECKIN', label: 'Check On Me', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3.5 rounded-xl font-black text-xs transition-all duration-300 flex items-center justify-center space-x-2 uppercase tracking-wider cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white shadow-[0_8px_25px_rgba(255,42,109,0.38)]'
                      : 'bg-white text-[#2A0826] hover:text-[#FF2A6D] hover:bg-[#FFF0F3] border border-[#FFCCE1]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: TRACK JOURNEY */}
          {activeTab === 'JOURNEY' && (
            <div className="space-y-4 animate-fade-up">
              {journey ? (
                <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 sm:p-8 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_16px_50px_rgba(255,92,138,0.18)] space-y-6">
                  <div className="flex items-center justify-between border-b border-[#FFCCE1] pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                      <h3 className="font-black text-base text-[#2A0826]">
                        Protected Journey Active
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-black text-[#FF2A6D] bg-white px-3 py-1 rounded-full border border-[#FFCCE1] shadow-xs">
                      ETA{' '}
                      {new Date(journey.expectedArrival).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* ROUTE STEPS */}
                  <div className="bg-white rounded-2xl p-5 space-y-4 border-2 border-[#FFCCE1] shadow-xs">
                    <div className="flex items-start space-x-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF5C8A] mt-1 shrink-0 shadow-sm"></div>
                      <div>
                        <p className="text-[10px] font-black text-[#684E67] uppercase tracking-widest">
                          Starting Point
                        </p>
                        <p className="text-sm font-black text-[#2A0826] mt-0.5">
                          {journey.originName || 'Current GPS Location'}
                        </p>
                      </div>
                    </div>
                    <div className="w-0.5 h-6 bg-[#FFCCE1] ml-1.5"></div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF2A6D] mt-1 shrink-0 shadow-sm animate-pulse"></div>
                      <div>
                        <p className="text-[10px] font-black text-[#684E67] uppercase tracking-widest">
                          Destination
                        </p>
                        <p className="text-sm font-black text-[#2A0826] mt-0.5">
                          {journey.destinationName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteJourney}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black py-4 rounded-full text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>I'VE ARRIVED SAFELY</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleStartJourney}
                  className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 sm:p-8 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_16px_50px_rgba(255,92,138,0.18)] space-y-6 transition-all duration-500"
                >
                  <div>
                    <h3 className="font-black text-lg text-[#2A0826]">Start Protected Journey</h3>
                    <p className="text-xs text-[#684E67] font-extrabold mt-1">
                      Your trusted guardians can track your live progress. An alert fires if you
                      don't arrive on time.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#2A0826] mb-2">
                        Where are you heading?
                      </label>
                      <div className="relative z-50">
                        <MapPin className={`w-5 h-5 absolute left-3.5 top-3.5 transition-colors ${destLat ? 'text-emerald-500' : 'text-[#FF2A6D]'}`} />
                        <input
                          type="text"
                          placeholder="e.g. Shivaji Nagar, Pune"
                          value={destination}
                          onChange={handleDestinationChange}
                          onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                          required
                          className={`w-full pl-11 pr-10 py-3 rounded-2xl border-2 text-xs font-bold focus:ring-4 focus:outline-none bg-white transition-all shadow-xs ${
                            destLat ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/15 text-emerald-900' : 'border-[#FFCCE1] focus:border-[#FF2A6D] focus:ring-[#FF2A6D]/15 text-[#2A0826]'
                          }`}
                        />
                        {isSearching && (
                          <div className="absolute right-4 top-3.5 w-4 h-4 rounded-full border-2 border-[#FF2A6D] border-t-transparent animate-spin"></div>
                        )}
                        {destLat && !isSearching && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-3.5 animate-scale-up" />
                        )}

                        {/* DROPDOWN MENU */}
                        {showDropdown && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#FFCCE1] rounded-2xl shadow-xl overflow-hidden animate-fade-up">
                            {searchResults.map((loc, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectLocation(loc)}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-[#684E67] hover:bg-[#FFF0F3] hover:text-[#FF2A6D] border-b border-[#FFCCE1]/40 last:border-0 transition-colors flex flex-col cursor-pointer"
                              >
                                <span className="text-[#2A0826] text-sm truncate">{loc.name}</span>
                                <span className="truncate opacity-70 mt-0.5">{loc.display_name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black uppercase tracking-wider text-[#2A0826]">
                          Travel Duration (Minutes)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomMinutes(!isCustomMinutes)}
                          className="text-[11px] font-black text-[#FF2A6D] hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isCustomMinutes ? 'Use Presets' : 'Custom Duration'}</span>
                        </button>
                      </div>

                      {/* QUICK PRESETS OR CUSTOM INPUT */}
                      {isCustomMinutes ? (
                        <div className="relative">
                          <Clock className="w-5 h-5 text-[#FF2A6D] absolute left-3.5 top-3" />
                          <input
                            type="number"
                            min="1"
                            max="720"
                            placeholder="Enter custom minutes (e.g. 10, 25, 90)"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#FFCCE1] text-xs font-bold focus:border-[#FF2A6D] focus:ring-4 focus:ring-[#FF2A6D]/15 focus:outline-none bg-white transition-all text-[#2A0826] font-mono shadow-xs"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2.5">
                          {['15', '30', '45', '60'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setMinutes(m);
                                setIsCustomMinutes(false);
                              }}
                              className={`py-3.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer ${
                                minutes === m && !isCustomMinutes
                                  ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white border-transparent shadow-[0_6px_20px_rgba(255,42,109,0.3)]'
                                  : 'bg-white text-[#2A0826] border-[#FFCCE1] hover:border-[#FF2A6D] hover:bg-[#FFF0F3]'
                              }`}
                            >
                              {m === '60' ? '1 Hour' : `${m} Mins`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !destination}
                    className="w-full bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-4 rounded-full text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_28px_rgba(255,42,109,0.38)] font-black disabled:opacity-60 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>
                      {loading ? 'STARTING...' : `START JOURNEY (${minutes || '30'} MINS)`}
                    </span>
                  </button>
                </form>
              )}

              <div className="flex items-center space-x-3.5 bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#FFCCE1] shadow-xs">
                <div className="w-9 h-9 rounded-2xl bg-[#FFF0F3] text-[#FF2A6D] border border-[#FFCCE1] flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-[#FF2A6D]" />
                </div>
                <p className="text-xs text-[#684E67] font-bold leading-relaxed">
                  Journey tracking continuously updates your location every 30 seconds. Your trusted
                  contacts can view live progress via the shared tracking link.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CHECK ON ME */}
          {activeTab === 'CHECKIN' && (
            <div className="space-y-4 animate-fade-up">
              {checkin ? (
                <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 sm:p-8 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_16px_50px_rgba(255,92,138,0.18)] space-y-6 text-center">
                  <div className="w-16 h-16 bg-[#FFF0F3] text-[#FF2A6D] rounded-full mx-auto flex items-center justify-center border-2 border-[#FFCCE1] shadow-sm">
                    <Clock className="w-8 h-8 animate-pulse text-[#FF2A6D]" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#2A0826]">Safety Timer Running</h3>
                    <p className="text-xs text-[#684E67] font-extrabold mt-1">
                      You'll be asked to confirm safety at:
                    </p>
                    <p className="text-3xl font-black text-[#FF2A6D] mt-2 font-mono">
                      {new Date(checkin.triggerAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <p className="text-xs text-[#684E67] font-bold bg-white p-4 rounded-2xl border border-[#FFCCE1]">
                    If you don't respond by the scheduled time, your trusted contacts will be
                    automatically notified.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmSafeCheckin}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black py-4 rounded-full text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>YES, I'M SAFE NOW</span>
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white via-[#FFF0F3] to-white p-6 sm:p-8 border-2 border-[#FFCCE1] hover:border-[#FF5C8A] rounded-3xl shadow-[0_16px_50px_rgba(255,92,138,0.18)] space-y-6">
                  <div>
                    <h3 className="font-black text-lg text-[#2A0826]">Safety Check-In Timer</h3>
                    <p className="text-xs text-[#684E67] font-extrabold mt-1">
                      Set a timer. We'll ask if you're safe. No response triggers automatic
                      escalation to your trusted contacts.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-[#2A0826]">
                        Check-in Interval (Minutes)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomCheckin(!isCustomCheckin)}
                        className="text-[11px] font-black text-[#FF2A6D] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{isCustomCheckin ? 'Use Presets' : 'Custom Interval'}</span>
                      </button>
                    </div>

                    {/* QUICK PRESETS OR CUSTOM INPUT FOR CHECKIN */}
                    {isCustomCheckin ? (
                      <div className="relative">
                        <Clock className="w-5 h-5 text-[#FF2A6D] absolute left-3.5 top-3" />
                        <input
                          type="number"
                          min="1"
                          max="360"
                          placeholder="Enter custom check-in minutes (e.g. 5, 20, 90)"
                          value={checkinInterval}
                          onChange={(e) => setCheckinInterval(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#FFCCE1] text-xs font-bold focus:border-[#FF2A6D] focus:ring-4 focus:ring-[#FF2A6D]/15 focus:outline-none bg-white transition-all text-[#2A0826] font-mono shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { val: '15', label: '15 Mins' },
                          { val: '30', label: '30 Mins' },
                          { val: '60', label: '1 Hour' },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setCheckinInterval(opt.val);
                              setIsCustomCheckin(false);
                            }}
                            className={`py-3.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer ${
                              checkinInterval === opt.val && !isCustomCheckin
                                ? 'bg-gradient-to-r from-[#FF5C8A] to-[#FF2A6D] text-white border-transparent shadow-[0_6px_20px_rgba(255,42,109,0.3)]'
                                : 'bg-white text-[#2A0826] border-[#FFCCE1] hover:border-[#FF2A6D] hover:bg-[#FFF0F3]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCheckin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#FF5C8A] via-[#FF2A6D] to-[#E01A4F] text-white py-4 rounded-full text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_28px_rgba(255,42,109,0.38)] font-black disabled:opacity-60 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <Clock className="w-5 h-5" />
                    <span>
                      {loading
                        ? 'STARTING...'
                        : `START SAFETY CHECK (${checkinInterval || '15'} MINS)`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
