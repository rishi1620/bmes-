/**
 * Notification sound generator using Web Audio API
 * Generates an elegant, crystal dual-tone chime without needing external MP3/WAV files.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Read user preference from localStorage
    const saved = localStorage.getItem("bmes_admin_sound_enabled");
    if (saved !== null) {
      this.soundEnabled = saved === "true";
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem("bmes_admin_sound_enabled", String(enabled));
  }

  public toggleSound(): boolean {
    this.setEnabled(!this.soundEnabled);
    if (this.soundEnabled) {
      this.playChime();
    }
    return this.soundEnabled;
  }

  public playChime(type: "membership" | "submission" | "registration" | "system" | "default" = "default") {
    if (!this.soundEnabled) return;

    try {
      // Lazy init AudioContext on user interaction
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Determine frequency pair based on alert type
      let freq1 = 587.33; // D5
      let freq2 = 880.00; // A5
      let freq3 = 1174.66; // D6

      if (type === "membership") {
        freq1 = 523.25; // C5
        freq2 = 659.25; // E5
        freq3 = 1046.50; // C6
      } else if (type === "submission") {
        freq1 = 440.00; // A4
        freq2 = 554.37; // C#5
        freq3 = 659.25; // E5
      }

      // Master Gain for smooth volume control
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      masterGain.connect(ctx.destination);

      // Tone 1
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq1, now);
      osc1.frequency.exponentialRampToValueAtTime(freq2, now + 0.12);
      osc1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Tone 2 (harmonic chime)
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq2, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(freq3, now + 0.25);
      
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn("Could not play notification sound:", e);
    }
  }
}

export const soundService = new SoundService();
