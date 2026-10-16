(function (A) {
  const R = A.R, X = R.X3;
  // the lens and the HUD over the 3D frame: bloom pulled from the rendered image, a sun flare that tracks the
  // real sun, speed blur, goggle rim and droplets, the landing reticle, speedometer, hazard chip and radar
  let b1 = null, b2 = null; const drops = [];
  function bloom(g, W, H, a1, a2) {
    const w = Math.max(8, W / 8 | 0), h = Math.max(8, H / 8 | 0);
    if (!b1 || b1.width !== w || b1.height !== h) { b1 = R.mk(w, h); b2 = R.mk(w / 2, h / 2); }
    const x = b1.getContext('2d'), y = b2.getContext('2d');
    x.globalCompositeOperation = 'copy'; x.imageSmoothingQuality = 'high'; x.drawImage(X.cv, 0, 0, w, h);
    x.globalCompositeOperation = 'multiply'; x.drawImage(b1, 0, 0); x.drawImage(b1, 0, 0); x.drawImage(b1, 0, 0);
    y.globalCompositeOperation = 'copy'; y.drawImage(b1, 0, 0, b2.width, b2.height);
    g.save(); g.globalCompositeOperation = 'lighter'; g.imageSmoothingQuality = 'high';
    g.globalAlpha = a1; g.drawImage(b1, 0, 0, W, H); g.globalAlpha = a2; g.drawImage(b2, -W * .05, -H * .05, W * 1.1, H * 1.1); g.restore();
  }
  // o: { W, H, pal, p, T, k, rm, sun: {x, y, on}, hor }
  R.fp3Hud = function (g, G, dt, o) {
    const { W, H, pal, p, T, k, rm, sun } = o, t = G.t, cx = W / 2, gx = p.x, hor = o.hor;
    bloom(g, W, H, pal.night ? .5 : .16, pal.night ? .32 : .1);
    // sun / moon flare from where it really is in the sky
    if (sun.on && !p.dead) { const sx = sun.x, sy = sun.y, s = Math.min(W, H), lc = pal.night ? '170,195,255' : pal.sun, f = pal.night ? .45 : 1;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.globalAlpha = .55 * f; g.drawImage(R.glow(lc), sx - s * .3, sy - s * .3, s * .6, s * .6);
      [[.35, .1, .22], [.6, .05, .16], [1.25, .08, .12], [1.5, .03, .26]].forEach(e => { const fx = sx + (cx - sx) * e[0] * 2, fy = sy + (H * .5 - sy) * e[0] * 2; g.globalAlpha = e[2] * f; g.drawImage(R.glow(lc), fx - s * e[1], fy - s * e[1], s * e[1] * 2, s * e[1] * 2); });
      const fl = .85 + .15 * Math.sin(t * 1.3); g.globalAlpha = .38 * fl * f; g.drawImage(R.glow(lc), sx - W * 1.1, sy - 3, W * 2.2, 6); g.globalAlpha = .2 * fl * f; g.drawImage(R.glow('110,165,255'), sx - W * .8, sy - 9, W * 1.6, 18);
      g.restore(); }
    if (!p.dead) R.fpDirt(g, { W, H, pal: sun.on ? Object.assign({}, pal, { sp: [sun.x / W, sun.y / H] }) : Object.assign({}, pal, { sp: [-2, -2] }), cx });
    // speed: radial streaks, chromatic fringe, tunnel vignette
    if (k > .5 && !p.dead) { const kk = (k - .5) * 2 * rm; g.strokeStyle = 'rgba(255,255,255,' + (.26 * kk) + ')'; g.lineWidth = 1.2;
      for (let i = 0; i < 18; i++) { const a = A.hash(i * 3.7 + Math.floor(t * 12)) * Math.PI * 2, r0 = Math.max(W, H) * (.4 + A.hash(i + Math.floor(t * 12)) * .1), r1 = r0 + 60 + 140 * kk;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, hor + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, hor + Math.sin(a) * r1); g.stroke(); } }
    if (k > .6 && !p.dead) { const ck = (k - .6) * 2.5 * rm; g.globalCompositeOperation = 'lighter'; [[0, 1, '80,200,255'], [W, -1, '255,80,180']].forEach(e => { const gr = g.createLinearGradient(e[0], 0, e[0] + e[1] * W * .12, 0); gr.addColorStop(0, 'rgba(' + e[2] + ',' + (.16 * ck).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + e[2] + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }); g.globalCompositeOperation = 'source-over'; }
    if (k > .45 && !p.dead) { const vk = (k - .45) * 1.8 * rm, gr = g.createRadialGradient(cx, hor, Math.min(W, H) * (.5 - .15 * vk), cx, hor, Math.max(W, H) * .8); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(' + pal.fog + ',' + (.3 * vk).toFixed(3) + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (G.shake > 6 && !p.dead) { g.fillStyle = 'rgba(255,255,255,' + Math.min(.22, (G.shake - 6) * .03).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    if (p.dead) { g.fillStyle = 'rgba(255,255,255,' + Math.max(0, .5 - G.crashT * .4) + ')'; g.fillRect(0, 0, W, H); }
    // goggle lens: tinted, dark foam rim, thin-film sheen
    if (!p.dead) { const rd = A.rider(), gr = g.createRadialGradient(cx, H * .5, Math.min(W, H) * .45, cx, H * .5, Math.max(W, H) * .74); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.7, 'rgba(10,14,26,.14)'); gr.addColorStop(1, 'rgba(8,10,20,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .05; g.fillStyle = rd.goggle; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      R.fpGoggle(g, { W, H, cx, lean: (G.fpLean || 0) * W * .6 * rm, t, pal }); }
    // flakes landing on the lens, melting into beads
    if (!p.dead && G.state === 'play') { if (drops.length < 12 && Math.random() < dt * (1 + k * 3)) drops.push({ x: Math.random() * W, y: Math.random() * H * .7, r: 2 + Math.random() * 4, l: 1, sx: 0 });
      for (let i = drops.length - 1; i >= 0; i--) { const q = drops[i]; q.l -= dt * (.35 + k * .4); q.sx += k * 60 * dt; if (q.l <= 0) { drops.splice(i, 1); continue; } const x = q.x + (q.x < cx ? -q.sx : q.sx), y = q.y + (1 - q.l) * 10, a = Math.min(1, q.l * 2);
        g.globalAlpha = a * .45; g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x, y, q.r, 0, 7); g.fill(); g.globalAlpha = a * .8; g.fillStyle = '#fff'; g.beginPath(); g.arc(x - q.r * .35, y - q.r * .35, q.r * .3, 0, 7); g.fill(); }
      g.globalAlpha = 1; } else drops.length = 0;
    // avalanche powder pouring in at the edges
    const al = G.avalLevel || 0;
    if (al > 0) { [[0, 1], [W, -1]].forEach(e => { const gr = g.createLinearGradient(e[0], 0, e[0] + e[1] * W * .3, 0); gr.addColorStop(0, 'rgba(240,245,255,' + al * .7 + ')'); gr.addColorStop(1, 'rgba(240,245,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }); }
    if (p.dead || G.state !== 'play' && G.state !== 'pause') return;
    // landing reticle
    if (!p.ground && !p.rail && p.air > .15) {
      const la = Math.atan(T.slope(p.x + p.vx * .25)), df = A.wrapA(p.ang - la), ad = Math.abs(df), col = ad < .42 ? '120,255,170' : ad < 1 ? '255,210,90' : '255,90,80', ry = H * .5, rr = 26;
      g.save(); g.translate(cx, ry); g.strokeStyle = 'rgba(' + col + ',.85)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.stroke();
      g.rotate(df); g.lineWidth = 3; g.beginPath(); g.moveTo(-rr - 10, 0); g.lineTo(-rr + 6, 0); g.moveTo(rr - 6, 0); g.lineTo(rr + 10, 0); g.stroke(); g.restore();
      g.fillStyle = 'rgba(' + col + ',.95)'; g.font = '800 10px -apple-system,system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(ad < .42 ? 'LAND IT' : ad < 1 ? 'LEVEL OUT' : 'TOO ROTATED', cx, ry + rr + 16);
      const f2 = Math.abs(p.rot) / (2 * Math.PI); if (f2 > .15) { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'italic 900 13px -apple-system,system-ui,sans-serif'; g.fillText((p.rot < 0 ? '↺ ' : '↻ ') + Math.round(Math.abs(p.rot) * 57.3) + '°', cx, ry - rr - 10); } }
    // speedometer
    { const sp = p.speed(), mph = Math.round(sp * .112), gk = Math.min(1, sp / 1400), gy2 = H - 14; g.lineCap = 'round'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,20,45,.35)'; g.beginPath(); g.arc(cx, gy2, 30, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.strokeStyle = gk > .8 ? '#ff8a5c' : '#bfe3ff'; g.beginPath(); g.arc(cx, gy2, 30, Math.PI * 1.1, Math.PI * (1.1 + .8 * gk)); g.stroke();
      if (p.ground && p.hold > 0) { const hk = Math.min(1, p.hold / .6); g.lineWidth = 3; g.strokeStyle = hk >= 1 ? '#c8ffda' : 'rgba(255,230,140,.9)'; g.beginPath(); g.arc(cx, gy2, 23, Math.PI * 1.1, Math.PI * (1.1 + .8 * hk)); g.stroke(); }
      g.fillStyle = '#fff'; g.font = 'italic 900 15px -apple-system,system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(mph, cx, gy2 - 6); g.font = '700 7px system-ui'; g.fillText('MPH', cx, gy2 + 3); }
    // next hazard chip
    let nh = null; for (const ob of T.objs) { if (ob.hit || ob.k === 'coin' || ob.k === 'mag') continue; const z = ob.x - gx; if (z > 10 && z < 900 && (!nh || z < nh.z)) nh = { z, k: ob.k }; }
    if (nh) { const m = Math.round(nh.z / 20), urg = nh.z < 300, lbl = (nh.k === 'yeti' ? 'YETI' : nh.k.toUpperCase()) + ' ' + m + ' m' + (urg ? ' · JUMP!' : ''); g.font = '800 11px -apple-system,system-ui,sans-serif'; const w = g.measureText(lbl).width + 20;
      g.fillStyle = urg ? 'rgba(200,40,40,' + (.55 + .25 * Math.sin(t * 14)) + ')' : 'rgba(10,25,55,.5)'; g.beginPath(); g.roundRect ? g.roundRect(cx - w / 2, 54, w, 22, 11) : g.rect(cx - w / 2, 54, w, 22); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(lbl, cx, 69); }
    if (G.runT < 6 && ((A.save.viewRuns || {}).fp || 0) < 6) { g.globalAlpha = Math.min(1, (6 - G.runT) / 1.5); g.font = '700 11px -apple-system,system-ui,sans-serif'; const tx = 'Hold = tuck · Release = jump · ↓ carve · ←/→ flip', w = g.measureText(tx).width + 22;
      g.fillStyle = 'rgba(10,25,55,.55)'; g.beginPath(); g.roundRect ? g.roundRect(cx - w / 2, H * .62, w, 24, 12) : g.rect(cx - w / 2, H * .62, w, 24); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(tx, cx, H * .62 + 16); g.globalAlpha = 1; }
    // terrain profile radar
    { const bw = 92, bh = 30, bx = 10, by = H - bh - 10, n = 30; g.fillStyle = 'rgba(10,25,55,.45)'; g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, 8) : g.rect(bx, by, bw, bh); g.fill();
      const gY = T.h(gx), ys = []; let mn = 1e9, mx = -1e9; for (let i = 0; i <= n; i++) { const v = T.h(gx + i * 40) - gY - .3 * i * 40; ys.push(v); mn = Math.min(mn, v); mx = Math.max(mx, v); }
      const sc = (bh - 10) / Math.max(40, mx - mn); g.strokeStyle = 'rgba(220,240,255,.9)'; g.lineWidth = 1.5; g.beginPath(); ys.forEach((v, i) => g.lineTo(bx + 4 + i * (bw - 8) / n, by + 5 + (v - mn) * sc)); g.stroke();
      for (const ob of T.objs) { if (ob.hit || ob.got || ob.k === 'coin' || ob.k === 'mag') continue; const z = ob.x - gx; if (z < 0 || z > 1200) continue; g.fillStyle = '#ff6a55'; g.beginPath(); g.arc(bx + 4 + z / 40 * (bw - 8) / n, by + 5 + (T.h(ob.x) - gY - .3 * z - mn) * sc - 2, 2.2, 0, 7); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx + 4, by + 5 + (p.y - gY - mn) * sc, 2.5, 0, 7); g.fill(); }
  };
})(window.App);
