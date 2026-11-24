// Spoken lines. Every line lives in data/dialogue.json with its speaker and
// its sound file. A line is heard, and a few of its words are shown: never more
// than eight at a time.

export const MAX_CAPTION_WORDS = 8;

// Cut a line into pieces of at most eight words, breaking at punctuation where possible.
export function captionChunks(text, max = MAX_CAPTION_WORDS) {
  const words = text.trim().split(/\s+/);
  const chunks = [];
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push(cur.join(' ')); cur = []; } };
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const endsSentence = /[.!?]["']?$/.test(words[i]);
    const endsClause = /[,;:]$/.test(words[i]);
    const left = words.length - i - 1;
    if (cur.length >= max) flush();
    else if (endsSentence && cur.length >= 3) flush();
    else if (endsClause && cur.length >= 5 && left >= 2) flush();
  }
  flush();
  return chunks;
}

export class Dialogue {
  constructor(audio) {
    this.audio = audio;
    this.lines = {};
    this.voices = {};
    this.queue = [];
    this.current = null;
    this.caption = null;          // { speaker, text } or null
    this.history = [];            // ids of lines that have played, for the checks
    this.onCaption = null;
  }

  async load(url = 'data/dialogue.json') {
    const res = await fetch(url);
    const data = await res.json();
    this.voices = data.voices || {};
    for (const l of data.lines) this.lines[l.id] = l;
    this.sounds = data.sounds || {};
    return data;
  }

  has(id) { return !!this.lines[id]; }

  busy() { return !!this.current || this.queue.length > 0; }

  // Say a line. Story lines wait their turn; a hint is dropped if people are already talking.
  say(id, { hint = false, then = null } = {}) {
    const line = this.lines[id];
    if (!line) { if (then) then(); return false; }
    if (hint && this.busy()) return false;
    this.queue.push({ line, then });
    return true;
  }

  stop() {
    const pend = [];
    if (this.current && this.current.then) pend.push(this.current.then);
    for (const q of this.queue) if (q.then) pend.push(q.then);
    this.queue = [];
    this.current = null;
    this.setCaption(null);
    this.audio.stopVoice();
    this.audio.duck(false);
    for (const f of pend) f();
  }

  setCaption(c) {
    this.caption = c;
    if (this.onCaption) this.onCaption(c);
  }

  update(dt) {
    if (!this.current) {
      const next = this.queue.shift();
      if (!next) return;
      const line = next.line;
      const chunks = captionChunks(line.text);
      const total = Math.max(1.2, line.duration || line.text.split(/\s+/).length * 0.4);
      const chars = chunks.reduce((n, c) => n + c.length, 0) || 1;
      let t = 0;
      const marks = chunks.map((c) => { const start = t; t += (c.length / chars) * total; return { text: c, start }; });
      this.current = { line, then: next.then, t: 0, total: total + 0.35, marks, shown: -1 };
      this.history.push(line.id);
      this.audio.duck(true);
      this.audio.voice(line.file);
    }
    const c = this.current;
    c.t += dt;
    let idx = 0;
    for (let i = 0; i < c.marks.length; i++) if (c.t >= c.marks[i].start) idx = i;
    if (idx !== c.shown) { c.shown = idx; this.setCaption({ speaker: c.line.speaker, text: c.marks[idx].text }); }
    if (c.t >= c.total) {
      this.current = null;
      this.setCaption(null);
      if (!this.queue.length) this.audio.duck(false);
      if (c.then) c.then();
    }
  }
}
