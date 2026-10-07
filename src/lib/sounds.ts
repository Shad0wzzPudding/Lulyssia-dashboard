// Sound effects utility using Web Audio API
import { toast } from "@/hooks/use-toast";
import triggerEffect from "@/assets/sound/triger_effect.mp3";
import trainEffect from "@/assets/sound/train_effect.mp3";
import selectionEffect from "@/assets/sound/selection_effect.mp3";
import selectModeOpen from "@/assets/sound/selectmode_open.wav";
import selectModeClose from "@/assets/sound/selectmode_close.wav";
import menuOpenEffect from "@/assets/sound/pondering.mp3";

// Haptic feedback utility - vibrates if supported
const haptic = (pattern: number | number[] = 30) => {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch { /* vibration unsupported */ }
};

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

// Shared AudioContext - unlocked once on first user interaction
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }
  
  // Always try to resume (no-op if already running)
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  
  return sharedAudioContext;
};

// Call this on first touch to unlock audio for iOS
export const unlockAudio = () => {
  const ctx = getAudioContext();
  // Play a silent buffer to fully unlock
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
};

export const playSuccessSound = () => {
  haptic([20, 30, 20]);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Cheerful ascending three-note success chime
    playTone(523.25, now, 0.1);        // C5
    playTone(659.25, now + 0.08, 0.1); // E5
    playTone(783.99, now + 0.16, 0.15); // G5
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playCompletionSound = () => {
  haptic(40);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Satisfying "ding!" completion sound
    playTone(880, now, 0.08);          // A5
    playTone(1318.51, now + 0.06, 0.2); // E6 (higher, bright)
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playLulyssiaSound = () => {
  haptic([15, 20, 15]);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Cute ascending two-note chime
    playTone(587.33, now, 0.15);    // D5
    playTone(880, now + 0.1, 0.2);  // A5
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playConfirmSound = () => {
  haptic([10, 15, 10, 15, 10]);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Cheerful ascending confirmation sound
    playTone(523.25, now, 0.08);        // C5
    playTone(659.25, now + 0.06, 0.08); // E5
    playTone(783.99, now + 0.12, 0.12); // G5
    playTone(1046.5, now + 0.18, 0.15); // C6
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playCancelSound = async () => {
  haptic(25);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle'; // Softer sound for cancel
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Descending tones for cancel effect
    playTone(493.88, now, 0.12);        // B4
    playTone(392.00, now + 0.1, 0.12);  // G4
    playTone(329.63, now + 0.2, 0.18);  // E4
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playDeleteSound = async () => {
  haptic([40, 30, 50]);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sawtooth'; // Slightly harsher for delete
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Quick descending "whoosh" for delete
    playTone(440, now, 0.08);           // A4
    playTone(330, now + 0.06, 0.1);     // E4
    playTone(220, now + 0.12, 0.12);    // A3
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playDuplicateSound = () => {
  haptic([15, 30, 15]);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Quick double "pop" sound for duplicate
    playTone(698.46, now, 0.08);        // F5
    playTone(698.46, now + 0.1, 0.08);  // F5 (repeat)
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playPinSound = async () => {
  haptic(30);
  try {
    const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Quick ascending "click-pop" for pin
    playTone(600, now, 0.06);           // D#5
    playTone(900, now + 0.05, 0.1);     // A5 (higher)
    
  } catch (e) {
    console.warn('[sounds] Audio not available:', e);
  }
};

export const playUnpinSound = () => {
  haptic([20, 20, 20]);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    
    // First tone - descending
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 800;
    osc1.type = 'triangle';
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.start(now);
    osc1.stop(now + 0.08);
    
    // Second tone - lower
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 500;
    osc2.type = 'triangle';
    gain2.gain.setValueAtTime(0.25, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.15);
    
    
  } catch (e) {
    console.warn('[playUnpinSound] Audio error:', e);
  }
};

export const playUpdateSound = () => {
  haptic(25);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Gentle two-note "swoosh-ding" for updates
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 440; // A4
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc1.start(now);
    osc1.stop(now + 0.1);
    
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 660; // E5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.2);
    
  } catch (e) {
    console.warn('[playUpdateSound] Audio error:', e);
  }
};

export const playEditSound = () => {
  haptic(20);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick ascending "pencil flick" - two bright tones
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 554.37; // C#5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.start(now);
    osc1.stop(now + 0.08);
    
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 739.99; // F#5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.14);
    
  } catch (e) {
    console.warn('[playEditSound] Audio error:', e);
  }
};

export const playCollapseSound = () => {
  haptic(10);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick descending "fold" sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
    
  } catch (e) {
    console.warn('[playCollapseSound] Audio error:', e);
  }
};

export const playExpandSound = () => {
  haptic(10);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick ascending "unfold" sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
    
  } catch (e) {
    console.warn('[playExpandSound] Audio error:', e);
  }
};

export const playNavigationSound = () => {
  haptic(10);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick subtle "tap" sound for navigation
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 660; // E5
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
    
  } catch (e) {
    console.warn('[playNavigationSound] Audio error:', e);
  }
};

// Select mode open/close sounds (selectmode_open.wav / selectmode_close.wav).
// If a file isn't loaded yet on its very first use, a short code-made tone plays instead.
const SELECT_MODE_VOLUME = 0.8;

const playSoundFile = (url: string, volume: number, fallback: () => void) => {
  const buffer = soundBuffers.get(url);
  if (!buffer) {
    void loadSoundBuffer(url);
    fallback();
    return;
  }
  try {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) {
    console.warn('[sounds] Audio error:', url, e);
  }
};

// Message button: opening the page menu (pondering.mp3)
const MENU_OPEN_VOLUME = 0.8;

export const preloadMenuOpenSound = () => {
  void loadSoundBuffer(menuOpenEffect);
};

/** Opening the message-button menu. Call it from the button's click handler. */
export const playMenuOpenSound = () => {
  haptic(10);
  playSoundFile(menuOpenEffect, MENU_OPEN_VOLUME, playNavigationSound);
};

export const preloadSelectModeSounds = () => {
  void loadSoundBuffer(selectModeOpen);
  void loadSoundBuffer(selectModeClose);
};

/** Entering select mode. Call it from the Select button's click handler. */
export const playSelectModeSound = () => {
  haptic([10, 20, 10]);
  playSoundFile(selectModeOpen, SELECT_MODE_VOLUME, playSelectModeTone);
};

/** Leaving select mode (X, Esc, last card deselected, or after an action). */
export const playSelectModeCloseSound = () => {
  haptic(10);
  playSoundFile(selectModeClose, SELECT_MODE_VOLUME, playCancelSound);
};

// Fallback for the open sound: two short high tones
const playSelectModeTone = () => {
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(1760, now, 0.06);          // A6
    playTone(1760, now + 0.09, 0.06);   // A6 (repeat)

  } catch (e) {
    console.warn('[playSelectModeTone] Audio error:', e);
  }
};

export const playAddSound = () => {
  haptic([10, 15]);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    // Cute "pop-open" — quick ascending triad with a bright bell tail
    const playTone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', peak = 0.2) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(659.25, now, 0.07, 'triangle', 0.22);        // E5
    playTone(987.77, now + 0.05, 0.09, 'triangle', 0.22); // B5
    playTone(1318.51, now + 0.11, 0.14, 'sine', 0.18);    // E6 sparkle

  } catch (e) {
    console.warn('[playAddSound] Audio error:', e);
  }
};

// Persona-style skill activation sound, used by the scroll-to-top cut-in.
// Created once so the clip is already loaded the first time the button is pressed
let triggerAudio: HTMLAudioElement | null = null;

export const playTriggerSound = () => {
  try {
    if (!triggerAudio) {
      triggerAudio = new Audio(triggerEffect);
      triggerAudio.volume = 0.7;
    }
    triggerAudio.currentTime = 0;
    triggerAudio.play().catch((e) => console.warn('[playTriggerSound] Audio error:', e));
  } catch (e) {
    console.warn('[playTriggerSound] Audio error:', e);
  }
};

export const preloadTriggerSound = () => {
  if (!triggerAudio) {
    triggerAudio = new Audio(triggerEffect);
    triggerAudio.preload = 'auto';
    triggerAudio.volume = 0.7;
  }
};

// Train sound for the crowd page transition. Played through Web Audio so the start
// can be scheduled precisely and the fades work on every device (iPhones ignore
// volume changes on <audio> elements).
const TRAIN_VOLUME = 0.7;
const TRAIN_FADE_IN_S = 0.25;
const TRAIN_FADE_OUT_S = 0.35;
let trainSource: AudioBufferSourceNode | null = null;

// Sound files decoded once for Web Audio, cached by URL
const soundBuffers = new Map<string, AudioBuffer>();
const soundLoading = new Map<string, Promise<AudioBuffer | null>>();

const loadSoundBuffer = (url: string) => {
  let loading = soundLoading.get(url);
  if (!loading) {
    loading = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => getAudioContext().decodeAudioData(data))
      .then((buffer) => {
        soundBuffers.set(url, buffer);
        return buffer;
      })
      .catch((e) => {
        console.warn('[sounds] Could not load sound:', url, e);
        soundLoading.delete(url);
        return null;
      });
    soundLoading.set(url, loading);
  }
  return loading;
};

export const preloadTrainSound = () => {
  void loadSoundBuffer(trainEffect);
};

// Menu choice sound, played when picking a page from the navigation menu
const SELECTION_VOLUME = 0.8;

export const preloadSelectionSound = () => {
  void loadSoundBuffer(selectionEffect);
};

export const playSelectionSound = () => {
  const buffer = soundBuffers.get(selectionEffect);
  if (!buffer) {
    // Not loaded yet: fall back to the short beep so there is still feedback
    void loadSoundBuffer(selectionEffect);
    playNavigationSound();
    return;
  }
  haptic(10);
  try {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = SELECTION_VOLUME;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) {
    console.warn('[playSelectionSound] Audio error:', e);
  }
};

/**
 * Plays the train sound for `durationMs`, starting after `delayMs`,
 * with a short fade in and fade out. Call it from the click/tap handler.
 */
export const playTrainSound = (durationMs = 2000, delayMs = 0) => {
  try {
    const ctx = getAudioContext();
    const trainBuffer = soundBuffers.get(trainEffect);
    if (!trainBuffer) {
      // Not loaded yet (very first click): load it for next time
      void loadSoundBuffer(trainEffect);
      return;
    }
    trainSource?.stop();

    const start = ctx.currentTime + delayMs / 1000;
    const end = start + durationMs / 1000;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = trainBuffer;
    source.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(TRAIN_VOLUME, start + TRAIN_FADE_IN_S);
    gain.gain.setValueAtTime(TRAIN_VOLUME, end - TRAIN_FADE_OUT_S);
    gain.gain.linearRampToValueAtTime(0, end);

    source.start(start);
    source.stop(end + 0.05);
    trainSource = source;
  } catch (e) {
    console.warn('[playTrainSound] Audio error:', e);
  }
};
