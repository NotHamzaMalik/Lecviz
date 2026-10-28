export type NarrationState = 'idle' | 'loading' | 'speaking' | 'paused' | 'ended';
export type NarrationClip = { url: string; text: string };
export interface AudioPort {
  currentTime: number; duration: number; playbackRate: number; muted: boolean;
  onplaying: ((event: Event) => unknown) | null; onpause: ((event: Event) => unknown) | null;
  onwaiting: ((event: Event) => unknown) | null; ontimeupdate: ((event: Event) => unknown) | null;
  onended: ((event: Event) => unknown) | null; onerror: ((event: Event) => unknown) | null;
  play(): Promise<void>; pause(): void;
}
export type NarrationCallbacks = {
  state: (state: NarrationState) => void;
  progress: (index: number, fraction: number) => void;
  reveal: (index: number) => void;
  error: (message: string) => void;
};

// Audio position is the clock. Paused, failed, or canceled audio never advances the scene.
export class NarrationPlayer {
  private factory: (url: string) => AudioPort;
  private callbacks: NarrationCallbacks;
  private audio: AudioPort | null = null;
  private generation = 0;
  private clips: NarrationClip[] = [];
  private index = 0;
  private rate = 1;
  private muted = false;
  private paused = false;
  private revealed = false;
  constructor(factory: (url: string) => AudioPort, callbacks: NarrationCallbacks) {
    this.factory = factory; this.callbacks = callbacks;
  }
  start(clips: NarrationClip[], index = 0) {
    this.stop(); this.clips = clips; this.index = index; this.playCurrent();
  }
  private release() {
    if (!this.audio) return;
    this.audio.onplaying = this.audio.onpause = this.audio.onwaiting = null;
    this.audio.ontimeupdate = this.audio.onended = this.audio.onerror = null;
    this.audio.pause(); this.audio = null;
  }
  private reveal() {
    if (!this.revealed) { this.revealed = true; this.callbacks.reveal(this.index); }
  }
  private playCurrent() {
    this.release();
    const clip = this.clips[this.index];
    if (!clip) { this.callbacks.state('ended'); return; }
    const generation = ++this.generation;
    const audio = this.factory(clip.url);
    this.audio = audio; this.revealed = false; this.paused = false;
    audio.playbackRate = this.rate; audio.muted = this.muted;
    const active = () => this.generation === generation && this.audio === audio;
    const fail = () => {
      if (!active()) return;
      this.stop();
      this.callbacks.error('Audio could not play. Press Play to retry.');
    };
    this.callbacks.progress(this.index, 0);
    this.callbacks.state('loading');
    audio.onplaying = () => { if (active() && !this.paused) this.callbacks.state('speaking'); };
    audio.onwaiting = () => { if (active() && !this.paused) this.callbacks.state('loading'); };
    audio.onpause = () => { if (active() && this.paused) this.callbacks.state('paused'); };
    audio.ontimeupdate = () => {
      if (!active() || this.paused || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const fraction = Math.min(1, audio.currentTime / audio.duration);
      this.callbacks.progress(this.index, fraction);
      if (fraction >= 0.68) this.reveal();
    };
    audio.onended = () => {
      if (!active() || this.paused) return;
      this.reveal(); this.callbacks.progress(this.index, 1);
      this.index += 1; this.playCurrent();
    };
    audio.onerror = fail;
    audio.play().catch(fail);
  }
  pause() { if (this.audio) { this.paused = true; this.audio.pause(); this.callbacks.state('paused'); } }
  resume() {
    if (!this.audio || !this.paused) return;
    const generation = this.generation;
    this.paused = false; this.callbacks.state('loading');
    this.audio.play().catch(() => {
      if (generation !== this.generation) return;
      this.stop(); this.callbacks.error('Audio could not resume. Press Play to retry.');
    });
  }
  stop() { this.generation += 1; this.release(); this.paused = false; this.callbacks.state('idle'); }
  setRate(rate: number) { this.rate = rate; if (this.audio) this.audio.playbackRate = rate; }
  setMuted(muted: boolean) { this.muted = muted; if (this.audio) this.audio.muted = muted; }
}
