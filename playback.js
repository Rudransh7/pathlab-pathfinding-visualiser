/** Pure playback state. Rendering and timing stay in ui.js. */
export class Playback {
  constructor() { this.reset(); }
  reset() { this.events = []; this.index = 0; this.state = 'idle'; }
  load(result) {
    this.events = [
      ...result.visitedOrder.map(point => ({ point, kind: 'visited' })),
      ...result.path.map(point => ({ point, kind: 'path' })),
    ];
    this.index = 0;
    this.state = this.events.length ? 'paused' : 'complete';
  }
  play() { if (this.index < this.events.length) this.state = 'running'; }
  pause() { if (this.state === 'running') this.state = 'paused'; }
  next() {
    if (this.index >= this.events.length) return null;
    const event = this.events[this.index++];
    if (this.index === this.events.length) this.state = 'complete';
    return event;
  }
  tick() { return this.state === 'running' ? this.next() : null; }
  step() { this.pause(); return this.next(); }
}
