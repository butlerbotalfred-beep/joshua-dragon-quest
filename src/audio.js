// Music, sound effects and voices.
//
// Music is the family's own tracks in assets/audio, one for each place, faded
// from one to the next. Sound effects and voices are files made with Fish Audio.

export class AudioBox {
  constructor() {
    this.muted = false;
    this.quiet = false;             // true while a test is fast-forwarding
    this.musicVolume = 0.42;
    this.a = this.makeMusic();
    this.b = this.makeMusic();
    this.front = this.a;
    this.track = null;
    this.sounds = {};
    this.voiceEl = new Audio();
    this.voiceEl.preload = 'auto';
    this.blocked = false;
    this.lastPlayed = {};
  }

  makeMusic() {
    const el = new Audio();
    el.preload = 'none';
    el.loop = true;
    el.volume = 0;
    el.goal = 0;
    return el;
  }

  setMuted(m) {
    this.muted = m;
    for (const el of [this.a, this.b]) el.muted = m;
    this.voiceEl.muted = m;
  }

  tryPlay(el) {
    const p = el.play();
    if (p && p.catch) p.catch((err) => { if (err && err.name === 'NotAllowedError') this.blocked = true; });
  }

  // Called on any press: browsers only allow sound after the player has done something.
  unlock() {
    if (!this.blocked) return;
    this.blocked = false;
    if (this.track) this.tryPlay(this.front);
  }

  // Each place has its own track. The old one fades out as the new one fades in.
  playMusic(track, { loop = true } = {}) {
    if (track === this.track) return;
    this.track = track;
    const old = this.front;
    const next = old === this.a ? this.b : this.a;
    old.goal = 0;
    if (track) {
      next.src = `assets/audio/${track}.mp3`;
      next.loop = loop;
      next.volume = 0;
      next.goal = this.musicVolume;
      this.tryPlay(next);
    }
    this.front = next;
  }

  // Music steps back a little while someone is speaking.
  duck(on) { this.front.goal = this.track ? (on ? this.musicVolume * 0.45 : this.musicVolume) : 0; }

  update(dt) {
    for (const el of [this.a, this.b]) {
      const d = el.goal - el.volume;
      if (Math.abs(d) > 0.001) el.volume = Math.max(0, Math.min(1, el.volume + Math.sign(d) * Math.min(Math.abs(d), dt * 0.5)));
      else if (el.goal === 0 && el !== this.front && !el.paused) { el.pause(); el.removeAttribute('src'); el.load(); }
    }
  }

  registerSounds(map) { this.soundFiles = map; }

  sfx(name, volume = 0.6) {
    if (this.quiet || this.muted || !this.soundFiles || !this.soundFiles[name]) return;
    const now = performance.now();
    if (this.lastPlayed[name] && now - this.lastPlayed[name] < 70) return;      // no machine-gun repeats
    this.lastPlayed[name] = now;
    let pool = this.sounds[name];
    if (!pool) pool = this.sounds[name] = { els: [], i: 0 };
    let el = pool.els[pool.i % 3];
    if (!el) { el = new Audio(this.soundFiles[name]); el.preload = 'auto'; pool.els[pool.i % 3] = el; }
    pool.i++;
    el.volume = volume;
    el.currentTime = 0;
    this.tryPlay(el);
  }

  voice(file) {
    if (this.quiet || !file) return;
    this.voiceEl.src = file;
    this.voiceEl.volume = 1;
    this.tryPlay(this.voiceEl);
  }

  stopVoice() { if (!this.voiceEl.paused) this.voiceEl.pause(); }
}
