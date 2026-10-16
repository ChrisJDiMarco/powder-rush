(function (A) {
  const $ = id => document.getElementById(id);
  const U = A.ui = { ri: Math.max(0, A.RIDERS.findIndex(r => r.id === A.save.rider)) };
  const G = A.game;
  U.show = function (s) {
    $('title').classList.toggle('hidden', s !== 'title');
    $('pause').classList.toggle('hidden', s !== 'pause');
    $('over').classList.toggle('hidden', s !== 'over');
    $('hud').classList.toggle('hidden', s === 'title');
    if (s !== 'play') $('aval').classList.add('hidden');
    U.refresh();
  };
  U.refresh = function () {
    const s = A.save, r = A.RIDERS[U.ri], own = s.unlocked.includes(r.id);
    const rr = (s.riderRuns && s.riderRuns[r.id]) || 0;
    $('rName').textContent = r.name + (own && rr ? ' · ' + rr + ' run' + (rr > 1 ? 's' : '') : '');
    const b = $('rInfo'); b.className = 'rinfo';
    if (own) b.textContent = s.rider === r.id ? '✓ Riding' : 'Tap to ride';
    else { b.textContent = '◉ ' + r.price + ' · Unlock'; b.classList.add(s.coins >= r.price ? 'buy' : 'no'); }
    $('tBest').innerHTML = '<span>Best <b>' + s.best.toLocaleString() + '</b></span><span>' + s.bestDist.toLocaleString() + ' m</span><span>' + s.topSpeed + ' mph</span><span class="gold">◉ ' + s.coins + '</span>';
    const dc = A.daily(), dv = s.daily && s.daily.id === dc.id ? (s.daily.bestVal || 0) : 0;
    $('tDaily').innerHTML = dc.done ? '<b>✓ Daily done</b> · ' + dc.text + ' · back tomorrow' : '<b>Daily</b> · ' + dc.text + ' · <span class="gold">◉ +' + dc.reward + '</span>' + (dv ? ' · best ' + dv : '');
    $('tDaily').classList.toggle('done', dc.done);
    const hr = new Date().getHours(); if (!dc.done && hr >= 18) $('tDaily').innerHTML += ' · <b>ends tonight</b>';
    const nx = A.RIDERS.find(r => !s.unlocked.includes(r.id));
    $('tNext').innerHTML = nx ? '<span>Next: ' + nx.name + ' ◉ ' + nx.price + '</span><i><b style="width:' + Math.min(100, s.coins / nx.price * 100).toFixed(0) + '%"></b></i>' : '<span>All riders unlocked ★</span>';
    const sk = s.streak && s.streak.n > 1 && s.streak.last >= A.yday() ? '🔥 ' + s.streak.n + '-day streak · ' : '';
    const gToday = s.ghost && s.ghost.seed === (+A.today().replace(/-/g, '') % 99991) * 7 + 13;
    $('tLife').textContent = [s.last && s.last.score ? 'Last run ' + s.last.score.toLocaleString() + ' · ' + s.last.dist + ' m' : '', sk.replace(/ · $/, ''), gToday && s.ghostOn ? '👻 beat ' + s.ghost.d + ' m' : '🏔 new mountain today', s.life.dist ? 'Lifetime ' + s.life.dist.toLocaleString() + ' m' : ''].filter(Boolean).join(' · ');
    const ph = A.PHASES[s.runs % 4], pb = s.phaseBest[ph];
    const tdy = s.today && s.today.id === A.today() ? s.today : null;
    $('tPhase').textContent = 'Run ' + (s.runs + 1) + ' · ' + ph + (pb ? ' · best ' + pb.toLocaleString() : '') + (tdy ? ' · today ' + tdy.best.toLocaleString() : '');
    const hr2 = new Date().getHours(), gr = hr2 < 5 ? 'Late laps' : hr2 < 12 ? 'Morning' : hr2 < 17 ? 'Afternoon' : 'Evening';
    $('tPhase').textContent = gr + ' · Run ' + (s.runs + 1) + ' · ' + ph + (pb ? ' · best ' + pb.toLocaleString() : '') + ' · ' + (s.view === 'fp' ? '👁 POV' : '🎥 Side') + (((s.viewBest || {})[s.view]) ? ' ' + s.viewBest[s.view].toLocaleString() : '');
    $('bPlay').innerHTML = '▶&nbsp; Drop in <small style="opacity:.5;font-size:10px;font-weight:700">Space</small>';
    ['tGhost', 'bGhost'].forEach(id => { $(id).classList.toggle('off', !s.ghostOn); $(id).title = 'Ghost ' + (s.ghostOn ? 'on' : 'off') + ' (G)'; });
    ['tView', 'bView'].forEach(id => { $(id).textContent = s.view === 'fp' ? '👁' : '🎥'; $(id).title = (s.view === 'fp' ? 'First-person' : 'Side view') + ' (V)'; });
    $('pGhost').textContent = '👻 Ghost: ' + (s.ghostOn ? 'On' : 'Off') + '  (G)'; $('pView').textContent = (s.view === 'fp' ? '👁 First-person' : '🎥 Side view') + '  (V)';
    const m = s.muted ? '🔇' : '🔊'; ['bMute', 'tMute'].forEach(id => { $(id).textContent = m; $(id).title = (s.muted ? 'Sound off' : 'Sound on') + ' (M)'; });
  };
  U.over = function (st) {
    $('oTitle').textContent = st.why === 'BURIED' ? 'BURIED' : 'WIPEOUT';
    $('oNew').classList.toggle('hidden', !st.newBest);
    const c = (l, v, w) => '<div' + (w ? ' class="wide"' : '') + '><small>' + l + '</small><b>' + v + '</b></div>';
    $('oGrid').innerHTML = c('Score', st.score.toLocaleString()) + c('Distance', st.dist.toLocaleString() + ' m') + c('Top speed', st.top + ' mph') + c('Coins', '◉ ' + st.coins) +
      (st.hist && st.hist.length > 1 ? '<div class="wide"><small>Last ' + st.hist.length + ' runs' + (st.prevAvg ? ' · ' + (st.score >= st.prevAvg ? '▲ above' : '▼ below') + ' avg ' + st.prevAvg.toLocaleString() : '') + '</small>' + spark(st.hist) + '</div>' : '') +
      (st.daily ? '<div class="wide dly' + (st.daily.won || st.daily.was ? ' ok' : '') + '"><small>Daily challenge</small><b>' + (st.daily.won ? '✓ Done! ◉ +' + st.daily.won : st.daily.was ? '✓ Already done today' : st.daily.val + ' / ' + st.daily.goal) + '</b> <span>' + st.daily.text + '</span></div>' : '') + c('Flips', st.flips || 0) + c('Best trick', st.trick.n ? st.trick.n + ' · ' + st.trick.p : '—', 1) + c('Airtime', st.air + ' s') + c('Close calls', st.near) + c('Perfect landings', st.perfects || 0) + c('Best today', (st.todayBest || st.score).toLocaleString()) + c((st.view === 'fp' ? 'POV' : 'Side') + ' best · run ' + (st.viewRuns || 1), (st.viewBest || st.score).toLocaleString()) + c(st.phase + ' best', (st.score > st.phasePrev && st.phasePrev ? '★ ' : '') + Math.max(st.score, st.phasePrev).toLocaleString()) + c('All-time best', A.save.best.toLocaleString()) + c('Lifetime perfects', (A.save.life.perfects || 0)) + c('Lifetime airtime', (A.save.life.air || 0) + ' s') + c('Streak', '🔥 ' + (st.streak || 1) + ' day' + (st.streak > 1 ? 's' : '')) + nextLine();
    $('bRetry').innerHTML = '↻&nbsp; Retry <small style="opacity:.55;font-size:11px">Space / R</small>';
    U.show('over');
  };
  function nextLine() { const s = A.save, nx = A.RIDERS.find(r => !s.unlocked.includes(r.id)); if (!nx) return ''; return '<div class="wide"><small>Next rider</small><b style="font-size:13px">' + (s.coins >= nx.price ? '🔓 ' + nx.name + ' is ready to unlock in Menu!' : nx.name + ': ◉ ' + (nx.price - s.coins) + ' to go') + '</b></div>'; }
  function spark(h) { const m = Math.max(1, ...h.map(r => r.score)); return '<svg viewBox="0 0 200 28" style="width:100%;height:28px;display:block">' + h.map((r, i) => { const w = 200 / h.length, bh = Math.max(2, r.score / m * 26); return '<rect x="' + (i * w + 1).toFixed(1) + '" y="' + (28 - bh).toFixed(1) + '" width="' + Math.max(1, w - 2).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="' + (i === h.length - 1 ? '#ffd166' : 'rgba(191,227,255,.55)') + '"/>'; }).join('') + '</svg>'; }
  let tt = 0; U.toast = function (txt) { let el = $('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.style.cssText = 'position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:9;padding:7px 14px;border-radius:14px;background:rgba(12,24,52,.62);backdrop-filter:blur(10px);color:#fff;font:700 12px -apple-system,system-ui,sans-serif;pointer-events:none;transition:opacity .3s'; document.body.appendChild(el); } el.textContent = txt; el.style.opacity = 1; clearTimeout(tt); tt = setTimeout(() => el.style.opacity = 0, 1400); };
  U.toggleMute = function () { A.save.muted = !A.save.muted; A.persist(); A.Audio.init(); A.Audio.setMute(A.save.muted); U.refresh(); U.toast(A.save.muted ? '🔇 Sound off' : '🔊 Sound on'); };
  U.toggleGhost = function () { G.setGhost(!A.save.ghostOn); U.refresh(); U.toast('👻 Ghost ' + (A.save.ghostOn ? 'on' : 'off')); };
  U.toggleView = function () { A.save.view = A.save.view === 'fp' ? 'side' : 'fp'; A.persist(); U.refresh(); U.toast(A.save.view === 'fp' ? '👁 First-person view' : '🎥 Side view'); };
  U.pick = function (d) { U.ri = (U.ri + d + A.RIDERS.length) % A.RIDERS.length; const r = A.RIDERS[U.ri]; if (A.save.unlocked.includes(r.id)) { A.save.rider = r.id; A.persist(); } U.refresh(); };
  U.buy = function () {
    const r = A.RIDERS[U.ri], s = A.save;
    if (s.unlocked.includes(r.id)) { s.rider = r.id; }
    else if (s.coins >= r.price) { s.coins -= r.price; s.unlocked.push(r.id); s.rider = r.id; A.Audio.init(); A.Audio.chime(3); }
    else return U.refresh();
    A.persist(); U.refresh();
  };
  const tap = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); fn(); });
  tap('bPlay', () => G.start()); tap('bRetry', () => G.start()); tap('bRestart', () => G.start());
  tap('bMenu', () => G.menu()); tap('bMenu2', () => G.menu()); tap('bResume', () => G.resume());
  tap('bPause', () => G.state === 'play' ? G.pause() : G.resume());
  tap('bMute', U.toggleMute); ['tGhost', 'bGhost', 'pGhost'].forEach(i => tap(i, U.toggleGhost)); ['tView', 'bView', 'pView'].forEach(i => tap(i, U.toggleView)); tap('tMute', U.toggleMute);
  tap('rPrev', () => U.pick(-1)); tap('rNext', () => U.pick(1)); tap('rInfo', U.buy);
  ['hud', 'title', 'pause', 'over'].forEach(id => $(id).addEventListener('pointerdown', e => { if (e.target.closest('button')) e.stopPropagation(); }));
  const rc = $('rc'), rg = rc.getContext('2d');
  U.frame = function () {
    if (G.state === 'title') {
      const t = G.t, r = A.RIDERS[U.ri];
      rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, 240, 150);
      rg.globalCompositeOperation = 'lighter'; rg.globalAlpha = .35; rg.drawImage(A.R.glow('190,225,255'), 40, 0, 160, 150); rg.globalAlpha = 1; rg.globalCompositeOperation = 'source-over';
      rg.fillStyle = 'rgba(255,255,255,.55)'; rg.beginPath(); rg.ellipse(120, 128, 70, 6, 0, 0, 7); rg.fill();
      rg.setTransform(2.1, 0, 0, 2.1, 120, 126);
      A.R.skier(rg, 0, 0, Math.sin(t * .8) * .04, { c: .25 + Math.sin(t * 2) * .08, pole: (t * .3) % 1, sp: 300, t }, r);
      if (!A.save.unlocked.includes(r.id)) { rg.setTransform(1, 0, 0, 1, 0, 0); rg.font = '22px system-ui'; rg.textAlign = 'center'; rg.fillText('🔒', 205, 30); }
    }
    if (G.state === 'play' || G.state === 'pause') {
      const p = G.p;
      $('hScore').textContent = G.score.toLocaleString();
      $('hMult').textContent = G.mult > 1 ? 'COMBO ×' + G.mult : '';
      $('hCombo').style.width = (G.mult > 1 ? Math.max(0, 1 - G.multT / 3.5) * 100 : 0) + '%';
      $('hDist').textContent = Math.floor(G.dist()).toLocaleString() + ' m';
      $('hSpd').textContent = Math.round((p.dead ? 0 : p.speed()) * .112) + ' mph';
      $('hCoin').textContent = '◉ ' + G.coins + (G.mag > 0 ? ' 🧲' + Math.ceil(G.mag) : '');
      const av = $('aval');
      if (G.aval && G.state === 'play') { av.classList.remove('hidden'); $('avalBar').style.width = Math.round(G.avalLevel * 100) + '%'; $('avalTxt').textContent = '⚠ AVALANCHE ' + Math.max(0, Math.round((G.p.x - G.aval.x) / 20)) + ' m'; }
      else av.classList.add('hidden');
    }
  };
  U.refresh();
})(window.App);
