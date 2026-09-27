/**
 * Playback clock kept outside React state. Components subscribe to exactly the slice they need
 * (e.g. the frame number) so the 60 fps clock does not re-render the whole workspace.
 */
export interface LoopRange {
  start: number;
  end: number;
}

export interface PlaybackSnapshot {
  time: number;
  playing: boolean;
  speed: number;
  buffering: boolean;
  bounds: LoopRange;
  loop: LoopRange | null;
}

type Listener = () => void;

export class PlaybackStore {
  private state: PlaybackSnapshot = {
    time: 0,
    playing: false,
    speed: 1,
    buffering: false,
    bounds: { start: 0, end: 0 },
    loop: null,
  };
  private listeners = new Set<Listener>();
  private raf = 0;
  private last = 0;

  get = (): PlaybackSnapshot => this.state;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private set(patch: Partial<PlaybackSnapshot>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  setBounds(bounds: LoopRange): void {
    const time = Math.min(Math.max(this.state.time, bounds.start), bounds.end);
    this.set({ bounds, time });
  }

  seek(time: number): void {
    const { start, end } = this.state.bounds;
    this.set({ time: Math.min(Math.max(time, start), end) });
  }

  step(frames: number, fps: number): void {
    this.pause();
    const snapped = Math.round(this.state.time * fps) / fps;
    this.seek(snapped + frames / fps);
  }

  setSpeed(speed: number): void {
    this.set({ speed });
  }

  setLoop(loop: LoopRange | null): void {
    this.set({ loop });
  }

  setBuffering(buffering: boolean): void {
    if (buffering !== this.state.buffering) this.set({ buffering });
  }

  play(): void {
    if (this.state.playing) return;
    const { loop, time, bounds } = this.state;
    if (loop && (time >= loop.end || time < loop.start)) this.seek(loop.start);
    else if (time >= bounds.end) this.seek(bounds.start);
    this.set({ playing: true });
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  pause(): void {
    if (!this.state.playing) return;
    cancelAnimationFrame(this.raf);
    this.set({ playing: false });
  }

  toggle(): void {
    if (this.state.playing) this.pause();
    else this.play();
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const s = this.state;
    if (!s.buffering) {
      const next = s.time + dt * s.speed;
      const stopAt = s.loop ? s.loop.end : s.bounds.end;
      if (next >= stopAt) {
        this.set({ time: stopAt });
        this.pause();
        return;
      }
      this.set({ time: next });
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
