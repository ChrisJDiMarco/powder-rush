(function (A) {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d'), G = A.game, I = A.input;
  let W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight; if (W < 2 || H < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr | 0; cv.height = H * dpr | 0; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    A.R.resize(W, H, dpr);
  }
  addEventListener('resize', resize); resize();
  G.reset(true);  let last = performance.now(), ready = W > 1;
  function loop(now) {
    requestAnimationFrame(loop);
    if (innerWidth !== W || innerHeight !== H || !ready) { resize(); ready = W > 1 && H > 1; if (!ready) { last = now; return; } }
    const dt = Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
    try { G.update(dt); A.R.draw(ctx, G, dt); A.ui.frame(dt); } catch (e) { console.error(e); }
  }
  requestAnimationFrame(loop);

  function actDown() { if (G.state !== 'play') return; A.Audio.init(); I.act = true; }
  function actUp() { if (!I.act) return; I.act = false; const p = G.p; if (G.state === 'play' && p && !p.dead && (p.ground || p.rail)) p.jump(); }
  addEventListener('keydown', e => {
    const k = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
    if (k === 'Enter') { if (G.state !== 'play') G.start(); return; }
    if (k === 'KeyM') return A.ui.toggleMute();
    if (k === 'KeyG') return A.ui.toggleGhost();
    if (k === 'KeyV') return A.ui.toggleView();
    if (k === 'KeyR' && (G.state === 'over' || G.state === 'pause' || G.state === 'play')) { G.start(); return; }
    if (k === 'Escape' || k === 'KeyP') { G.state === 'play' ? G.pause() : G.resume(); return; }
    if (G.state === 'title' && k === 'Space') { G.start(); return; }
    if (G.state === 'title' && (k === 'ArrowLeft' || k === 'ArrowRight')) { A.ui.pick(k === 'ArrowLeft' ? -1 : 1); return; }
    if (G.state === 'over' && k === 'Space' && G.crashT > 2.3) { G.start(); return; }
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') { if (!e.repeat) actDown(); }
    if (k === 'ArrowLeft' || k === 'KeyA') I.left = true;
    if (k === 'ArrowRight' || k === 'KeyD') I.right = true;
    if (k === 'ArrowDown' || k === 'KeyS') I.down = true;
  });
  addEventListener('keyup', e => {
    const k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') actUp();
    if (k === 'ArrowLeft' || k === 'KeyA') I.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') I.right = false;
    if (k === 'ArrowDown' || k === 'KeyS') I.down = false;
  });
  let ptr = null;
  cv.addEventListener('pointerdown', e => {
    if (G.state !== 'play') return;
    ptr = { id: e.pointerId, y: e.clientY, grab: false }; I.front = e.clientX < W * .3; actDown();
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (!ptr.grab && G.p && e.clientY - ptr.y > 34) { ptr.grab = true; I.act = false; I.down = true; }
  });
  const up = e => { if (!ptr || e.pointerId !== ptr.id) return; if (ptr.grab) I.down = false; else actUp(); ptr = null; I.front = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const halt = () => { I.act = I.left = I.right = I.down = false; G.pause(); };
  addEventListener('blur', halt);
  document.addEventListener('visibilitychange', () => { if (document.hidden) halt(); });
  try { if (window.cabinet && cabinet.onVisibility) cabinet.onVisibility(v => { if (!v) halt(); }); } catch (e) {}

  const C = window.cabinet;
  if (C && C.commands) {
    try {
      C.commands({
        startRun: { description: 'Start a new Powder Rush run', params: {}, run: () => { G.start(); return { message: 'Dropping in: ' + A.PHASES[G.phase] + ' run.' }; } },
        pauseGame: { description: 'Pause or resume the current run', params: {}, run: () => { if (G.state === 'play') G.pause(); else G.resume(); return { message: G.state === 'pause' ? 'Paused.' : 'Resumed.' }; } },
        toggleMute: { description: 'Mute or unmute the game sound', params: {}, run: () => { A.ui.toggleMute(); return { muted: A.save.muted, message: A.save.muted ? 'Sound off.' : 'Sound on.' }; } },
        toggleGhost: { description: 'Turn the best-run ghost on or off', params: { on: { type: 'boolean', description: 'true for on; toggles if left out' } }, run: a => { G.setGhost(typeof a.on === 'boolean' ? a.on : !A.save.ghostOn); A.ui.refresh(); return { ghostOn: A.save.ghostOn, message: 'Ghost ' + (A.save.ghostOn ? 'on.' : 'off.') }; } },
        setView: { description: 'Switch between side view and first-person view', params: { view: { type: 'string', description: 'side or first-person; toggles if left out' } }, run: a => { const v = String(a.view || ''); A.save.view = /first|fp|pov/i.test(v) ? 'fp' : /side/i.test(v) ? 'side' : (A.save.view === 'fp' ? 'side' : 'fp'); A.persist(); A.ui.refresh(); return { view: A.save.view, message: A.save.view === 'fp' ? 'First-person view.' : 'Side view.' }; } },
        goToMenu: { description: 'Leave the run and go to the title screen', params: {}, run: () => { G.menu(); return { message: 'Back at the menu.' }; } },
        stats: { description: 'Report best score, distance, top speed and coins', params: {}, run: () => { const s = A.save; return { best: s.best, bestDist: s.bestDist, topSpeed: s.topSpeed, coins: s.coins, runs: s.runs, message: 'Best ' + s.best + ' pts, ' + s.bestDist + ' m, ' + s.topSpeed + ' mph top, ◉' + s.coins + ' coins over ' + s.runs + ' runs.' }; } },
        dailyChallenge: { description: "Report today's daily challenge and whether it's done", params: {}, run: () => { const d = A.daily(); return { goal: d.goal, kind: d.kind, done: d.done, message: (d.done ? 'Done today: ' : 'Today: ') + d.text + ' (◉ +' + d.reward + ').' }; } },
        selectRider: { description: 'Pick an unlocked rider (Nova, Kai, Mika, Rook, Yuki, Blaze), unlocking it with coins if affordable', params: { name: { type: 'string', description: 'rider name' } },
          run: a => { const i = A.RIDERS.findIndex(r => r.name.toLowerCase() === String(a.name || '').toLowerCase()); if (i < 0) throw new Error('No rider called ' + a.name); A.ui.ri = i; A.ui.buy(); if (A.save.rider !== A.RIDERS[i].id) throw new Error('Not enough coins: ' + A.RIDERS[i].name + ' costs ' + A.RIDERS[i].price); return { message: 'Now riding ' + A.RIDERS[i].name + '.' }; } }
      });
      if (C.describeMemory) C.describeMemory({ save: 'game progress: { best, bestDist (m), topSpeed (mph), coins, unlocked: [rider ids], rider, muted, runs, bestTrick, bestTrickPts, last: {score, dist, at}, ghost: {d, p:[dx,dy,ang...] every .25s} best-distance replay, streak: {n, last} consecutive play days, history: last 20 runs [{score, dist, top, at, why}], life: {dist, flips, coins} lifetime totals, phaseBest: {Day, Sunset, Night, Aurora} best score per sky, daily: {id: YYYY-MM-DD, done, bestVal} today\'s challenge, today: {id, runs, best} today\'s runs and best score, ghostOn: boolean show the ghost, view: side|fp camera, viewBest: {side, fp} best score per camera view, viewRuns: {side, fp} runs per camera view }' });
    } catch (e) {}
  }
})(window.App);
