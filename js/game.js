(function (A) {
  const G = A.game = { state: 'title', zoom: 1, cam: { x: 0, y: 0 }, t: 0, ts: 1, shake: 0, pops: [], parts: [], trail: [], wind: 0 };
  G.reset = function (demo) {
    G.seed = demo ? (Date.now() % 100000) | 0 : (+A.today().replace(/-/g, '') % 99991) * 7 + 13;
    G.terr = new A.Terrain(G.seed); G.terr.ensure(0);
    G.p = new A.Player(G.terr, 300); G.x0 = 300;
    G.runT = 0; G.trickPts = 0; G.coins = 0; G.mult = 1; G.multT = 0; G.pops = []; G.parts = []; G.trail = [];
    G.shake = 0; G.aval = null; G.avalNext = 35 + Math.random() * 25; G.top = 0; G.airTotal = 0; G.bestTrick = { n: '', p: 0 };
    G.demo = demo; G.crashT = 0; G.passedBest = false; G.ts = 1; G.score = 0; G.flips = 0; G.nearMiss = 0; G.perfects = 0;
    G.mag = 0; G.hint = (!demo && A.save.runs < 12) ? 7 : 0; G.cd = demo ? 0 : 1.6; G.phase = A.save.runs % 4; A.R.setPhase(G.phase);
    G.rec = []; G.recT = 0; const gs = A.save.ghost; G.ghost = (!demo && gs && Array.isArray(gs.p) && gs.seed === G.seed && A.save.ghostOn !== false) ? gs : null; G.passedGhost = false; G.passedView = false; G.mphM = 0;
    G.cam.x = G.p.x; G.cam.y = G.p.y; G.trendY = G.p.y; G.vOff = 0; G.anchor = .38; G.fpS = G.terr.slope(G.p.x); G.fpLean = 0; G.fpLat = 0; G.vmax = 1400; G.fovKick = 0;
  };
  G.start = function () { A.Audio.init(); G.reset(false); G.state = 'play'; A.ui.show('play'); G.pop('DROP IN!', A.PHASES[G.phase] + ' run', '#bfe3ff', true); };
  G.pause = function () { if (G.state === 'play') { G.state = 'pause'; A.ui.show('pause'); } };
  G.resume = function () { if (G.state === 'pause') { G.state = 'play'; A.ui.show('play'); } };
  G.menu = function () { G.reset(true); G.state = 'title'; A.ui.show('title'); };
  G.dist = () => Math.max(0, (G.p.x - G.x0) / 20);
  G.pop = function (txt, sub, col, big) { if (G.demo) return; G.pops.push({ txt, sub, col, big, t: 0, d: 1.8 }); if (G.pops.length > 3) G.pops.shift(); };
  G.emit = function (x, y, vx, vy, s, l, k, c) {
    if (G.parts.length > 280) G.parts.shift();
    G.parts.push({ x, y, vx, vy, s, l, ml: l, k, c });
  };
  G.burst = function (x, y, n, sp, k, c) { for (let i = 0; i < n; i++) { const a = -Math.PI * Math.random(); G.emit(x, y, Math.cos(a) * sp * Math.random(), Math.sin(a) * sp * Math.random(), 2 + Math.random() * 3, .5 + Math.random() * .6, k, c); } };
  G.bank = function (tricks, clean) {
    if (!tricks.length) return;
    let pts = tricks.reduce((s, t) => s + t.p, 0);
    const name = tricks.map(t => t.n).join(' + ');
    if (clean) { pts *= G.mult; G.pop(name + (G.mult > 1 ? ' x' + G.mult : ''), '+' + pts, '#ffffff', tricks.length > 1); A.Audio.chime(G.mult); G.mult = Math.min(10, G.mult + 1); G.multT = 0; }
    else { pts = Math.round(pts / 2); G.pop('SKETCHY ' + name, '+' + pts, '#ffd0c0'); G.mult = 1; }
    if (!G.demo) { G.flips += tricks.reduce((s, t) => s + (t.f || 0), 0); G.trickPts += pts; if (pts > G.bestTrick.p) G.bestTrick = { n: name, p: pts }; }
  };
  G.land = function (p) {
    const T = G.terr, a = Math.atan(T.slope(p.x)), diff = Math.abs(A.wrapA(p.ang - a));
    const vn = -(p.vx * Math.sin(a) - p.vy * Math.cos(a));
    const tricks = p.tricks.concat(p.airTricks()); p.tricks = [];
    if (diff > 1.0 || (diff > .55 && vn > 750) || vn > 1500) { G.crash(p, 'BAD LANDING'); return; }
    p.ground = true; p.av = 0;
    p.sp = Math.max(160, p.vx * Math.cos(a) + p.vy * Math.sin(a));
    p.ang = a + A.wrapA(p.ang - a) * .5; p.groundT = 0;
    const clean = diff < .42, perfect = diff < .14 && p.air > .5;
    if (perfect && !G.demo) { p.sp = Math.min(1350, p.sp + 70); G.trickPts += 50 * G.mult; G.pop('PERFECT LANDING', '+' + 50 * G.mult + ' · speed boost', '#c8ffda'); G.perfects = (G.perfects || 0) + 1; }
    if (vn > 380) { G.shake = Math.max(G.shake, Math.min(14, (vn - 300) / 60)); }
    A.Audio.thud(vn);
    G.burst(p.x, p.y, 10 + Math.min(30, vn / 30), 120 + vn * .3, 1);
    if (tricks.length) {
      if (clean) { G.fovKick = 1; p.sp = Math.min(1350, p.sp + 90 + 40 * tricks.length); G.burst(p.x, p.y - 10, 12, 200, 2, '160,220,255'); }
      G.bank(tricks, clean);
    } else if (!clean) G.mult = 1;
    G.trail.push(null);
  };
  G.onRail = function (p) { A.Audio.swish(); G.pop('RAIL!', null, '#bfe3ff'); };
  G.crash = function (p, why) {
    if (p.dead) return;
    p.crash(A.rider()); G.crashT = 0; G.shake = 16; A.Audio.crash(); G.mult = 1;
    G.burst(p.x, p.y - 10, 40, 420, 1);
    if (!G.demo) G.pop(why || 'WIPEOUT', null, '#ffb4b4', true);
    G.crashWhy = why;
  };
  G.auto = function (dt) {
    const p = G.p, o = { act: false, back: false, front: false, down: false };
    if (p.ground || p.rail) { o.act = p.sp < 650; G.autoFlip = A.hash(Math.floor(p.x / 400)) < .55; if (Math.random() < dt * .35) p.jump(); }
    else {
      const a = Math.atan(G.terr.slope(p.x + p.vx * .3));
      if (G.autoFlip && p.maxH > 70 && p.rot > -2 * Math.PI + .6 && p.vy < 250) o.back = true;
      else { const d = A.wrapA(a - p.ang); if (d < -.1) o.back = true; else if (d > .1) o.front = true; }
      o.down = p.air > .3 && p.air < .8 && !o.back;
    }
    return o;
  };
  G.update = function (rdt) {
    G.t += rdt;
    if (!G.terr) G.reset(true);
    const W = A.R.W, H = A.R.H;
    G.pops.forEach(p => p.t += rdt); G.pops = G.pops.filter(p => p.t < p.d);
    if (G.state === 'pause') return;
    const p = G.p, I = A.input;
    const tsT = p.dead ? (G.crashT < .6 ? .45 : 1) : (!p.ground && !p.rail && p.maxH > 150 && !G.demo ? .55 : 1);
    G.ts += (tsT - G.ts) * Math.min(1, rdt * 6);
    let dt = rdt * G.ts;
    if (G.cd > 0 && !G.demo) { G.cd -= rdt; dt *= .15; }
    if (G.mag > 0) G.mag -= dt;
    if (G.hint > 0) G.hint -= rdt;
    const inp = G.demo ? G.auto(dt) : { act: I.act, back: I.left || (I.act && !I.front && !p.ground && !p.rail), front: I.right || (I.act && I.front && !p.ground && !p.rail), down: I.down };
    G.vmax = G.demo ? 1400 : Math.min(1400, 760 + G.dist() * 1.3);
    for (let i = 0; i < 3; i++) p.update(dt / 3, inp, G);
    const T = G.terr; T.ensure(p.x);
    if (Math.floor(G.t) !== G.lastPrune) { G.lastPrune = Math.floor(G.t); T.prune(p.x); }
    const sp = p.dead ? 0 : p.speed();
    if (!p.dead) {
      for (const o of T.objs) {
        if (o.k === 'yeti') { o.x += o.vx * dt; o.y = T.h(o.x); }
        if (!o.pass && o.k !== 'coin' && o.k !== 'mag' && !o.hit && o.x < p.x - 20 && o.x > p.x - 60 && !G.demo) { o.pass = true; if (A.save.view === 'fp') A.Audio.whoosh(); }
        if (o.x < p.x - 50 || o.x > p.x + 50) continue;
        if (o.k === 'mag') { if (!o.got && Math.hypot(o.x - p.x, o.y - (p.y - 22)) < 34) { o.got = true; G.mag = 6; G.pop('COIN MAGNET', '6 s', '#9fd8ff'); A.Audio.chime(2); } continue; }
        if (o.k === 'coin') {
          if (!o.got && Math.hypot(o.x - p.x, o.y - (p.y - 22)) < 30) { o.got = true; if (!G.demo) G.coins++; A.Audio.coin(); G.burst(o.x, o.y, 8, 140, 2, '255,210,90'); }
        } else if (!o.hit && !o.nm && !G.demo && o.x < p.x - o.r - 8 && o.x > p.x - o.r - 40 && p.y < o.y - o.h + 4 && p.y > o.y - o.h - 45) {
          o.nm = true; G.trickPts += 100 * G.mult; G.nearMiss = (G.nearMiss || 0) + 1; G.pop('CLOSE CALL', '+' + 100 * G.mult, '#9fe7ff'); A.Audio.swish();
        } else if (!o.hit && !p.rail && Math.abs(o.x - p.x) < o.r + 8 && p.y > o.y - o.h + 4) {
          o.hit = true; G.crash(p, o.k === 'yeti' ? 'YETI ATTACK!' : o.k === 'snowman' ? 'SNOWMAN SMASH' : o.k === 'tree' ? 'TREE HUGGER' : 'ROCK BOTTOM');
        }
      }
      if (p.ground) {
        const ty = T.type(p.x), a = Math.atan(T.slope(p.x));
        const n = sp * dt * (ty === 2 ? .09 : .03) * (p.tuck ? 1.4 : 1);
        if (p.carve && Math.random() < dt * 30) G.emit(p.x + 10, p.y - 2, p.vx * .3, -80 - Math.random() * 120, 2 + Math.random() * 2, .5, 1);
        for (let i = 0; i < n; i++) G.emit(p.x - Math.cos(a) * 22, p.y - 2, -p.vx * .12 + (Math.random() - .5) * 60, -40 - Math.random() * (60 + sp * .12), 1.2 + Math.random() * (ty === 2 ? 4 : 2), .4 + Math.random() * .5, ty === 2 ? 1 : 0);
        const lt = G.trail[G.trail.length - 1];
        if (!lt || p.x - lt.x > 10) G.trail.push({ x: p.x, y: p.y });
        if (!G.demo) { G.multT += dt; if (G.multT > 3.5 && G.mult > 1) { G.mult = 1; } }
      } else if (p.rail) { G.emit(p.x, p.y, -p.vx * .2 + (Math.random() - .5) * 80, -Math.random() * 120, 3, .3, 2, '255,190,90'); }
      else { G.airTotal += G.demo ? 0 : dt; if (G.trail[G.trail.length - 1]) G.trail.push(null); }
      if (G.trail.length > 260) G.trail.splice(0, 40);
      G.top = Math.max(G.top, sp);
      if (!G.demo) { G.recT += dt; if (G.recT >= .25 && G.rec.length < 1200) { G.recT = 0; G.rec.push(Math.round(G.p.x - G.x0), Math.round(G.p.y - G.terr.h(G.p.x)), Math.round(G.p.ang * 100) / 100); } }
      G.runT = (G.runT || 0) + (G.demo ? 0 : dt);
    } else {
      G.crashT += rdt;
      if (G.crashT > 1.8) { if (G.demo) G.reset(true); else if (G.state === 'play') G.over(); }
    }
    if (G.mag > 0 && !p.dead) for (const o of T.objs) { if (o.k !== 'coin' || o.got) continue; const dx = p.x - o.x, dy = p.y - 22 - o.y, d = Math.hypot(dx, dy); if (d < 260 && d > 1) { const k = Math.min(1, dt * 9); o.x += dx * k; o.y += dy * k; } }
    for (const q of G.parts) { q.vy += (q.k === 2 ? 200 : 700) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - dt * 1.5; q.l -= dt; if (q.k === 1) q.s += dt * 6; }
    G.parts = G.parts.filter(q => q.l > 0);
    // avalanche
    let rum = 0;
    if (!G.demo && !p.dead && G.state === 'play') {
      if (!G.aval) { G.avalNext -= dt; if (G.avalNext <= 0 && G.dist() > 300) { G.aval = { x: p.x - 1100, t: 0 }; G.pop('AVALANCHE!', 'Outrun it!', '#ffb4b4', true); } }
      else {
        const a = G.aval; a.t += dt; a.x = Math.max(a.x + (540 + a.t * 24) * dt, p.x - 1300);
        const d = p.x - a.x; rum = A.clamp(1 - d / 1300, 0, 1);
        G.shake = Math.max(G.shake, rum * 5);
        if (d < 10) G.crash(p, 'BURIED');
        if (a.t > 20) { G.aval = null; G.avalNext = 45 + Math.random() * 35; G.trickPts += 1500; G.pop('ESCAPED THE AVALANCHE', '+1500', '#c8ffda', true); A.Audio.chime(4); }
      }
    } else if (G.aval && G.aval.t !== undefined && !p.dead) G.aval = null;
    if (G.aval && p.dead) G.aval.x += 500 * dt;
    G.avalLevel = rum;
    // camera
    const air = p.ground || p.rail || p.dead ? 0 : p.maxH;
    const zt = (H / 560) * (1 - Math.min(.22, sp / 5000) - Math.min(.2, air / 1400));
    G.zoom += (A.clamp(zt, .38, 1.6) - G.zoom) * Math.min(1, rdt * 2);
    const ox = G.cam.x, oy = G.cam.y;
    const ck = Math.min(1, sp / 1200);
    G.anchor += ((.38 - .12 * ck) - G.anchor) * Math.min(1, rdt * 1.5);
    G.cam.x += (p.x + p.vx * (.25 + .15 * ck) - G.cam.x) * Math.min(1, rdt * 5);
    G.fpS += (T.slope(p.x + 80) - G.fpS) * Math.min(1, rdt * 3);
    const st = G.demo ? 0 : (I.right ? 1 : 0) - (I.left ? 1 : 0), lt = (p.ground && !p.dead) ? st * .12 + (p.carve ? .05 : 0) + Math.sin(G.t * 1.7) * .015 : 0;
    G.fpLean += (lt - G.fpLean) * Math.min(1, rdt * 5); G.fpLat += ((p.ground ? st * 16 : 0) - G.fpLat) * Math.min(1, rdt * 2);
    G.cam.y += (p.y - 30 + p.vy * .08 - G.cam.y) * Math.min(1, rdt * 5);
    G.camDX = (G.cam.x - ox) / Math.max(rdt, .001) * G.zoom; G.camDY = (G.cam.y - oy) / Math.max(rdt, .001) * G.zoom;
    G.trendY += (G.cam.y - G.trendY) * Math.min(1, rdt * .6);
    G.vOff = A.clamp((G.cam.y - G.trendY) * G.zoom, -160, 160);
    G.shake *= Math.exp(-rdt * 6); G.fovKick = (G.fovKick || 0) * Math.exp(-rdt * 2.5);
    G.wind = Math.sin(G.t * .13) * .5 + (A.noise(G.t * .3) - .5) * 1.4;
    if (!G.demo && !p.dead) { const mph = sp * .112; G.mphM = G.mphM || 0; const ms = [60, 100, 140]; if (G.mphM < 3 && mph >= ms[G.mphM]) { G.pop(ms[G.mphM] + ' MPH CLUB', G.mphM === 2 ? 'Absolute send' : 'Keep it pinned', '#ffd166'); A.Audio.chime(G.mphM + 1); G.mphM++; } }
    G.score = Math.floor(G.dist() + G.trickPts + G.coins * 25);
    if (!G.demo && !G.passedBest && A.save.bestDist > 50 && G.dist() > A.save.bestDist && !p.dead) { G.passedBest = true; G.pop('PAST YOUR BEST!', A.save.bestDist + ' m', '#c8ffda', true); A.Audio.chime(3); }
    const vk = A.save.view, vb = (A.save.viewBest || {})[vk] || 0; if (!G.demo && !G.passedView && vb > 100 && G.score > vb && !p.dead) { G.passedView = true; G.pop(vk === 'fp' ? 'FIRST-PERSON BEST!' : 'SIDE-VIEW BEST!', vb + ' beaten', '#c8ffda'); A.Audio.chime(2); }
    if (G.ghost && !G.demo && !G.passedGhost && !p.dead && G.dist() > G.ghost.d && G.ghost.d > 30) { G.passedGhost = true; G.trickPts += 250; G.pop('GHOST BEATEN', '+250 · new line today', '#bfe3ff', true); A.Audio.chime(3); }
    A.Audio.tick(sp, p.ground || !!p.rail, A.Terrain && p.ground ? T.type(p.x) : 0, rum);
  };
  G.setGhost = function (on) { A.save.ghostOn = on; A.persist(); const gs = A.save.ghost; if (G.state !== 'title') G.ghost = (on && !G.demo && gs && Array.isArray(gs.p) && gs.seed === G.seed) ? gs : null; };
  G.over = function () {
    G.state = 'over';
    const s = A.save, st = { score: G.score, dist: Math.floor(G.dist()), top: Math.round(G.top * .112), coins: G.coins, air: G.airTotal.toFixed(1), trick: G.bestTrick, why: G.crashWhy };
    st.newBest = st.score > s.best;
    if (!s.ghost || s.ghost.seed !== G.seed || st.dist > s.ghost.d) s.ghost = { d: st.dist, p: G.rec.slice(0, 1200), seed: G.seed };
    const td = A.today(); if (s.streak && s.streak.last === td) {} else { const y = new Date(Date.now() - 864e5), yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); s.streak = { n: s.streak && s.streak.last === yd ? s.streak.n + 1 : 1, last: td }; }
    st.streak = s.streak.n;
    s.best = Math.max(s.best, st.score); s.bestDist = Math.max(s.bestDist, st.dist); s.topSpeed = Math.max(s.topSpeed, st.top);
    s.coins += G.coins; s.runs++; if (!s.riderRuns || typeof s.riderRuns !== 'object') s.riderRuns = {}; const rid = A.rider().id; s.riderRuns[rid] = (s.riderRuns[rid] || 0) + 1;
    s.life.dist += st.dist; s.life.flips += G.flips; s.life.coins += G.coins; st.flips = G.flips;
    const dc = A.daily(), val = { dist: st.dist, flips: G.flips, coins: G.coins, air: G.airTotal }[dc.kind];
    st.daily = { text: dc.text, val: Math.floor(val), goal: dc.goal, was: dc.done };
    if (!dc.done && val >= dc.goal) { s.daily = { id: dc.id, done: true }; s.coins += dc.reward; st.daily.won = dc.reward; A.Audio.chime(5); }
    else if (!dc.done) { const b = s.daily && s.daily.id === dc.id ? s.daily.bestVal || 0 : 0; s.daily = { id: dc.id, done: false, bestVal: Math.max(b, Math.floor(val)) }; }
    const pk = A.PHASES[G.phase]; st.phase = pk; st.near = G.nearMiss || 0; st.phasePrev = s.phaseBest[pk] || 0; s.phaseBest[pk] = Math.max(st.phasePrev, st.score);
    if (G.bestTrick.p > (s.bestTrickPts || 0)) { s.bestTrickPts = G.bestTrick.p; s.bestTrick = G.bestTrick.n; }
    if (!s.viewBest || typeof s.viewBest !== 'object') s.viewBest = {}; const vk = s.view === 'fp' ? 'fp' : 'side'; s.viewBest[vk] = Math.max(s.viewBest[vk] || 0, st.score); if (!s.viewRuns || typeof s.viewRuns !== 'object') s.viewRuns = {}; s.viewRuns[vk] = (s.viewRuns[vk] || 0) + 1; st.view = vk; st.viewBest = s.viewBest[vk]; st.viewRuns = s.viewRuns[vk];
    st.perfects = G.perfects || 0; s.life.perfects = (s.life.perfects || 0) + st.perfects; s.life.near = (s.life.near || 0) + st.near; s.life.air = Math.round(((s.life.air || 0) + G.airTotal) * 10) / 10; s.today = (s.today && s.today.id === td) ? s.today : { id: td, runs: 0, best: 0 }; s.today.runs++; s.today.best = Math.max(s.today.best, st.score); st.todayBest = s.today.best;
    s.last = { score: st.score, dist: st.dist, at: new Date().toISOString().slice(0, 10) };
    const h = Array.isArray(s.history) ? s.history : []; st.prevAvg = h.length ? Math.round(h.reduce((a, r) => a + r.score, 0) / h.length) : 0;
    h.push({ score: st.score, dist: st.dist, top: st.top, at: s.last.at, why: st.why || '', view: st.view, ph: pk }); s.history = h.slice(-20); st.hist = s.history;
    A.persist(); G.lastStats = st;
    A.ui.over(st);
  };
})(window.App);
