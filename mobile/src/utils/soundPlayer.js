import { Platform, Vibration } from 'react-native';

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let htmlAudioElement = null;
let isPlaying = false;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      if (audioCtx && audioCtx.state === 'suspended' && isPlaying) {
        audioCtx.resume().catch(() => {});
      }
      if (htmlAudioElement && isPlaying && htmlAudioElement.paused) {
        htmlAudioElement.play().catch(() => {});
      }
    } catch (e) {}
  };
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, unlockAudio, { passive: true });
  });
}
let intervalId = null;
let watchdogInterval = null;
let autoStopTimeout = null;
let cachedSirenUri = null;
let activeNativePlayer = null;
let preloadedNativePlayer = null;
let Haptics = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch (e) {}
}

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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64Str = '';
  let i = 0;
  const len = bytes.length;
  for (; i + 2 < len; i += 3) {
    base64Str += chars[bytes[i] >> 2];
    base64Str += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64Str += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64Str += chars[bytes[i + 2] & 63];
  }
  if (i < len) {
    base64Str += chars[bytes[i] >> 2];
    if (i + 1 < len) {
      base64Str += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64Str += chars[(bytes[i + 1] & 15) << 2];
      base64Str += '=';
    } else {
      base64Str += chars[(bytes[i] & 3) << 4];
      base64Str += '==';
    }
  }
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

    htmlAudioElement.onended = () => {
      if (isPlaying) {
        try {
          htmlAudioElement.currentTime = 0;
          htmlAudioElement.play().catch(() => {});
        } catch (e) {}
      }
    };

    const unlock = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      if (htmlAudioElement && isPlaying && htmlAudioElement.paused) {
        htmlAudioElement.play().catch(() => {});
      }
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  } catch (e) {}
}

// Helper to configure native player with reliable looping & status listeners
function setupNativePlayer(player, loop = false) {
  if (!player) return;
  try {
    player.loop = loop;
    if (typeof player.addListener === 'function') {
      player.addListener('playbackStatusUpdate', (status) => {
        if (loop && isPlaying && (status?.didJustFinish || (!status?.playing && status?.isLoaded && !status?.isBuffering))) {
          try {
            if (typeof player.seekTo === 'function') {
              player.seekTo(0);
            }
            player.play();
          } catch (e) {}
        }
      });
    }
  } catch (e) {}
}

// 2. LAZY ON-DEMAND NATIVE AUDIO PLAYER (Zero startup overhead, immune to cold-start crashes)
async function getOrCreateNativePlayer(loop = false) {
  if (Platform.OS === 'web') return null;
  try {
    if (activeNativePlayer) {
      setupNativePlayer(activeNativePlayer, loop);
      return activeNativePlayer;
    }
    const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
    if (setAudioModeAsync) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        staysActiveInBackground: true,
        interruptionMode: 'doNotMixPersistent',
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});
    }
    const localSiren = require('../../assets/sounds/alarm_siren.wav');
    const player = createAudioPlayer(localSiren, {
      keepAudioSessionActive: true,
      preferredForwardBufferDuration: 10,
    });
    if (player) {
      setupNativePlayer(player, loop);
      activeNativePlayer = player;
    }
    return activeNativePlayer;
  } catch (err) {
    console.warn('[SoundPlayer] Native audio initialization fallback:', err?.message);
    return null;
  }
}

export const playEmergencySiren = (loop = true, durationSeconds = 60) => {
  isPlaying = true;

  if (autoStopTimeout) {
    clearTimeout(autoStopTimeout);
    autoStopTimeout = null;
  }

  // Automatically stop the siren after requested duration (default 60 seconds)
  if (durationSeconds && durationSeconds > 0) {
    autoStopTimeout = setTimeout(() => {
      stopEmergencySiren();
    }, durationSeconds * 1000);
  }

  // Instant Vibration & iOS Taptic feedback (single cycle if loop=false, repeating if loop=true)
  try {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
      Vibration.vibrate([0, 500, 200, 500], loop);
      if (Platform.OS === 'ios' && Haptics?.notificationAsync) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  } catch (e) {}

  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }

  // Watchdog loop ONLY when repeating loop is explicitly requested
  if (loop) {
    watchdogInterval = setInterval(() => {
      if (!isPlaying) {
        clearInterval(watchdogInterval);
        watchdogInterval = null;
        return;
      }

      // 1. Maintain vibration on mobile & iOS Haptics
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 500, 200, 500], true);
          if (Platform.OS === 'ios' && Haptics?.impactAsync) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          }
        } catch (e) {}
      }

      // 2. Maintain native player playback
      if (activeNativePlayer && Platform.OS !== 'web') {
        try {
          if (!activeNativePlayer.playing) {
            if (typeof activeNativePlayer.seekTo === 'function') {
              activeNativePlayer.seekTo(0);
            }
            activeNativePlayer.play();
          }
        } catch (e) {}
      }

      // 3. Maintain web audio element
      if (Platform.OS === 'web') {
        try {
          if (htmlAudioElement && htmlAudioElement.paused) {
            htmlAudioElement.play().catch(() => {});
          }
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
        } catch (e) {}
      }
    }, 1500);
  }

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
          try {
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
              try {
                oscillator.start();
              } catch (e) {}

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
          } catch (audioErr) {}
        }
        return Promise.resolve();
      }
    } catch (e) {
      console.warn('[SoundPlayer] Web Audio notice:', e);
    }
    return Promise.resolve();
  }

  // 2. Native Mobile Platform (Android / iOS): Instant local bundled WAV playback (0ms delay)
  return (async () => {
    try {
      const player = await getOrCreateNativePlayer(loop);
      if (player && isPlaying) {
        if (typeof player.seekTo === 'function') {
          player.seekTo(0);
        }
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

  if (autoStopTimeout) {
    clearTimeout(autoStopTimeout);
    autoStopTimeout = null;
  }

  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }

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

  // Always return a resolved Promise so callers can safely chain .catch()
  return Promise.resolve();
};
