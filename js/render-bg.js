(function (A) {
  const R = A.R = A.R || {};
  const PAL = {
    day: { sky: ['#2f6fc4', '#7fb4e6', '#dbeaf5'], sun: '255,244,214', sp: [.8, .2], mtn: ['#c6d6ec', '#97afd2', '#6f8db6', '#456589'], pine: ['#5a7f9c', '#2c5560'], cap: '#f7fbff', snow: '#f5f9fd', shade: '#9fb6d6', rim: '#ffffff', rock: '#5c6474', fog: '220,232,246', rays: .07, night: 0, fg: '#152635' },
    sunset: { sky: ['#2a2a62', '#b9557b', '#ffb57e'], sun: '255,178,110', sp: [.72, .5], mtn: ['#e9aaa7', '#b37c99', '#7c5a85', '#4e3f69'], pine: ['#6f5280', '#33294b'], cap: '#ffe9de', snow: '#ffe8dd', shade: '#a881a8', rim: '#ffd0a0', rock: '#4d3c55', fog: '250,185,165', rays: .14, night: .12, fg: '#1a1229' },
    night: { sky: ['#040817', '#0c1834', '#22385d'], sun: '210,225,255', sp: [.76, .17], mtn: ['#33466e', '#273959', '#1d2b46', '#141f35'], pine: ['#1f3556', '#0f1c33'], cap: '#bccbea', snow: '#a9bde0', shade: '#3d5181', rim: '#d7e6ff', rock: '#1e2638', fog: '40,62,105', rays: 0, night: 1, moon: 1, fg: '#04070e' },
    aurora: { sky: ['#020c14', '#082634', '#14465a'], sun: '200,255,230', sp: [.2, .15], mtn: ['#26495d', '#1c394b', '#142c3b', '#0e202c'], pine: ['#1a3a42', '#0b1f27'], cap: '#b5e2e0', snow: '#a6d6d8', shade: '#2f5a6e', rim: '#d8fff4', rock: '#16242c', fog: '30,85,95', rays: 0, night: 1, moon: 1, aurora: 1, fg: '#02070a' }
  };
  const KEYS = ['day', 'sunset', 'night', 'aurora'];
  const LAY = [
    { p: .03, b: .52, a: .34, f: .0032, ridged: 1, cap: .62 },
    { p: .08, b: .6, a: .22, f: .0055, ridged: 1, cap: .7 },
    { p: .18, b: .7, a: .12, f: .008, trees: .55, ts: .32 },
    { p: .32, b: .8, a: .1, f: .011, trees: .8, ts: .55 }
  ];
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  R.mk = mk;
  const shC = {};
  R.shade = function (hex, f) {
    const k = hex + f; if (shC[k]) return shC[k];
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
    return (shC[k] = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')');
  };
  const gC = {};
  R.glow = function (rgb) {
    if (gC[rgb]) return gC[rgb];
    const c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.25, 'rgba(' + rgb + ',.45)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (gC[rgb] = c);
  };
  function treeSprite(col, snow) {
    const c = mk(48, 100), g = c.getContext('2d');
    g.fillStyle = '#2e221d'; g.fillRect(22, 82, 4, 18);
    for (let i = 0; i < 6; i++) {
      const y = 6 + i * 13.5, w = 5 + i * 3.6;
      g.fillStyle = col; g.beginPath(); g.moveTo(24, y - 5); g.lineTo(24 + w + 5, y + 17); g.quadraticCurveTo(24, y + 12, 24 - w - 5, y + 17); g.closePath(); g.fill();
      g.fillStyle = snow; g.beginPath(); g.moveTo(24, y - 5); g.lineTo(24 + w * .55, y + 7); g.quadraticCurveTo(24, y + 3, 24 - w - 3, y + 15); g.quadraticCurveTo(24 - w * .2, y + 6, 24, y - 5); g.fill();
    }
    return c;
  }
  R.treeSprite = treeSprite;
  R.setPhase = function (i) {
    R.key = KEYS[i % 4]; R.pal = PAL[R.key];
    const p = R.pal;
    R.trees = [treeSprite(p.pine[0], p.cap), treeSprite(p.pine[1], R.shade(p.snow, .9)), treeSprite(p.fg, R.shade(p.shade, .6)), treeSprite('#2d5a4a', p.snow)];
  };
  R.setPhase(0);
  R.resize = function (W, H, dpr) {
    R.W = W; R.H = H; R.dpr = dpr;
    const v = mk(W, H), g = v.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78);
    gr.addColorStop(0, 'rgba(8,12,30,0)'); gr.addColorStop(1, 'rgba(8,12,30,.5)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); R.vig = v;
    const n = mk(128, 128), ng = n.getContext('2d'), id = ng.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) { const q = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = q; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0); R.grain = n;
    R.flakes = []; for (let i = 0; i < 130; i++) R.flakes.push({ x: Math.random() * W, y: Math.random() * H, z: .2 + Math.pow(Math.random(), 2) * .9, ph: Math.random() * 6 });
    const a = mk(8, 120), ag = a.getContext('2d'), agr = ag.createLinearGradient(0, 0, 0, 120);
    agr.addColorStop(0, 'rgba(120,80,255,0)'); agr.addColorStop(.35, 'rgba(110,255,190,.9)'); agr.addColorStop(.7, 'rgba(60,220,170,.35)'); agr.addColorStop(1, 'rgba(40,200,160,0)');
    ag.fillStyle = agr; ag.fillRect(0, 0, 8, 120); R.aur = a;
  };
  function shape(L, u) {
    let n = A.fbm(u * L.f);
    if (L.ridged) { const r = 1 - Math.abs(A.noise(u * L.f * 1.6 + 5) * 2 - 1); n = n * .45 + r * r * .65; }
    return n;
  }
  R.drawSky = function (g, G, t) {
    const W = R.W, H = R.H, p = R.pal;
    const sk = g.createLinearGradient(0, 0, 0, H * .75);
    sk.addColorStop(0, p.sky[0]); sk.addColorStop(.55, p.sky[1]); sk.addColorStop(1, p.sky[2]);
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    if (p.night) {
      for (let i = 0; i < 90; i++) {
        const x = A.hash(i * 3.1) * W, y = A.hash(i * 7.7) * H * .55, tw = .4 + .6 * Math.abs(Math.sin(t * (.6 + A.hash(i) * 2) + i));
        g.globalAlpha = tw * (.35 + A.hash(i * 1.3) * .65); g.fillStyle = '#eaf2ff'; g.fillRect(x, y, A.hash(i * 5) > .9 ? 2 : 1.2, A.hash(i * 5) > .9 ? 2 : 1.2);
      }
      const sc = (t % 9) / 1.2; if (sc < 1) { const k = Math.floor(t / 9), x0 = A.hash(k) * W * .7 + W * .2, y0 = A.hash(k + 5) * H * .2 + 20, x = x0 - sc * 140, y = y0 + sc * 60; g.strokeStyle = 'rgba(235,245,255,' + (1 - sc) * .8 + ')'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y - 17); g.stroke(); }
      g.globalAlpha = 1;
    }
    if (p.aurora) {
      g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) for (let x = -10; x < W + 10; x += 6) {
        const y = H * (.07 + k * .07) + Math.sin(x * .008 + t * .25 + k * 2) * 26 + A.noise(x * .01 + t * .2 + k * 9) * 30;
        g.globalAlpha = (.12 + .2 * A.noise(x * .02 - t * .5 + k * 4)) * (1 - k * .25);
        g.drawImage(R.aur, x, y, 7, 90 + 50 * A.noise(x * .015 + k));
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    const sx = W * p.sp[0], sy = H * p.sp[1], s = Math.min(W, H);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = p.night ? .35 : .8; g.drawImage(R.glow(p.sun), sx - s * .45, sy - s * .45, s * .9, s * .9);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgb(' + p.sun + ')'; g.beginPath(); g.arc(sx, sy, s * (p.moon ? .035 : .045), 0, 7); g.fill();
    if (p.moon) { g.fillStyle = 'rgba(120,140,180,.35)'; g.beginPath(); g.arc(sx - s * .01, sy - s * .006, s * .009, 0, 7); g.arc(sx + s * .012, sy + s * .012, s * .006, 0, 7); g.fill(); }
  };
  R.drawRays = function (g, t) {
    const p = R.pal; if (!p.rays) return;
    const W = R.W, H = R.H, sx = W * p.sp[0], sy = H * p.sp[1], L = Math.max(W, H) * 1.6;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) {
      const a = 1.75 + i * .2 + Math.sin(t * .15 + i * 1.7) * .05, w = .03 + A.hash(i) * .05;
      const gr = g.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L);
      const al = p.rays * (.5 + .5 * Math.sin(t * .3 + i * 2.3));
      gr.addColorStop(0, 'rgba(' + p.sun + ',' + al + ')'); gr.addColorStop(1, 'rgba(' + p.sun + ',0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(a - w) * L, sy + Math.sin(a - w) * L); g.lineTo(sx + Math.cos(a + w) * L, sy + Math.sin(a + w) * L); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  };
  R.drawMountains = function (g, G, t) {
    const W = R.W, H = R.H, p = R.pal, yo = G.vOff || 0;
    for (let i = 0; i < LAY.length; i++) {
      const L = LAY[i], off = G.cam.x * G.zoom * L.p + i * 3000, dy = -yo * L.p * 1.2;
      const ys = [];
      g.beginPath(); g.moveTo(0, H);
      for (let sx = 0, k = 0; sx <= W + 6; sx += 6, k++) { const y = H * L.b - shape(L, sx + off) * H * L.a + dy; ys.push(y); g.lineTo(sx, y); }
      g.lineTo(W + 6, H); g.closePath();
      const gr = g.createLinearGradient(0, H * (L.b - L.a), 0, H);
      gr.addColorStop(0, p.mtn[i]); gr.addColorStop(1, R.shade(p.mtn[i], .8));
      g.fillStyle = gr; g.fill();
      if (L.ridged) {
        const sl = H * L.b - H * L.a * L.cap + dy;
        g.beginPath();
        for (let k = 0; k < ys.length; k++) g.lineTo(k * 6, ys[k]);
        for (let k = ys.length - 1; k >= 0; k--) g.lineTo(k * 6, Math.max(ys[k], sl + A.noise((k * 6 + off) * .05) * 16 - 8));
        g.closePath(); g.fillStyle = p.cap; g.globalAlpha = .92; g.fill();
        g.globalAlpha = .22; g.fillStyle = R.shade(p.mtn[i], .7);
        g.beginPath();
        for (let k = 1; k < ys.length - 1; k++) { if (ys[k + 1] > ys[k] && ys[k] < sl + 30) { g.moveTo(k * 6, ys[k]); g.lineTo(k * 6 + 6, ys[k + 1]); g.lineTo(k * 6 + 2, sl + 30); } }
        g.fill(); g.globalAlpha = 1;
      }
      if (L.trees) {
        const spc = 15 / L.ts, spr = R.trees[i === 2 ? 0 : 1];
        const k0 = Math.floor(off / spc) - 2, k1 = Math.floor((off + W) / spc) + 2;
        for (let k = k0; k <= k1; k++) {
          const h = A.hash(k * 13.1 + i * 7); if (h > L.trees) continue;
          const x = k * spc + A.hash(k * 3.7) * spc - off;
          const y = H * L.b - shape(L, x + off) * H * L.a + dy;
          const sz = (28 + A.hash(k * 9.1) * 26) * L.ts * (H / 450);
          g.drawImage(spr, x - sz * .24, y - sz + 4, sz * .48, sz);
        }
      }
      if (i === 1) R.drawRays(g, t);
      const fg = g.createLinearGradient(0, H * (L.b - .08) + dy, 0, H);
      fg.addColorStop(0, 'rgba(' + p.fog + ',0)'); fg.addColorStop(1, 'rgba(' + p.fog + ',' + (.38 - i * .06) + ')');
      g.fillStyle = fg; g.fillRect(0, H * (L.b - .08) + dy, W, H);
    }
  };
  R.drawFg = function (g, G) {
    const W = R.W, H = R.H, off = G.cam.x * G.zoom * 1.5, spc = 380;
    const k0 = Math.floor(off / spc) - 1, k1 = Math.floor((off + W) / spc) + 1;
    for (let k = k0; k <= k1; k++) {
      if (A.hash(k * 5.3) > .4) continue;
      const x = k * spc + A.hash(k * 2.9) * spc - off, h = H * (.32 + A.hash(k * 8.1) * .2);
      g.drawImage(R.trees[2], x - h * .25, H - h * .72, h * .5, h);
    }
  };
  R.drawFlakes = function (g, G, dt) {
    const W = R.W, H = R.H, w = G.wind || 0, cdx = G.camDX || 0;
    g.fillStyle = R.pal.night ? '#dfe8ff' : '#ffffff';
    for (const f of R.flakes) {
      f.x += (w * 90 * f.z - cdx * f.z * .9 + Math.sin(f.ph += dt * 1.5) * 10) * dt;
      f.y += (25 + 55 * f.z) * dt - (G.camDY || 0) * f.z * .5 * dt;
      if (f.x < -10) f.x += W + 20; if (f.x > W + 10) f.x -= W + 20;
      if (f.y > H + 10) f.y -= H + 20; if (f.y < -10) f.y += H + 20;
      g.globalAlpha = .35 + .5 * f.z;
      const r = .6 + f.z * 1.9;
      if (Math.abs(cdx) > 500 && f.z > .5) { g.fillRect(f.x, f.y - r * .5, r * 4, r); } else { g.beginPath(); g.arc(f.x, f.y, r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
    if (Math.abs(w) > .55) {
      g.strokeStyle = 'rgba(255,255,255,' + ((Math.abs(w) - .55) * .5) + ')'; g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = (A.hash(i + Math.floor(G.t * .5)) * H), x = ((G.t * 600 * Math.sign(w) + i * 170) % (W + 300) + W + 300) % (W + 300) - 150;
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 8, x + 80, y + 8, x + 140, y); g.stroke();
      }
    }
  };
})(window.App);
