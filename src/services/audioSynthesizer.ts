// Web Audio API Ambient Sound Generator for Lo-fi Rain and Vinyl Crackle

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private crackleGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    this.initContext();
    if (!this.ctx || this.isRunning) return;

    this.isRunning = true;
    const ctx = this.ctx;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // 1. Rain Sound (Pink noise through low pass filter)
    const bufferSize = ctx.sampleRate * 2;
    const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const rainOutput = rainBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      rainOutput[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const rainNoise = ctx.createBufferSource();
    rainNoise.buffer = rainBuffer;
    rainNoise.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(800, ctx.currentTime);

    this.rainGain = ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.4, ctx.currentTime);

    rainNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainNoise.start();

    // 2. Vinyl Crackle Sound
    const crackleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const crackleOutput = crackleBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      if (Math.random() < 0.0008) {
        crackleOutput[i] = (Math.random() * 2 - 1) * 0.6;
      } else {
        crackleOutput[i] = (Math.random() * 2 - 1) * 0.003;
      }
    }

    const crackleNoise = ctx.createBufferSource();
    crackleNoise.buffer = crackleBuffer;
    crackleNoise.loop = true;

    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.setValueAtTime(0.2, ctx.currentTime);

    crackleNoise.connect(this.crackleGain);
    this.crackleGain.connect(this.masterGain);
    crackleNoise.start();
  }

  public setVolumes(rainVol: number, crackleVol: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime((rainVol / 100) * 0.8, now, 0.1);
    }
    if (this.crackleGain) {
      this.crackleGain.gain.setTargetAtTime((crackleVol / 100) * 0.4, now, 0.1);
    }
  }

  public stop() {
    if (!this.ctx || !this.isRunning) return;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    setTimeout(() => {
      this.isRunning = false;
    }, 200);
  }

  public toggle(rainVol = 40, crackleVol = 20): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      this.setVolumes(rainVol, crackleVol);
      return true;
    }
  }
}

export const soundSynth = new AudioSynthesizer();
