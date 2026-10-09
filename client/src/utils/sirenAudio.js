'use client';

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let htmlAudioElement = null;
let isPlaying = false;
let intervalId = null;

// Helper to write string into DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate an emergency siren WAV audio Data URI in memory
function generateSirenWavDataUri() {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSec = 1.6;
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Oscillate pitch continuously between 750Hz and 1350Hz
    const freq = 1050 + 300 * Math.sin(2 * Math.PI * 1.5 * t);
    phase += (2 * Math.PI * freq) / sampleRate;
    const sample = Math.sin(phase) > 0 ? 0.8 : -0.8;
    const intSample = Math.floor(sample * 32767);
    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

let cachedSirenUri = null;

// Global interaction listener to resume audio contexts on mobile/desktop browsers
if (typeof window !== 'undefined') {
  const unlockAudioOnInteraction = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (htmlAudioElement && isPlaying && htmlAudioElement.paused) {
      htmlAudioElement.play().catch(() => {});
    }
  };

  window.addEventListener('touchstart', unlockAudioOnInteraction, { capture: true, passive: true });
  window.addEventListener('click', unlockAudioOnInteraction, { capture: true, passive: true });
  window.addEventListener('pointerdown', unlockAudioOnInteraction, {
    capture: true,
    passive: true,
  });
}

/**
 * High-Decibel Dual-Engine Emergency Siren Synthesizer & Audio Player
 */
export const startEmergencySiren = () => {
  isPlaying = true;

  // ENGINE 1: HTML5 Audio Element with dynamically synthesized Siren WAV
  try {
    if (typeof window !== 'undefined') {
      if (!cachedSirenUri) {
        cachedSirenUri = generateSirenWavDataUri();
      }
      if (!htmlAudioElement) {
        htmlAudioElement = new Audio(cachedSirenUri);
        htmlAudioElement.loop = true;
        htmlAudioElement.volume = 1.0;
      }
      htmlAudioElement.play().catch((err) => {
        console.warn('[Siren Audio] HTML5 Audio autoplay restricted:', err.message);
      });
    }
  } catch (e) {
    console.warn('[Siren Audio] HTML5 Audio engine notice:', e);
  }

  // ENGINE 2: Web Audio API Synthesizer (Sawtooth sweeping oscillator)
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      if (!oscillator) {
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(750, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.9, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();

        let high = true;
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          if (oscillator && audioCtx) {
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }
            if (audioCtx.state === 'running') {
              oscillator.frequency.exponentialRampToValueAtTime(
                high ? 1350 : 750,
                audioCtx.currentTime + 0.25
              );
              high = !high;
            }
          }
        }, 300);
      }
    }
  } catch (e) {
    console.warn('[Siren Audio] Web Audio engine notice:', e);
  }

  // Trigger mobile device vibration pattern
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate([1000, 300, 1000, 300, 1000, 300, 1000]);
    } catch (ve) {}
  }
};

/**
 * Stops Emergency Siren cleanly across both audio engines
 */
export const stopEmergencySiren = () => {
  isPlaying = false;

  // Stop Engine 1
  if (htmlAudioElement) {
    try {
      htmlAudioElement.pause();
      htmlAudioElement.currentTime = 0;
    } catch (e) {}
    htmlAudioElement = null;
  }

  // Stop Engine 2
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (oscillator) {
    try {
      oscillator.stop();
    } catch (e) {}
    oscillator = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {}
    audioCtx = null;
  }
  gainNode = null;

  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch (ve) {}
  }
};
