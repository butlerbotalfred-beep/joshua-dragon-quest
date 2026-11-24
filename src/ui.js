// Menus and the on-screen display. Pictures first: no screen shows more than
// eight words, because the player is six.

import { HEROES, DIFFICULTY, DIFFICULTY_ORDER, LEVEL_NAMES, GUARDIANS } from './config.js';

const SPEAKER = {
  joshua: { icon: '⚡', color: HEROES[0].css }, daniel: { icon: '🔥', color: HEROES[1].css },
  vanessa: { icon: '❄️', color: HEROES[2].css }, michael: { icon: '💪', color: HEROES[3].css },
  keeper: { icon: '🌳', color: '#7be08a' }, renee: { icon: '🕯️', color: '#d9b3ff' },
  dragon: { icon: '🐉', color: '#ff7a5a' }, narrator: { icon: '📖', color: '#f5c953' },
};

const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

export class UI {
  constructor(root) {
    this.root = root;
    this.screenEl = null;
    this.screen = null;
    this.items = [];
    this.focus = 0;
    this.onAction = null;

    this.hud = el('div', 'hud hidden');
    this.chips = el('div', 'chips');
    this.chipEls = HEROES.map((h) => {
      const c = el('div', 'chip', `${h.icon}<span class="hp"><i></i></span><span class="pal"></span>`);
      c.style.setProperty('--c', h.css);
      this.chips.appendChild(c);
      return c;
    });
    this.gold = el('div', 'gold');
    this.knots = el('div', 'knots hidden');
    this.glyphs = el('div', 'glyphs', '<span><b class="gA">A</b>⤴</span><span><b class="gX">X</b>✨</span><span><b class="gY">Y</b>🔁</span><span><b class="gB">B</b>📣</span>');
    this.hud.append(this.chips, this.gold, this.knots, this.glyphs);
    this.caption = el('div', 'caption hidden');
    this.skip = el('button', 'skip hidden', '☰ ⏭');      // shows which button skips a scene; a tap on it skips too
    this.skip.addEventListener('click', () => { if (this.onAction) this.onAction('skip'); });
    this.loading = el('div', 'loading hidden', '<div class="egg">🥚</div><div class="bar"><i></i></div>');
    root.append(this.hud, this.caption, this.skip, this.loading);
    this.wanted = -1;
    this.wantedT = 0;
  }

  // ---- screens ------------------------------------------------------------------------

  close() {
    if (this.screenEl) this.screenEl.remove();
    this.screenEl = null; this.screen = null; this.items = [];
  }

  open(name, build, { clear = false, focus = 0 } = {}) {
    this.close();
    const s = el('div', 'screen' + (clear ? ' clear' : ''));
    s.dataset.screen = name;
    this.items = [];
    build(s);
    this.root.appendChild(s);
    this.screenEl = s; this.screen = name;
    this.setFocus(Math.min(focus, this.items.length - 1));
  }

  // A thing that can be chosen with the stick and the A button, or tapped.
  item(parent, cls, html, act, { locked = false } = {}) {
    const b = el('button', 'card ' + cls + (locked ? ' locked' : ''), html);
    b.dataset.act = act;
    const index = this.items.length;
    b.addEventListener('click', () => { this.setFocus(index); if (!locked && this.onAction) this.onAction(act); });
    parent.appendChild(b);
    this.items.push({ el: b, act, locked });
    return b;
  }

  setFocus(i) {
    if (!this.items.length) return;
    this.focus = (i + this.items.length) % this.items.length;
    this.items.forEach((it, k) => it.el.classList.toggle('focus', k === this.focus));
    if (this.onFocus) this.onFocus(this.items[this.focus].act);
  }

  // Menu presses from a controller. Returns the action chosen, or null.
  nav(menu) {
    if (!this.screen || !this.items.length) return null;
    if (menu.left || menu.up) this.setFocus(this.focus - 1);
    if (menu.right || menu.down) this.setFocus(this.focus + 1);
    if (menu.confirm || (menu.start && this.screen !== 'pause')) {
      const it = this.items[this.focus];
      return it.locked ? null : it.act;
    }
    if (menu.back) return 'back';
    if (menu.start && this.screen === 'pause') return 'resume';
    return null;
  }

  showTitle(soundBlocked) {
    this.open('title', (s) => {
      s.appendChild(el('h1', 'title', 'The Royal<br>Dragon Rescue'));
      const row = el('div', 'row');
      this.item(row, 'play', '▶ Play', 'play');
      s.appendChild(row);
      if (soundBlocked) s.appendChild(el('div', 'sound-off', '🔈👆'));
    });
  }

  showDifficulty(current) {
    this.open('difficulty', (s) => {
      s.appendChild(el('div', 'big-icon', '🎚️'));
      const row = el('div', 'row');
      DIFFICULTY_ORDER.forEach((k) => {
        const d = DIFFICULTY[k];
        this.item(row, '', `<span class="stars">${'★'.repeat(d.stars)}</span>${d.label}`, `difficulty:${k}`);
      });
      s.appendChild(row);
    }, { focus: Math.max(0, DIFFICULTY_ORDER.indexOf(current)) });
  }

  showPlayers(current) {
    this.open('players', (s) => {
      s.appendChild(el('div', 'big-icon', '👨‍👩‍👦‍👦'));
      const row = el('div', 'row');
      this.item(row, '', '<span class="icon">🎮</span>', 'players:1');
      this.item(row, '', '<span class="icon">🎮🎮</span>', 'players:2');
      s.appendChild(row);
    }, { focus: current === 2 ? 1 : 0 });
  }

  showHeroes(player, players, taken, current) {
    this.open('heroes', (s) => {
      const who = el('div', 'pick-who', players === 2 ? `<span class="${player === 0 ? 'on' : ''}">🎮①</span><span class="${player === 1 ? 'on' : ''}">🎮②</span>` : '<span class="on">🎮</span>');
      s.appendChild(who);
      const row = el('div', 'row');
      HEROES.forEach((h, i) => {
        const b = this.item(row, '', `<span class="icon">${h.icon}</span>${h.name}`, `hero:${i}`, { locked: i === taken });
        b.style.borderColor = h.css;
      });
      s.appendChild(row);
    }, { focus: current === taken ? (current + 1) % 4 : current });
  }

  showMap(levels, save, focusLevel) {
    this.open('map', (s) => {
      s.appendChild(el('div', 'big-icon', '🗺️'));
      const row = el('div', 'row');
      let focus = 0;
      levels.forEach((lv, k) => {
        const dots = lv.gold.map((id) => (save.gold.includes(id) ? '●' : '○')).join('');
        this.item(row, 'small', `<span class="num">${lv.locked ? '🔒' : lv.number}</span><span class="dots">${dots}</span>`, `level:${lv.number}`, { locked: lv.locked });
        if (lv.number === focusLevel) focus = k;
      });
      s.appendChild(row);
      this.mapLabel = el('div', 'label', '');
      s.appendChild(this.mapLabel);
      this.onFocus = (act) => {
        const n = +act.split(':')[1];
        if (this.mapLabel && !Number.isNaN(n)) this.mapLabel.textContent = LEVEL_NAMES[n] || '';
      };
      this.pendingFocus = focus;
    });
    this.setFocus(this.pendingFocus || 0);
  }

  showPause(difficulty, muted) {
    this.onFocus = null;
    this.open('pause', (s) => {
      s.appendChild(el('div', 'big-icon', '⏸️'));
      const row = el('div', 'row');
      this.item(row, 'small', '<span class="icon">▶</span>', 'resume');
      const d = DIFFICULTY[difficulty];
      this.item(row, '', `<span class="stars">${'★'.repeat(d.stars)}</span>${d.label}`, 'cycle-difficulty');
      this.item(row, 'small', `<span class="icon">${muted ? '🔇' : '🔊'}</span>`, 'mute');
      this.item(row, 'small', '<span class="icon">🗺️</span>', 'map');
      s.appendChild(row);
    }, { clear: true });
  }

  showComplete(found, total) {
    this.onFocus = null;
    this.open('complete', (s) => {
      s.appendChild(el('h1', 'title', 'Well done!'));
      s.appendChild(el('div', 'label', '<span style="color:var(--gold)">' + '●'.repeat(found) + '</span>' + '○'.repeat(Math.max(0, total - found))));
      const row = el('div', 'row');
      this.item(row, 'play', '▶', 'next');
      s.appendChild(row);
    }, { clear: true });
  }

  // The very end of the story.
  showEnd(gold = 0) {
    this.onFocus = null;
    this.open('end', (s) => {
      s.appendChild(el('h1', 'title', 'The End'));
      s.appendChild(el('div', 'label', '<span style="color:var(--gold)">' + '🏮'.repeat(Math.min(18, gold)) + '</span>'));
      const row = el('div', 'row');
      this.item(row, 'play', '🗺️', 'next');
      s.appendChild(row);
    }, { clear: true });
  }

  showLost() {
    this.onFocus = null;
    this.open('lost', (s) => {
      s.appendChild(el('div', 'big-icon', '💫'));
      const row = el('div', 'row');
      this.item(row, 'play', '▶ Try again', 'retry');
      s.appendChild(row);
    }, { clear: true });
  }

  // ---- loading, captions and the display during play ------------------------------------

  setLoading(on, frac = 0) {
    this.loading.classList.toggle('hidden', !on);
    this.loading.querySelector('.bar i').style.width = `${Math.round(frac * 100)}%`;
  }

  setCaption(c) {
    if (!c) { this.caption.classList.add('hidden'); this.caption.textContent = ''; return; }
    const sp = SPEAKER[c.speaker] || SPEAKER.narrator;
    this.caption.classList.remove('hidden');
    this.caption.style.setProperty('--c', sp.color);
    this.caption.innerHTML = `<span class="who">${sp.icon}</span><span class="words"></span>`;
    this.caption.querySelector('.words').textContent = c.text;
  }

  setSkip(on) { this.skip.classList.toggle('hidden', !on); }

  showHud(on) { this.hud.classList.toggle('hidden', !on); }

  // Make one hero's picture bounce: the Keeper has just named them in a hint.
  want(hero) { this.wanted = hero; this.wantedT = 8; }

  updateHud(world, dt) {
    if (this.wantedT > 0) { this.wantedT -= dt; if (this.wantedT <= 0) this.wanted = -1; }
    world.heroes.forEach((h, i) => {
      const c = this.chipEls[i];
      c.classList.toggle('on', h.control !== null);
      c.classList.toggle('p2', h.control === 1);
      c.classList.toggle('out', h.state === 'down' || h.state === 'dizzy' || h.state === 'webbed');
      c.classList.toggle('wanted', this.wanted === i && h.control === null);
      c.querySelector('.hp i').style.width = `${Math.max(0, Math.round((h.hp / h.def.maxHp) * 100))}%`;
      c.querySelector('.pal').textContent = h.bonded ? '🐲' : '';
    });
    const total = world.gold.length;
    const found = world.gold.filter((g) => g.taken).length;
    const goldHtml = '●'.repeat(found) + `<span class="no">${'●'.repeat(Math.max(0, total - found))}</span>`;
    if (this.goldHtml !== goldHtml) { this.gold.innerHTML = goldHtml; this.goldHtml = goldHtml; }
    this.gold.classList.toggle('hidden', total === 0);
    const g = world.guardian;
    const fighting = g && g.state === 'fight';
    this.knots.classList.toggle('hidden', !fighting);
    if (fighting) {
      const key = `${g.knotsLeft}/${g.knots}`;
      if (this.knotKey !== key) {
        this.knotKey = key;
        let html = GUARDIANS[g.type].icon;
        for (let i = 0; i < g.knots; i++) html += `<b class="${i < g.knotsLeft ? '' : 'gone'}"></b>`;
        this.knots.innerHTML = html;
      }
    }
  }
}

// How many words are showing right now. Used by the checks on the eight-word rule.
export function visibleWords(root) {
  const words = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    let e = node.parentElement, hidden = false;
    while (e && e !== root.parentElement) {
      const st = getComputedStyle(e);
      if (st.display === 'none' || st.visibility === 'hidden') { hidden = true; break; }
      e = e.parentElement;
    }
    if (hidden) continue;
    for (const w of node.textContent.split(/\s+/)) if (/[A-Za-z]{2,}/.test(w)) words.push(w);
  }
  return words;
}
