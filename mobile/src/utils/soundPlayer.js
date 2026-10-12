import { Platform, Vibration } from 'react-native';

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let htmlAudioElement = null;
let isPlaying = false;
let intervalId = null;
let cachedSirenUri = null;
let activeNativePlayer = null;
let preloadedNativePlayer = null;

// Helper to write string into DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate an emergency siren WAV audio Data URI in memory (Identical to Web Client)
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
  const base64Str = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return 'data:audio/wav;base64,' + base64Str;
}

// 1. PRELOAD WEB AUDIO AT STARTUP
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    cachedSirenUri = generateSirenWavDataUri();
    htmlAudioElement = new window.Audio(cachedSirenUri);
    htmlAudioElement.loop = true;
    htmlAudioElement.volume = 1.0;
    htmlAudioElement.preload = 'auto';

    const unlock = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    };
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('click', unlock, { passive: true, once: true });
  } catch (e) {}
}

// 2. PRELOAD NATIVE AUDIO PLAYER AT STARTUP FOR 0ms ZERO-LATENCY INSTANT START
async function primeNativePlayer() {
  if (Platform.OS === 'web') return;
  try {
    const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
    if (setAudioModeAsync) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        staysActiveInBackground: true,
      }).catch(() => {});
    }
    const localSiren = require('../../assets/sounds/alarm_siren.wav');
    preloadedNativePlayer = createAudioPlayer(localSiren);
    if (preloadedNativePlayer) {
      preloadedNativePlayer.loop = true;
      activeNativePlayer = preloadedNativePlayer;
    }
  } catch (e) {
    // Non-fatal if audio engine initializing asynchronously
  }
}
primeNativePlayer();

export const playEmergencySiren = (loop = true) => {
  isPlaying = true;

  // Instant Vibration (0ms)
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 500, 200, 500], true);
    }
  } catch (e) {}

  // 1. Web Platform: Instant Dual-Engine
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') {
        if (!cachedSirenUri) {
          cachedSirenUri = generateSirenWavDataUri();
        }
        if (!htmlAudioElement) {
          htmlAudioElement = new window.Audio(cachedSirenUri);
          htmlAudioElement.loop = loop;
          htmlAudioElement.volume = 1.0;
        }
        htmlAudioElement.currentTime = 0;
        htmlAudioElement.play().catch(() => {});

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
              if (oscillator && audioCtx && audioCtx.state === 'running') {
                oscillator.frequency.exponentialRampToValueAtTime(
                  high ? 1350 : 750,
                  audioCtx.currentTime + 0.25
                );
                high = !high;
              }
            }, 300);
          }
        }
        return;
      }
    } catch (e) {
      console.warn('[SoundPlayer] Web Audio notice:', e);
    }
  }

  // 2. Native Mobile Platform (Android / iOS): Instant local bundled WAV playback (0ms delay)
  (async () => {
    try {
      const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
      
      if (setAudioModeAsync) {
        setAudioModeAsync({
          playsInSilentMode: true,
          staysActiveInBackground: true,
        }).catch(() => {});
      }

      if (preloadedNativePlayer) {
        preloadedNativePlayer.loop = loop;
        preloadedNativePlayer.play();
        activeNativePlayer = preloadedNativePlayer;
        return;
      }

      const localSiren = require('../../assets/sounds/alarm_siren.wav');
      const player = createAudioPlayer(localSiren);
      if (player) {
        player.loop = loop;
        player.play();
        activeNativePlayer = player;
      }
    } catch (err) {
      console.warn('[SoundPlayer] Native audio playback fallback:', err?.message);
    }
  })();
};

export const stopEmergencySiren = () => {
  isPlaying = false;

  // Stop Vibration
  try {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
  } catch (e) {}

  // Stop Web HTML5 Audio
  if (htmlAudioElement) {
    try {
      htmlAudioElement.pause();
      htmlAudioElement.currentTime = 0;
    } catch (e) {}
  }

  // Stop Web Audio Oscillator
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

  // Stop Native Player
  if (activeNativePlayer) {
    try {
      activeNativePlayer.pause();
      if (typeof activeNativePlayer.seekTo === 'function') {
        activeNativePlayer.seekTo(0);
      }
    } catch (e) {}
  }
};
