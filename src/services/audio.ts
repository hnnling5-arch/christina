import { TEACHER_NOTICE_AUDIO_SRC } from '../data/constants';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

class AudioService {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 1.0;
  private playbackRate: number = 1.0;
  private listeners: Set<(playing: boolean, state?: AudioState) => void> = new Set();
  private onCompleteCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audioElement) return;

    try {
      const audio = new Audio(TEACHER_NOTICE_AUDIO_SRC);
      audio.preload = 'auto';
      audio.autoplay = false;
      audio.volume = this.volume;
      audio.playbackRate = this.playbackRate;

      audio.addEventListener('loadedmetadata', () => {
        this.duration = audio.duration || 0;
        this.notify();
      });

      audio.addEventListener('timeupdate', () => {
        this.currentTime = audio.currentTime || 0;
        this.notify();
      });

      audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.notify();
      });

      audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });

      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.notify();
        if (this.onCompleteCallback) {
          const cb = this.onCompleteCallback;
          this.onCompleteCallback = null;
          cb();
        }
      });

      audio.addEventListener('error', (e) => {
        console.warn('Teacher notice audio element error:', e);
        this.isPlaying = false;
        this.notify();
      });

      this.audioElement = audio;
    } catch (e) {
      console.warn('Unable to initialize HTMLAudioElement:', e);
    }
  }

  public subscribe(listener: (playing: boolean, state?: AudioState) => void): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying, {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state: AudioState = {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
    };
    this.listeners.forEach((fn) => fn(this.isPlaying, state));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  public playTeacherNotice(
    customRateOrNotice?: number | string | null,
    onComplete?: () => void,
    customRate?: number
  ) {
    if (typeof window === 'undefined') return;
    this.initAudio();

    if (!this.audioElement) return;

    let targetRate = this.playbackRate;
    if (typeof customRateOrNotice === 'number') {
      targetRate = customRateOrNotice;
    } else if (typeof customRate === 'number') {
      targetRate = customRate;
    }

    this.setPlaybackRate(targetRate);

    if (onComplete) {
      this.onCompleteCallback = onComplete;
    }

    // Play real teacher mp3
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Playback deferred or interrupted:', err);
        this.isPlaying = false;
        this.notify();
      });
    }
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
    this.notify();
  }

  public resume() {
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    }
  }

  public replay(customRate?: number, onComplete?: () => void) {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.playTeacherNotice(customRate, onComplete);
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isPlaying = false;
    this.onCompleteCallback = null;
    this.notify();
  }

  // Play subtle cheerful pop/stamp sound
  public playStampSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      // ignore
    }
  }

  // Play celebration cheerful chime using Web Audio API
  public playCelebrationChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.15 * this.volume, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (e) {
      // ignore
    }
  }
}

export const audioService = new AudioService();
