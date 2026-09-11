// Web Audio API Dual-Tone Multi-Frequency (DTMF) Telephone Ringtone Generator
class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private isRinging: boolean = false;
  private intervalId: any = null;

  public startRinging(type: 'caller' | 'callee' = 'caller') {
    if (this.isRinging) return;
    this.isRinging = true;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      const playBurst = () => {
        if (!this.ctx || !this.isRinging) return;
        try {
          if (this.ctx.state === 'suspended') {
            this.ctx.resume();
          }
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';

          if (type === 'callee') {
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(480, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
            gain.gain.setValueAtTime(0.25, now + 1.5);
            gain.gain.linearRampToValueAtTime(0, now + 1.6);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.65);
            osc2.stop(now + 1.65);
          } else {
            osc1.frequency.setValueAtTime(400, now);
            osc2.frequency.setValueAtTime(450, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
            gain.gain.setValueAtTime(0.15, now + 1.2);
            gain.gain.linearRampToValueAtTime(0, now + 1.25);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.3);
            osc2.stop(now + 1.3);
          }
        } catch (e) {}
      };

      playBurst();
      const cadence = type === 'callee' ? 3000 : 3500;
      this.intervalId = setInterval(playBurst, cadence);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported:', e);
    }
  }

  public stopRinging() {
    this.isRinging = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const ringtone = new RingtonePlayer();
