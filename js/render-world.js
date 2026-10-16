(function (A) {
  const R = A.R;
  R.skier = function (g, x, y, ang, P, rd) {
    const c = P.c || 0, tk = P.tuck ? 1 : 0, gb = P.grab ? 1 : 0, t = P.t || 0, dk = R.shade;
    g.save(); g.translate(x, y); g.rotate(ang); g.lineCap = 'round'; g.lineJoin = 'round';
    const ski = (dx, dy, col) => { g.strokeStyle = col; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-27 + dx, -1.6 + dy); g.lineTo(23 + dx, -1.6 + dy); g.quadraticCurveTo(30 + dx, -1.6 + dy, 31 + dx, -7 + dy); g.stroke(); };
    const cc = Math.max(c, gb * .95);
    const hip = { x: -5 - 7 * cc, y: -27 + 12 * cc }, knee = { x: 5 + 4 * cc, y: -15 + 5 * cc }, ank = { x: 0, y: -4 };
    const sh = { x: hip.x + 6 + 9 * cc + tk * 3, y: hip.y - 16 + 6 * cc + tk * 2 };
    const hd = { x: sh.x + 4 + 3 * cc, y: sh.y - 8.5 + 2 * cc + tk }, nk = { x: sh.x + 1.5, y: sh.y - 2.5 };
    const leg = (ox, col, bc) => {
      g.strokeStyle = col; g.lineWidth = 6.5; g.beginPath(); g.moveTo(hip.x + ox, hip.y); g.lineTo(knee.x + ox, knee.y); g.lineTo(ank.x + ox, ank.y); g.stroke();
      g.strokeStyle = bc; g.lineWidth = 6; g.beginPath(); g.moveTo(ank.x + ox - 1.5, ank.y + .5); g.lineTo(ank.x + ox + 3, ank.y + 1); g.stroke();
    };
    let hand, pole;
    const sw = Math.sin(P.pole * Math.PI * 2);
    if (gb) { hand = { x: 17, y: -5 }; pole = null; }
    else if (tk) { hand = { x: sh.x + 9, y: sh.y + 4 }; pole = { x: hand.x - 34, y: hand.y - 3 }; }
    else if (P.air) { hand = { x: sh.x + 7, y: sh.y + 10 }; pole = { x: hand.x - 22, y: hand.y + 16 }; }
    else { hand = { x: sh.x + 9 + sw * 3, y: sh.y + 11 - Math.max(0, sw) * 2 }; pole = { x: hand.x - 12 + sw * 14, y: 1 }; }
    const arm = (h, p, col, pc) => {
      const el = { x: (sh.x + h.x) / 2 + 1, y: (sh.y + h.y) / 2 + 3 };
      if (p) { g.strokeStyle = pc; g.lineWidth = 1.6; g.beginPath(); g.moveTo(h.x + 1, h.y - 2); g.lineTo(p.x, p.y); g.stroke(); }
      g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(el.x, el.y); g.lineTo(h.x, h.y); g.stroke();
      g.fillStyle = '#20232b'; g.beginPath(); g.arc(h.x, h.y, 2.4, 0, 7); g.fill();
    };
    // back side
    arm({ x: hand.x - 4, y: hand.y + 1 }, pole ? { x: pole.x - 4, y: pole.y } : null, dk(rd.jacket, .62), '#8b95a3');
    ski(-3, -1.2, dk(rd.skis, .6));
    leg(-3, dk(rd.pants, .62), '#181b22');
    ski(0, 0, rd.skis);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-24, -2.8); g.lineTo(20, -2.8); g.stroke();
    leg(0, rd.pants, '#262a33');
    // torso
    g.strokeStyle = rd.jacket; g.lineWidth = 10.5; g.beginPath(); g.moveTo(hip.x, hip.y); g.lineTo(sh.x, sh.y); g.stroke();
    g.strokeStyle = dk(rd.jacket, 1.35); g.lineWidth = 2.2; g.beginPath(); g.moveTo(hip.x + 1, hip.y - 4); g.lineTo(sh.x + 2.5, sh.y - 1); g.stroke();
    // scarf
    const L = .55 + Math.min(1.2, (P.sp || 0) / 900);
    g.strokeStyle = rd.scarf; g.lineWidth = 3; g.beginPath(); g.moveTo(nk.x, nk.y);
    for (let i = 1; i <= 4; i++) g.lineTo(nk.x - i * 5.5 * L, nk.y + i * 1.3 + Math.sin(t * 15 - i * 1.4) * i * .9);
    g.stroke();
    // head
    g.fillStyle = '#f0c3a0'; g.beginPath(); g.arc(hd.x, hd.y, 5.6, 0, 7); g.fill();
    g.fillStyle = rd.helmet; g.beginPath(); g.arc(hd.x - .4, hd.y - .3, 6.3, Math.PI * .92, Math.PI * 2.1); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(hd.x - 1.5, hd.y - 3.2, 2.2, Math.PI, Math.PI * 1.8); g.fill();
    const gg = g.createLinearGradient(hd.x, hd.y - 2, hd.x, hd.y + 2);
    gg.addColorStop(0, rd.goggle); gg.addColorStop(1, dk(rd.goggle, .45));
    g.fillStyle = gg; g.beginPath(); g.roundRect ? g.roundRect(hd.x + .5, hd.y - 1.8, 6.2, 3.8, 1.6) : g.rect(hd.x + .5, hd.y - 1.8, 6.2, 3.8); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(hd.x + 4, hd.y - 1.2, 1.4, 1);
    arm(hand, pole, rd.jacket, '#c9d2dc');
    g.restore();
  };
  function part(g, p) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.ang); g.lineCap = 'round';
    if (p.k === 'head') {
      g.fillStyle = '#f0c3a0'; g.beginPath(); g.arc(0, 0, 5.6, 0, 7); g.fill();
      g.fillStyle = p.col; g.beginPath(); g.arc(0, 0, 6.3, Math.PI, Math.PI * 2); g.fill();
    } else {
      g.strokeStyle = p.col; g.lineWidth = { torso: 10, arm: 5, leg: 6.5, ski: 3.2, pole: 1.6 }[p.k];
      g.beginPath(); g.moveTo(-p.len / 2, 0); g.lineTo(p.len / 2, 0); if (p.k === 'ski') g.quadraticCurveTo(p.len / 2 + 6, 0, p.len / 2 + 7, -5); g.stroke();
    }
    g.restore();
  }
  function drawObj(g, o, t, pal) {
    const x = o.x, y = o.y;
    if (o.k === 'mag') { if (o.got) return; const b = Math.sin(t * 3 + x) * 3; g.globalCompositeOperation = 'lighter'; g.globalAlpha = .8; g.drawImage(R.glow('120,200,255'), x - 26, y - 26 + b, 52, 52); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#e8574a'; g.lineWidth = 4; g.lineCap = 'butt'; g.beginPath(); g.arc(x, y + b, 7, Math.PI, 0); g.stroke(); g.strokeStyle = '#f4f1ea'; g.beginPath(); g.moveTo(x - 7, y + b); g.lineTo(x - 7, y + 4 + b); g.moveTo(x + 7, y + b); g.lineTo(x + 7, y + 4 + b); g.stroke(); return; }
    if (o.k === 'coin') {
      if (o.got) return;
      const w = Math.abs(Math.cos(t * 4 + x * .01));
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55; g.drawImage(R.glow('255,200,80'), x - 18, y - 18, 36, 36);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#e8a521'; g.beginPath(); g.ellipse(x, y, 7 * w + 1, 7, 0, 0, 7); g.fill();
      g.fillStyle = '#ffd860'; g.beginPath(); g.ellipse(x - w, y - .5, 5 * w + .6, 5.4, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x - 2 * w - .5, y - 3.5, 1.2, 3);
      return;
    }
    g.fillStyle = 'rgba(20,30,60,.22)'; g.beginPath(); g.ellipse(x, y + 1, o.r * 1.3, 3.5, 0, 0, 7); g.fill();
    if (o.k === 'rock') {
      g.fillStyle = pal.rock; g.beginPath(); g.moveTo(x - 16, y + 2); g.quadraticCurveTo(x - 14, y - 14, x - 2, y - 17); g.quadraticCurveTo(x + 12, y - 16, x + 17, y + 2); g.fill();
      g.fillStyle = R.shade(pal.rock, 1.35); g.beginPath(); g.moveTo(x - 12, y - 7); g.quadraticCurveTo(x - 6, y - 17, x + 4, y - 16); g.lineTo(x - 2, y - 9); g.fill();
      g.fillStyle = pal.snow; g.beginPath(); g.ellipse(x - 2, y - 15, 8, 3, -.1, 0, 7); g.fill();
    } else if (o.k === 'tree') {
      g.drawImage(R.trees[3], x - 14, y - 58, 28, 60);
    } else if (o.k === 'snowman') {
      const b = (r, yy) => { g.fillStyle = pal.snow; g.beginPath(); g.arc(x, yy, r, 0, 7); g.fill(); g.fillStyle = 'rgba(80,110,160,.18)'; g.beginPath(); g.arc(x + r * .25, yy + r * .2, r * .85, -.3, 2.4); g.fill(); };
      b(11, y - 10); b(8, y - 26); b(6, y - 38);
      g.fillStyle = '#d23c3c'; g.fillRect(x - 6, y - 33, 12, 3);
      g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(x + 4, y - 39); g.lineTo(x + 11, y - 37.5); g.lineTo(x + 4, y - 36.5); g.fill();
      const bl = (Math.sin(t * 1.3 + x) > .97) ? .3 : 1.4;
      g.fillStyle = '#1b1e26'; g.fillRect(x + 1, y - 41, 1.6, bl); g.fillRect(x + 4, y - 41, 1.6, bl);
      g.fillStyle = '#20232b'; g.fillRect(x - 5, y - 47, 10, 4); g.fillRect(x - 7, y - 44, 14, 1.6);
    } else if (o.k === 'yeti') {
      const bob = Math.sin(t * 8 + x) * 1.5, wave = Math.sin(t * 6 + x) * .6;
      g.fillStyle = '#e9f0f7';
      g.beginPath(); g.ellipse(x, y - 24 + bob, 14, 22, 0, 0, 7); g.fill();
      g.strokeStyle = '#e9f0f7'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - 10, y - 32 + bob); g.lineTo(x - 18, y - 46 + bob + wave * 8); g.moveTo(x + 10, y - 32 + bob); g.lineTo(x + 19, y - 44 + bob - wave * 8); g.stroke();
      g.fillStyle = '#9cc6e8'; g.beginPath(); g.ellipse(x - 2, y - 36 + bob, 7, 6, 0, 0, 7); g.fill();
      g.fillStyle = '#1b2230'; g.beginPath(); g.arc(x - 5, y - 38 + bob, 1.4, 0, 7); g.arc(x + 1, y - 38 + bob, 1.4, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(x - 5, y - 33 + bob, 6, 1.5);
      g.fillStyle = 'rgba(110,150,200,.25)'; g.beginPath(); g.ellipse(x + 5, y - 20 + bob, 8, 16, 0, 0, 7); g.fill();
    }
  }
  function lodge(g, L, t, pal, T) {
    const s = L.s, x = L.x, y = T.h(x) + 8;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#6b4130'; g.fillRect(-46, -44, 92, 44);
    g.fillStyle = '#56331f'; for (let i = 0; i < 5; i++) g.fillRect(-46, -40 + i * 8, 92, 1.5);
    g.fillStyle = '#3b2d2a'; g.fillRect(22, -82, 10, 26);
    g.fillStyle = pal.snow; g.beginPath(); g.moveTo(-58, -40); g.lineTo(0, -80); g.lineTo(58, -40); g.lineTo(52, -36); g.lineTo(0, -70); g.lineTo(-52, -36); g.closePath(); g.fill();
    g.fillStyle = '#4b2d22'; g.beginPath(); g.moveTo(-52, -36); g.lineTo(0, -70); g.lineTo(52, -36); g.lineTo(-52, -36); g.fill();
    const lit = pal.night || R.key === 'sunset';
    g.fillStyle = lit ? '#ffcf7a' : '#3a4a5e';
    [[-34, -30], [-10, -30], [16, -30], [-4, -58]].forEach(w => g.fillRect(w[0], w[1], 14, 12));
    if (lit) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6 + .1 * Math.sin(t * 7);
      [[-34, -30], [-10, -30], [16, -30], [-4, -58]].forEach(w => g.drawImage(R.glow('255,170,80'), w[0] - 20, w[1] - 20, 54, 52));
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    g.fillStyle = 'rgba(220,230,240,.35)';
    for (let i = 0; i < 5; i++) { const k = (t * .4 + i / 5) % 1; g.beginPath(); g.arc(27 + Math.sin(k * 6 + i) * 6 - k * 20, -86 - k * 60, 4 + k * 10, 0, 7); g.globalAlpha = .4 * (1 - k); g.fill(); }
    g.globalAlpha = 1; g.restore();
  }
  R.drawWorld = function (g, G, dt) {
    const W = R.W, H = R.H, z = G.zoom, T = G.terr, pal = R.pal, t = G.t;
    const x0 = G.cam.x - W * .38 / z - 60, x1 = x0 + W / z + 140, yb = G.cam.y + H * .7 / z + 300;
    for (const L of T.lodges) if (L.x > x0 - 100 && L.x < x1 + 100) lodge(g, L, t, pal, T);
    const pts = [];
    for (let x = Math.floor(x0 / 8) * 8; x <= x1; x += 8) pts.push(x, T.h(x));
    g.beginPath(); g.moveTo(pts[0], yb);
    for (let i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.lineTo(pts[pts.length - 2], yb); g.closePath();
    g.fillStyle = pal.shade; g.fill();
    g.save(); g.clip();
    const surf = () => { g.beginPath(); for (let i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); };
    surf(); g.strokeStyle = pal.snow; g.lineJoin = 'round';
    [[260, .25], [150, .3], [80, .4], [36, .6], [12, 1]].forEach(s => { g.lineWidth = s[0]; g.globalAlpha = s[1]; g.stroke(); });
    g.globalAlpha = 1;
    // rock faces
    g.fillStyle = pal.rock;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const s = (pts[i + 3] - pts[i + 1]) / 8;
      if (s > 1.5) { const xa = pts[i], ya = pts[i + 1], xb = pts[i + 2], yb2 = pts[i + 3];
        g.beginPath(); g.moveTo(xa, ya + 4); g.lineTo(xb, yb2 + 4); g.lineTo(xb - 34, yb2 + 30); g.lineTo(xa - 34, ya + 30); g.fill(); }
    }
    g.restore();
    // trail
    g.strokeStyle = R.shade(pal.shade, 1.1); g.lineWidth = 1.6; g.globalAlpha = .7; g.beginPath();
    let pen = false; for (const p of G.trail) { if (!p) { pen = false; continue; } if (pen) g.lineTo(p.x, p.y + 1.5); else { g.moveTo(p.x, p.y + 1.5); pen = true; } }
    g.stroke(); g.globalAlpha = 1;
    // rim + ice + powder
    surf(); g.strokeStyle = pal.rim; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ty = T.type(pts[i]);
      if (ty === 1) { g.strokeStyle = 'rgba(150,215,255,.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(pts[i], pts[i + 1] + 1); g.lineTo(pts[i + 2], pts[i + 3] + 1); g.stroke();
        if (A.hash(pts[i] * .1) > .8) { g.fillStyle = 'rgba(255,255,255,' + (.5 + .5 * Math.sin(t * 5 + pts[i])) + ')'; g.fillRect(pts[i], pts[i + 1] - .5, 6, 1.2); } }
      else if (ty === 2) { const h = A.hash(pts[i] * .37); g.fillStyle = pal.snow; g.beginPath(); g.arc(pts[i], pts[i + 1] + 3, 6 + h * 5, Math.PI, 0); g.fill(); }
    }
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pts.length; i += 2) {
      const h = A.hash(pts[i] * 1.7); if (h < .62) continue;
      const tw = Math.pow(Math.max(0, Math.sin(t * 2.5 + h * 40)), 10);
      if (tw < .05) continue;
      const sx = pts[i] + h * 8, sy = pts[i + 1] + 2 + h * 6;
      g.globalAlpha = tw; g.drawImage(R.glow('220,240,255'), sx - 5, sy - 5, 10, 10);
      g.fillStyle = '#fff'; g.fillRect(sx - 3 * tw, sy - .4, 6 * tw, .8); g.fillRect(sx - .4, sy - 3 * tw, .8, 6 * tw);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // rails
    for (const r of T.rails) {
      if (r.x2 < x0 || r.x1 > x1) continue;
      g.strokeStyle = '#3b4352'; g.lineWidth = 3;
      for (let x = r.x1 + 10; x < r.x2; x += 90) { const ry = r.y1 + (x - r.x1) * r.m; g.beginPath(); g.moveTo(x, ry); g.lineTo(x, T.h(x) + 2); g.stroke(); }
      g.lineCap = 'round'; g.strokeStyle = '#8f9bb0'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(r.x1, r.y1); g.lineTo(r.x2, r.y2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r.x1, r.y1 - 1.2); g.lineTo(r.x2, r.y2 - 1.2); g.stroke();
    }
    const bd = A.save.bestDist; if (!G.demo && bd > 50) { const bx = G.x0 + bd * 20; if (bx > x0 && bx < x1) { const by = T.h(bx); g.strokeStyle = '#e9eef5'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - 70); g.stroke(); g.fillStyle = G.passedBest ? '#5fe39a' : '#ff5a6a'; g.beginPath(); g.moveTo(bx, by - 70); g.lineTo(bx + 30, by - 62); g.lineTo(bx, by - 54); g.fill(); g.fillStyle = '#fff'; g.font = '800 9px system-ui'; g.textAlign = 'left'; g.fillText('BEST ' + bd + 'm', bx + 4, by - 76); } }
    for (const o of T.objs) if (o.x > x0 - 40 && o.x < x1 + 40) drawObj(g, o, t, pal);
    if (G.aval) R.drawAval(g, G);
    const gh = G.ghost; if (gh && !G.demo) { const i = Math.floor((G.runT || 0) / .25) * 3; if (i + 2 < gh.p.length) { const gx = G.x0 + gh.p[i], gy = T.h(gx) + gh.p[i + 1]; if (gx > x0 && gx < x1) { g.globalAlpha = .35; R.skier(g, gx, gy, gh.p[i + 2], { c: .3, pole: 0, sp: 400, t, air: gh.p[i + 1] < -4 }, { jacket: '#bfe3ff', pants: '#8fb0d8', helmet: '#ffffff', goggle: '#9fe7ff', skis: '#dff3ff', scarf: '#ffffff' }); g.globalAlpha = .8; g.fillStyle = '#e6f4ff'; g.font = '800 8px system-ui'; g.textAlign = 'center'; g.fillText('GHOST', gx, gy - 52); g.globalAlpha = 1; } } }
    const p = G.p;
    if (p.dead && p.parts) p.parts.forEach(q => part(g, q));
    else {
      const a = Math.atan(T.slope(p.x));
      if (p.ground) { g.fillStyle = 'rgba(20,30,70,.25)'; g.beginPath(); g.ellipse(p.x, p.y + 1, 26, 3, a, 0, 7); g.fill(); }
      R.skier(g, p.x, p.y, p.ang, { c: p.crouch, tuck: p.tuck && (p.ground || p.rail), grab: p.grab, pole: p.pole, sp: p.speed(), t, air: !p.ground && !p.rail }, A.rider());
    }
    for (const q of G.parts) {
      if (q.k === 2) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = q.l / q.ml; g.drawImage(R.glow(q.c), q.x - q.s, q.y - q.s, q.s * 2, q.s * 2); g.globalCompositeOperation = 'source-over'; }
      else { g.globalAlpha = Math.min(1, q.l / q.ml * 1.4) * .85; g.fillStyle = q.k === 1 ? pal.snow : '#ffffff'; g.beginPath(); g.arc(q.x, q.y, q.s, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
    if (pal.night && !p.dead) {
      const hx = p.x + Math.cos(p.ang - .9) * 40, hy = p.y + Math.sin(p.ang - .9) * 40, d = p.ang + .25;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(hx, hy, 2, hx, hy, 230);
      gr.addColorStop(0, 'rgba(255,236,190,.42)'); gr.addColorStop(1, 'rgba(255,236,190,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(hx, hy); g.arc(hx, hy, 230, d - .32, d + .32); g.closePath(); g.fill();
      g.globalAlpha = .9; g.drawImage(R.glow('255,240,200'), hx - 9, hy - 9, 18, 18);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  };
  R.drawObj = drawObj; R.lodge = lodge;
  R.drawWarn = function (g, G) {
    const W = R.W, H = R.H, z = G.zoom, an = G.anchor || .38, T = G.terr, M = 560;
    const ic = { rock: '◆', tree: '▲', snowman: '☃', yeti: '!', lodge: '⌂' };
    const show = (x, y, k) => { const sx = W * an + (x - G.cam.x) * z; if (sx < W + 4 || sx > W + M) return; const a = 1 - (sx - W) / M, sy = A.clamp(H * .45 + (y - G.cam.y) * z - 20, 80, H - 40);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (.5 + .3 * Math.sin(G.t * 10)); g.drawImage(R.glow(k === 'lodge' ? '255,200,120' : '255,110,80'), W - 30, sy - 20, 40, 40); g.globalCompositeOperation = 'source-over';
      g.globalAlpha = .55 + .45 * a; g.fillStyle = 'rgba(15,25,50,.6)'; g.beginPath(); g.arc(W - 12, sy, 9, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 10px system-ui'; g.textAlign = 'center'; g.fillText(ic[k] || '!', W - 12, sy + 3.5); g.globalAlpha = 1; };
    for (const o of T.objs) if (ic[o.k] && !o.hit) show(o.x, o.y - o.h, o.k);
    for (const L of T.lodges) show(L.x, T.h(L.x) - 40, 'lodge');
  };
  R.drawAval = function (g, G) {
    const a = G.aval, T = G.terr, t = G.t, pal = R.pal;
    for (let i = 30; i >= 0; i--) {
      const x = a.x - i * 26 - A.hash(i) * 20, gy = T.h(x);
      const r = (70 + A.hash(i * 3) * 70) * (1 - i / 45) + Math.sin(t * 5 + i) * 6;
      const y = gy - r * .5 - Math.abs(Math.sin(t * 3 + i * .7)) * 10;
      g.fillStyle = pal.shade; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = pal.snow; g.beginPath(); g.arc(x - r * .15, y - r * .18, r * .82, 0, 7); g.fill();
    }
  };
  R.draw = function (g, G, dt) {
    const W = R.W, H = R.H, d = R.dpr, z = G.zoom;
    g.setTransform(d, 0, 0, d, 0, 0); g.imageSmoothingQuality = 'high';
    if (A.save.view === 'fp' && !G.demo) { g.clearRect(0, 0, W, H); if (!R.drawFP3 || !R.drawFP3(g, G, dt)) R.drawFP(g, G, dt); } else {
    if (R.fp3Hide) R.fp3Hide();
    R.drawSky(g, G, G.t); R.drawMountains(g, G, G.t);
    const sx = (Math.random() - .5) * G.shake * 2, sy = (Math.random() - .5) * G.shake * 2;
    g.setTransform(d * z, 0, 0, d * z, d * (W * (G.anchor || .38) - G.cam.x * z + sx), d * (H * .45 - G.cam.y * z + sy));
    R.drawWorld(g, G, dt);
    g.setTransform(d, 0, 0, d, 0, 0);
    if (R.pal.night) { g.fillStyle = 'rgba(6,10,28,.18)'; g.fillRect(0, 0, W, H); }
    R.drawFg(g, G);
    R.drawFlakes(g, G, dt);
    const sp = G.p.dead ? 0 : G.p.speed();
    if (sp > 720) {
      const k = Math.min(1, (sp - 720) / 500); g.strokeStyle = 'rgba(255,255,255,' + (.35 * k) + ')'; g.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const y = A.hash(i * 7.3 + Math.floor(G.t * 9)) * H, x = A.hash(i * 3.1 + Math.floor(G.t * 9)) * W, l = 40 + 120 * k;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - l, y - l * .25); g.stroke(); }
    }
    if (!G.demo && !G.p.dead && G.state === 'play') R.drawWarn(g, G);
    }
    if (G.ts < .9) { g.fillStyle = 'rgba(120,170,255,' + ((1 - G.ts) * .12) + ')'; g.fillRect(0, 0, W, H); }
    g.drawImage(R.vig, 0, 0, W, H);
    g.globalAlpha = .045; g.globalCompositeOperation = 'overlay';
    const ox = Math.random() * 128, oy = Math.random() * 128;
    for (let x = -ox; x < W; x += 128) for (let y = -oy; y < H; y += 128) g.drawImage(R.grain, x, y);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (G.mag > 0 && !G.p.dead) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .25 + .1 * Math.sin(G.t * 8); g.drawImage(R.glow('120,200,255'), W * .38 - 60, H * .45 - 80, 120, 120); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (G.cd > 0 && !G.demo && G.state === 'play') { const n = Math.ceil(G.cd / .55), f = (G.cd % .55) / .55; g.save(); g.textAlign = 'center'; g.globalAlpha = Math.min(1, f * 2); g.font = 'italic 900 ' + (48 + 20 * f) + 'px -apple-system,system-ui,sans-serif'; g.lineWidth = 5; g.strokeStyle = 'rgba(15,30,70,.5)'; g.strokeText(n > 0 ? n : 'GO', W / 2, H * .62); g.fillStyle = '#fff'; g.fillText(n > 0 ? n : 'GO', W / 2, H * .62); g.restore(); }
    R.drawPops(g, G);
    if (G.hint > 0 && G.cd <= 0 && G.state === 'play' && !G.p.dead) { const p = G.p, msg = p.ground ? 'Hold to tuck · release to jump' : 'Hold in air to flip · ↓ to grab'; g.save(); g.globalAlpha = Math.min(1, G.hint) * .9; g.font = '700 12px -apple-system,system-ui,sans-serif'; const w = g.measureText(msg).width + 24; g.fillStyle = 'rgba(10,25,55,.55)'; g.beginPath(); g.roundRect ? g.roundRect(W / 2 - w / 2, H - 46, w, 26, 13) : g.rect(W / 2 - w / 2, H - 46, w, 26); g.fill(); g.fillStyle = '#eaf4ff'; g.textAlign = 'center'; g.fillText(msg, W / 2, H - 29); g.restore(); }
  };
  R.drawPops = function (g, G) {
    const W = R.W;
    g.textAlign = 'center';
    G.pops.forEach((p, i) => {
      const k = Math.min(1, p.t / .25), e = 1 + (1 - k) * .6 * Math.sin(k * Math.PI), al = Math.min(1, (p.d - p.t) / .4);
      const y = 118 + i * 34 - p.t * 10;
      g.save(); g.globalAlpha = Math.max(0, al); g.translate(W / 2, y); g.scale(e, e);
      g.font = 'italic 900 ' + (p.big ? 22 : 17) + 'px -apple-system,system-ui,sans-serif';
      g.lineWidth = 4; g.strokeStyle = 'rgba(15,30,70,.55)'; g.strokeText(p.txt, 0, 0);
      g.fillStyle = p.col || '#ffffff'; g.fillText(p.txt, 0, 0);
      if (p.sub) { g.font = '800 12px -apple-system,system-ui,sans-serif'; g.strokeText(p.sub, 0, 16); g.fillStyle = '#ffd166'; g.fillText(p.sub, 0, 16); }
      g.restore();
    });
  };
})(window.App);
