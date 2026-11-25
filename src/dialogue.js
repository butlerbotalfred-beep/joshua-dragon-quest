// ============================================================================
// Spoken Dialogue & <=8-Word Caption Engine (Backed by data/dialogue.json)
// ============================================================================

export function chunkToMaxWords(text, maxWords = 8) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks.length ? chunks : [''];
}

export class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.entries = new Map();
    this.voices = {};
    this.loaded = false;
    this.currentAudio = null;
    this.currentId = null;
    this.playedHistory = [];
    this.sequenceAbort = false;
  }

  async load(url = 'data/dialogue.json') {
    if (this.loaded) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      this.voices = data.voices || {};
      for (const line of data.lines || []) {
        this.entries.set(line.id, line);
      }
      this.loaded = true;
    } catch (_) {}
  }

  get(id) {
    return this.entries.get(id) || null;
  }

  stop() {
    this.sequenceAbort = true;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    this.currentId = null;
  }

  play(id, opts = {}) {
    const entry = this.entries.get(id);
    if (!entry) return Promise.resolve(false);

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    this.currentId = id;
    this.playedHistory.push({
      id,
      speaker: entry.speaker,
      text: entry.text,
      time: this.game ? this.game.simTime : 0,
    });

    const words = entry.text.trim().split(/\s+/).filter(Boolean).length;
    const estDuration = Math.max(1.8, words * 0.36 + 0.6);

    if (this.game && !opts.silentCaption) {
      this.game.showCaption(entry.speaker, entry.text, estDuration);
    }

    if (this.game && this.game.audio && this.game.audio.muted) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        const audio = new Audio(entry.audio);
        audio.volume = 0.92;
        this.currentAudio = audio;
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(true);
        };
        audio.addEventListener('loadedmetadata', () => {
          if (audio.duration && Number.isFinite(audio.duration) && this.game && !opts.silentCaption) {
            this.game.showCaption(entry.speaker, entry.text, audio.duration);
          }
        }, { once: true });
        audio.addEventListener('ended', done, { once: true });
        audio.addEventListener('error', done, { once: true });
        audio.play().catch(done);
      } catch (_) {
        resolve(false);
      }
    });
  }

  async playSequence(ids, onLineStart = null) {
    this.sequenceAbort = false;
    for (const id of ids) {
      if (this.sequenceAbort) break;
      const entry = this.entries.get(id);
      if (onLineStart && entry) onLineStart(entry);
      await this.play(id);
    }
  }
}
