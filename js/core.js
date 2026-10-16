window.App = window.App || {};
(function (A) {
  A.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.rng = function (seed) { let s = (seed >>> 0) || 7; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  A.hash = function (n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  A.noise = function (x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return A.lerp(A.hash(i), A.hash(i + 1), u); };
  A.fbm = x => A.noise(x) * .55 + A.noise(x * 2.1 + 9) * .28 + A.noise(x * 4.3 + 3) * .17;
  A.wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  const C = window.cabinet || null;
  A.recall = (k, d) => {
    try {
      if (C && C.recall) { const v = C.recall(k, d); return v == null ? d : v; }
      const s = localStorage.getItem('pr_' + k); return s ? JSON.parse(s) : d;
    } catch (e) { return d; }
  };
  A.remember = (k, v) => {
    try { if (C && C.remember) C.remember(k, v); else localStorage.setItem('pr_' + k, JSON.stringify(v)); } catch (e) {}
  };

  A.RIDERS = [
    { id: 'nova', name: 'Nova', price: 0, jacket: '#e8574a', pants: '#2b3550', helmet: '#f4f1ea', goggle: '#ff9a3c', skis: '#ffb341', scarf: '#ffd166' },
    { id: 'kai', name: 'Kai', price: 150, jacket: '#22b5a5', pants: '#1d2a3a', helmet: '#20262f', goggle: '#5ee3ff', skis: '#f2f2f2', scarf: '#ff6b8b' },
    { id: 'mika', name: 'Mika', price: 350, jacket: '#8a5cf6', pants: '#f1ece4', helmet: '#ffd1e8', goggle: '#ff5fa2', skis: '#2fd3ff', scarf: '#ffe36e' },
    { id: 'rook', name: 'Rook', price: 700, jacket: '#1b1d24', pants: '#2c2f38', helmet: '#d4a640', goggle: '#ffcf4a', skis: '#d4a640', scarf: '#d4a640' },
    { id: 'yuki', name: 'Yuki', price: 1200, jacket: '#f7f4ef', pants: '#ff8fb3', helmet: '#ffffff', goggle: '#7b6cff', skis: '#ff5d8f', scarf: '#9fe7ff' },
    { id: 'blaze', name: 'Blaze', price: 2500, jacket: '#c6ff3a', pants: '#14161c', helmet: '#ff4d2e', goggle: '#00f0ff', skis: '#ff4d2e', scarf: '#ff4d2e' }
  ];
  A.PHASES = ['Day', 'Sunset', 'Night', 'Aurora'];
  const def = { best: 0, bestDist: 0, topSpeed: 0, coins: 0, unlocked: ['nova'], rider: 'nova', muted: false, runs: 0, bestTrick: '', bestTrickPts: 0, ghostOn: true, view: 'side' };
  A.save = Object.assign({}, def, A.recall('save', {}) || {});
  A.fix = s => { const n = v => (typeof v === 'number' && isFinite(v)) ? v : 0; ['best','bestDist','topSpeed','coins','runs','bestTrickPts'].forEach(k => s[k] = n(s[k]));
    if (!Array.isArray(s.unlocked) || !s.unlocked.length) s.unlocked = ['nova']; if (!s.unlocked.includes('nova')) s.unlocked.unshift('nova');
    if (!A.RIDERS.some(r => r.id === s.rider && s.unlocked.includes(r.id))) s.rider = 'nova';
    if (!s.life || typeof s.life !== 'object') s.life = { dist: 0, flips: 0, coins: 0 }; if (!Array.isArray(s.history)) s.history = [];
    if (typeof s.ghostOn !== 'boolean') s.ghostOn = true; if (s.view !== 'fp') s.view = 'side';
    if (!s.phaseBest || typeof s.phaseBest !== 'object') s.phaseBest = {};
    if (s.today && (typeof s.today !== 'object' || typeof s.today.best !== 'number')) delete s.today;
    return s; };
  A.fix(A.save);
  A.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  A.yday = () => { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  A.daily = () => { const id = A.today(), h = A.hash(+id.replace(/-/g, '') % 99991), k = Math.floor(h * 4), q = A.hash(h * 77);
    const D = [['dist', 350 + Math.round(q * 5) * 80, 'Ride {g} m in one run'], ['flips', 2 + Math.round(q * 3), 'Land {g} flips in one run'], ['coins', 15 + Math.round(q * 3) * 5, 'Grab {g} coins in one run'], ['air', 5 + Math.round(q * 4), 'Get {g} s of airtime in one run']][k];
    return { id, kind: D[0], goal: D[1], text: D[2].replace('{g}', D[1]), reward: 120, done: !!(A.save.daily && A.save.daily.id === id && A.save.daily.done) }; };
  A.persist = () => A.remember('save', A.save);
  A.rider = () => A.RIDERS.find(r => r.id === A.save.rider) || A.RIDERS[0];
  if (C && C.onMemory) C.onMemory(m => {
    if (m && m.save && typeof m.save === 'object' && !(A.game && A.game.state === 'play')) { const gh = A.save.ghost; Object.assign(A.save, m.save); if (!A.save.ghost && gh) A.save.ghost = gh; A.fix(A.save); if (A.ui && A.ui.refresh) A.ui.refresh(); }
  });
  A.input = { act: false, left: false, right: false, down: false, front: false };
})(window.App);
