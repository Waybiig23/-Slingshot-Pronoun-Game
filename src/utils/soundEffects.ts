// Web Audio API Procedural Sound Engine
// Safe, self-contained, zero external asset loading issues!

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private isBgmPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  public setBgmMuted(muted: boolean) {
    this.isBgmMuted = muted;
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsBgmMuted(): boolean {
    return this.isBgmMuted;
  }

  // Button click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  // Slingshot pull / tension sound
  public playStretch(stretchRatio = 0.5) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const freq = 120 + stretchRatio * 280;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq + 40, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  // Slingshot launch swoosh
  public playSwoosh() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Noise burst for air swoosh + tonal snap
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.08);
      filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();

      // snap osc
      const snap = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snap.type = 'sine';
      snap.frequency.setValueAtTime(500, this.ctx.currentTime);
      snap.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);
      snapGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      snap.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snap.start();
      snap.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  // Correct answer / hoop scored
  public playCorrect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Chime chord: E5, G#5, B5, E6
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.4);
      });
    } catch {}
  }

  // Streak combo sound
  public playCombo(combo: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 523.25; // C5
      const steps = [0, 4, 7, 12, 16]; // major arpeggio
      const noteCount = Math.min(steps.length, 2 + combo);

      for (let i = 0; i < noteCount; i++) {
        const semitone = steps[i % steps.length];
        const freq = baseFreq * Math.pow(2, semitone / 12);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.15, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.25);
      }
    } catch {}
  }

  // Wrong answer / miss
  public playWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Speech cue chime (played when voice/narration triggers)
  public playSpeechChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [587.33, 880.0].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {}
  }

  // Cheerful "Yay!" sound effect
  public playYay() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Bright major triad arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.3);
      });
    } catch {}
  }

  // Encouraging "Oops / Try again" sound effect
  public playOops() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Game win celebration fanfare
  public playFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.50, d: 0.35 }, // C6
      ];
      let t = this.ctx.currentTime;
      notes.forEach(n => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + n.d);
        t += n.d * 0.9;
      });
    } catch {}
  }

  // Thrilling, energetic arcade background music (BGM เร้าใจ สไตล์เกมตู้/ผจญภัย)
  public startBgm() {
    if (this.isBgmMuted || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // Fast, driving tempo (134 BPM, 112ms per 16th step)
    const stepDuration = 112;
    const bassChords = [
      [110.00, 220.00], // Am (A2, A3)
      [87.31, 174.61],  // F (F2, F3)
      [130.81, 261.63], // C (C3, C4)
      [98.00, 196.00],  // G (G2, G3)
    ];

    // High energy lead synth melodies (32 steps loop)
    const leadNotes = [
      880.00, 0, 880.00, 1046.50, 783.99, 0, 659.25, 783.99,
      659.25, 0, 523.25, 659.25,  783.99, 0, 880.00, 0,
      1046.50, 880.00, 783.99, 880.00, 1046.50, 0, 1174.66, 1046.50,
      880.00, 783.99, 659.25, 783.99,  880.00, 0, 0, 0
    ];

    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
    }

    this.bgmInterval = window.setInterval(() => {
      if (!this.isBgmPlaying || this.isBgmMuted || !this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      try {
        const now = this.ctx.currentTime;
        const current16th = this.bgmStep % 32;
        const barIndex = Math.floor(current16th / 8) % 4;
        const isBeatStart = current16th % 4 === 0;
        const isOffBeat = current16th % 4 === 2;

        // 1. PUNCHY KICK DRUM (Every quarter note: steps 0, 4, 8, 12...)
        if (isBeatStart) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(160, now);
          kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.08);

          kickGain.gain.setValueAtTime(0.22, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.09);
        }

        // 2. CRISP SNARE / CLAP (Backbeats: steps 4, 12, 20, 28)
        if (current16th % 8 === 4) {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(260, now);
          snareOsc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

          snareGain.gain.setValueAtTime(0.12, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

          snareOsc.connect(snareGain);
          snareGain.connect(this.ctx.destination);
          snareOsc.start(now);
          snareOsc.stop(now + 0.07);
        }

        // 3. HI-HAT (Fast upbeat tick)
        if (isOffBeat || current16th % 2 === 1) {
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();
          hatOsc.type = 'square';
          hatOsc.frequency.setValueAtTime(1400, now);
          hatOsc.frequency.exponentialRampToValueAtTime(8000, now + 0.025);

          hatGain.gain.setValueAtTime(0.022, now);
          hatGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.025);

          hatOsc.connect(hatGain);
          hatGain.connect(this.ctx.destination);
          hatOsc.start(now);
          hatOsc.stop(now + 0.025);
        }

        // 4. DRIVING SYNTH BASS
        const chord = bassChords[barIndex];
        const bassFreq = current16th % 2 === 0 ? chord[0] : chord[1];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.045, now);
        bassGain.gain.exponentialRampToValueAtTime(0.002, now + 0.09);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.09);

        // 5. ENERGETIC LEAD ARPEGGIO / MELODY
        const leadFreq = leadNotes[current16th];
        if (leadFreq > 0) {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'triangle';
          leadOsc.frequency.setValueAtTime(leadFreq, now);

          leadGain.gain.setValueAtTime(0.065, now);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          leadOsc.connect(leadGain);
          leadGain.connect(this.ctx.destination);
          leadOsc.start(now);
          leadOsc.stop(now + 0.14);
        }

        this.bgmStep++;
      } catch {}
    }, stepDuration);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();
