(function (A) {
  const R = A.R;
  const fl = [], spray = [], drops = [], breath = [];
  const FT = { h: () => -8 };
  const mC = {};
  function mix(rgb, fog, a) { const k = rgb + fog + a; if (mC[k]) return mC[k]; const m = rgb.match(/\d+/g).map(Number), f = fog.split(',').map(Number); return (mC[k] = 'rgb(' + m.map((v, i) => Math.round(v + (f[i] - v) * a)).join(',') + ')'); }
  const rC = new Map();
  function ridge(u, f) { const key = (f * 1e4 | 0) + ':' + Math.round(u / 2); let v = rC.get(key); if (v === undefined) { const x = Math.round(u / 2) * 2; let n = A.fbm(x * f); const r = 1 - Math.abs(A.noise(x * f * 1.6 + 5) * 2 - 1); v = n * .45 + r * r * .65; if (rC.size > 6000) rC.clear(); rC.set(key, v); } return v; }
  // photographic groomed-snow texture, mapped onto the slope in perspective
  let snowC = null, snowP = null;
  function loadSnow() { snowC = 0; const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(im, 0, 0, 256, 256); snowC = c; }; try { im.src = cabinet.file('Seamless tileable texture of freshly gro 1.png'); } catch (e) {} }
  // photoreal alpine range + snow pine, painted on magenta and keyed out at load, then graded per time of day
  const ART = { pano: null, pine: null }, gradeC = {};
  function keyArt(slot, file, maxW) { ART[slot] = 0; const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { try {
    const sc = Math.min(1, maxW / im.width), w = Math.round(im.width * sc), h = Math.round(im.height * sc), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
    const id = x.getImageData(0, 0, w, h), D = id.data; let x0 = w, x1 = 0, y0 = h, y1 = 0;
    for (let i = 0; i < D.length; i += 4) { const r = D[i], gg = D[i + 1], b = D[i + 2], m = Math.min(r, b) - gg; const a = m > 90 ? 0 : m > 30 ? 1 - (m - 30) / 60 : 1; if (a < 1) { D[i] = Math.min(r, gg + 40); D[i + 2] = Math.min(b, gg + 50); } D[i + 3] = a * 255; if (a > .5) { const px = (i >> 2) % w, py = (i >> 2) / w | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
    x.putImageData(id, 0, 0); if (x1 <= x0) return; const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, -x0, -y0); ART[slot] = o;
  } catch (e) {} }; try { im.src = cabinet.file(file); } catch (e) {} }
  function graded(slot, pal, fogA) { const src = ART[slot]; if (!src) return null; const key = slot + R.key + fogA; if (gradeC[key]) return gradeC[key];
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop';
    if (pal.night) { x.fillStyle = pal.aurora ? 'rgba(4,22,30,.6)' : 'rgba(6,12,34,.62)'; x.fillRect(0, 0, c.width, c.height); }
    else if (pal.night === .12 || pal.rays > .1) { x.fillStyle = 'rgba(' + pal.sun + ',.16)'; x.fillRect(0, 0, c.width, c.height); }
    const fg = x.createLinearGradient(0, 0, 0, c.height); fg.addColorStop(0, 'rgba(' + pal.fog + ',' + fogA + ')'); fg.addColorStop(1, 'rgba(' + pal.fog + ',' + (slot === 'pano' ? Math.min(.9, fogA + .45) : fogA) + ')'); x.fillStyle = fg; x.fillRect(0, 0, c.width, c.height);
    return (gradeC[key] = c); }
  function initFl() { for (let i = 0; i < 110; i++) fl.push({ x: (Math.random() - .5) * 700, y: Math.random() * 220 - 20, z: 10 + Math.random() * 900 }); }
  R.drawFP = function (g, G, dt) {
    if (!fl.length) initFl();
    if (snowC === null) loadSnow(); else if (snowC && !snowP) snowP = g.createPattern(snowC, 'repeat');
    if (ART.pano === null) { keyArt('pano', 'Photoreal wide panoramic band of snowco 1.png', 1024); keyArt('pine', 'A single photoreal snowladen spruce pin 1.png', 200); }
    const W = R.W, H = R.H, d = R.dpr, p = G.p, T = G.terr, pal = R.pal, t = G.t;
    const rm = (window.cabinet && cabinet.reducedMotion) ? .3 : 1;
    const sp = p.dead ? 0 : p.speed(), k = Math.min(1, sp / 1300);
    const gx = p.x, gY = T.h(gx), fpS = G.fpS || 0;
    const air = p.dead ? 0 : Math.max(0, gY - p.y);
    const eye = p.dead ? 12 : 34 + air * .9;
    const bob = (p.ground ? Math.sin(t * (6 + k * 10)) * (1 + k * 3) : 0) * rm;
    const F = H * (1.05 - .38 * k) * (1 - .12 * (G.fovKick || 0) * rm);
    const cx = W / 2, hor = H * .4 + Math.min(H * .1, air * .12) + bob;
    let rel = p.dead ? Math.min(2.5, G.crashT * 3) : A.wrapA(p.ang - Math.atan(fpS));
    if (p.ground) rel *= .3;
    const sh = G.shake * rm, ox = (A.noise(t * 23) - .5) * sh * 2.4, oy = (A.noise(t * 19 + 40) - .5) * sh * 2.4;
    g.setTransform(d, 0, 0, d, 0, 0);
    R.drawSky(g, G, t);
    g.save();
    g.translate(cx + ox, H * .5 + oy); g.rotate(-(rel * .9 + (G.fpLean || 0)) * rm); g.translate(-cx, -H * .5);
    // mountains
    const pano = graded('pano', pal, .22);
    for (let i = 0; i < 3; i++) {
      const a = H * (.2 - i * .045), f = .0035 + i * .0025, off = i * 1300 + (G.fpLean || 0) * 200 * (i + 1) + gx * .004 * (i + 1);
      if (i === 1 && pano) { // photoreal range, mirror-tiled so it scrolls seamlessly
        const ph = H * .2, pw = ph * pano.width / pano.height, by = hor + 8 - ph, step = pw * 2; let sx = -W - (((off * .9) % step) + step) % step;
        for (; sx < W * 2; sx += step) { g.drawImage(pano, sx, by, pw, ph); g.save(); g.translate(sx + pw * 2, by); g.scale(-1, 1); g.drawImage(pano, 0, 0, pw, ph); g.restore(); }
        const fg = g.createLinearGradient(0, by + ph * .4, 0, hor + 8); fg.addColorStop(0, 'rgba(' + pal.fog + ',0)'); fg.addColorStop(1, 'rgba(' + pal.fog + ',.5)'); g.fillStyle = fg; g.fillRect(-W, by + ph * .4, W * 3, ph * .6 + 8);
        continue;
      }
      const ys = [];
      g.beginPath(); g.moveTo(-W, hor + 40);
      for (let x = -W; x <= W * 2; x += 10) { const n = ridge(x + off, f); const y = hor + 4 - n * a; ys.push(y); g.lineTo(x, y); }
      g.lineTo(W * 2, hor + 40); g.closePath(); g.fillStyle = pal.mtn[i]; g.fill();
      const sl = hor + 4 - a * .62;
      g.beginPath();
      for (let j = 0; j < ys.length; j++) g.lineTo(-W + j * 10, ys[j]);
      for (let j = ys.length - 1; j >= 0; j--) g.lineTo(-W + j * 10, Math.max(ys[j], sl + A.noise(j * .4 + i) * 10));
      g.closePath(); g.globalAlpha = .85 - i * .15; g.fillStyle = pal.cap; g.fill(); g.globalAlpha = 1;
      // rim light on ridge faces turned toward the sun / moon
      { const dir = pal.sp[0] > .5 ? 1 : -1; g.beginPath(); for (let j = 0; j < ys.length - 1; j++) if ((ys[j + 1] - ys[j]) * dir > .5) { g.moveTo(-W + j * 10, ys[j]); g.lineTo(-W + j * 10 + 10, ys[j + 1]); } g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(' + pal.sun + ',' + (.5 - i * .12) + ')'; g.lineWidth = 1.6 - i * .3; g.stroke(); g.globalCompositeOperation = 'source-over'; }
      const fg = g.createLinearGradient(0, hor - a, 0, hor + 10);
      fg.addColorStop(0, 'rgba(' + pal.fog + ',0)'); fg.addColorStop(1, 'rgba(' + pal.fog + ',' + (.35 - i * .08) + ')');
      g.fillStyle = fg; g.fillRect(-W, hor - a, W * 3, a + 10);
    }
    if (pal.rays) R.drawRays(g, t);
    // valley walls: the run is carved between snow banks that rise toward the treeline
    const sDir = pal.sp[0] > .5 ? -1 : 1, fL = G.fpLat || 0;
    const bk = (lat, z) => { const b = Math.abs(lat) - 220; return b > 0 ? Math.min(200, b * b * .002) * A.clamp(1.4 - z / 1800, 0, 1) : 0; };
    const wl = 'rgba(' + pal.sun + ',' + (pal.night ? .06 : .2) + ')', wd = pal.night ? 'rgba(4,8,26,.34)' : 'rgba(55,85,160,.26)';
    // ground rows far -> near
    const iceR = []; let pend = null;
    for (let z = 2400; z > 12; z /= 1.07) {
      const x = gx + z, dy = T.h(x) - (gY + fpS * z), y = hor + (eye + dy) * F / z, ty = T.type(x);
      if (pend) { pend.y1 = Math.min(y, H * 1.3); pend = null; }
      if (ty === 1 && z < 1800 && y > hor - 2 && y < H * 1.3) { const s0 = F / z; pend = { z, y0: y, y1: y, a: Math.max(0, 1 - Math.pow(z / 2400, .7) * .8), xl: cx + (-230 - fL) * s0, xr: cx + (230 - fL) * s0 }; iceR.push(pend); }
      const rs = (T.h(x + 24) - T.h(x)) / 24 - fpS, lf = Math.round(A.clamp(1 - rs * .9, .78, 1.06) * 50) / 50;
      const base = ty === 1 ? 'rgb(178,214,240)' : (ty === 2 && Math.floor(x / 45) % 2) ? R.shade(pal.snow, Math.min(1.08, lf + .03)) : R.shade(pal.snow, Math.floor(x / 90) % 2 ? lf * .96 : lf);
      const fa = Math.round(Math.pow(z / 2400, .7) * .5 * 20) / 20, s = F / z;
      const top = []; let wall = 0;
      for (let i = 0; i <= 16; i++) { const sx = -W + i * W * 3 / 16, h = bk((sx - cx) / s + fL, z) * s; if (h > wall) wall = h; top.push(sx, y - h); }
      const edge = (yb) => { g.beginPath(); g.moveTo(top[0], top[1]); for (let i = 2; i < top.length; i += 2) g.lineTo(top[i], top[i + 1]); g.lineTo(W * 2, yb); g.lineTo(-W, yb); g.closePath(); };
      if (y - wall < H * 1.6) {
        edge(H * 1.6 + 40); g.fillStyle = fa > .03 ? mix(base, pal.fog, fa) : base; g.fill();
        if (wall > 1) { const xl = cx + (-220 - fL) * s, xr = cx + (220 - fL) * s, w2 = 320 * s, wg = g.createLinearGradient(xl - w2, 0, xr + w2, 0), f = (xr + w2 - (xl - w2)) || 1;
          wg.addColorStop(0, sDir < 0 ? wl : wd); wg.addColorStop(A.clamp(w2 / f, 0, 1), 'rgba(0,0,0,0)'); wg.addColorStop(A.clamp(1 - w2 / f, 0, 1), 'rgba(0,0,0,0)'); wg.addColorStop(1, sDir < 0 ? wd : wl);
          g.fillStyle = wg; g.globalAlpha = 1 - fa; g.fill(); g.globalAlpha = 1; }
      }
      if (snowP && y < H * 1.3 && y > hor - 4 && z < 1800) {
        const q = .9, vy = s * Math.max(6, eye) / z, bh = Math.max(1.5, (y - hor) * .075 + 1.5);
        snowP.setTransform(new DOMMatrix([s * q, 0, 0, -vy * q, cx - fL * s, y + vy * (gx + z)]));
        g.globalCompositeOperation = 'multiply'; g.globalAlpha = (1 - fa) * (pal.night ? .55 : .8); g.fillStyle = snowP;
        edge(z < 20 ? H * 1.6 : y + bh); g.fill(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      }
    }
    if (pend) pend.y1 = H * 1.3;
    R.fpIce(g, { rows: iceR, W, pal, t, k });
    // cloud shadows drifting down the valley; the light dims as one passes overhead
    let dim = 0;
    if (!pal.night) for (let i = 0; i < 3; i++) { const z = ((i * 900 + t * 22 - gx * .8) % 2700 + 2700) % 2700 + 40, s = F / z, lat = (A.hash(i * 5.3) - .5) * 700 + Math.sin(t * .05 + i) * 200;
      dim += Math.max(0, 1 - z / 160) * .14; if (z > 2300) continue;
      const sx = cx + (lat - fL) * s, sy = hor + (eye + T.h(gx + z) - bk(lat, z) - (gY + fpS * z)) * s, w = 1100 * s, h = Math.max(8, w * Math.min(.6, eye / z * 1.6));
      g.globalAlpha = .24 * Math.min(1, (2300 - z) / 600) * Math.min(1, z / 120); g.drawImage(R.glow('40,66,130'), sx - w / 2, sy - h / 2, w, h); }
    g.globalAlpha = 1;
    // key light across the slope: sun side glows warm, the far side falls into cool blue shade
    { const lg = g.createLinearGradient(cx - sDir * W * .7, 0, cx + sDir * W * .8, 0), gy0 = hor + 2;
      lg.addColorStop(0, 'rgba(' + pal.sun + ',' + (pal.night ? .05 : .13) + ')'); lg.addColorStop(.5, 'rgba(' + pal.sun + ',0)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(-W, gy0, W * 3, H * 1.6); g.globalCompositeOperation = 'source-over';
      const sg = g.createLinearGradient(cx, 0, cx + W * .9 * sDir, 0); sg.addColorStop(0, 'rgba(50,80,150,0)'); sg.addColorStop(1, pal.night ? 'rgba(5,10,30,.22)' : 'rgba(60,90,160,.14)'); g.fillStyle = sg; g.fillRect(-W, gy0, W * 3, H * 1.6); }
    // distant pine tree line hugging the horizon
    { g.beginPath(); for (let i = -36; i <= 36; i++) { const zz = 1500 + A.hash(i * 2.7) * 500, lat = i * 70 + (A.hash(i * 9.1) - .5) * 50, s = F / zz, x0 = cx + (lat - (G.fpLat || 0)) * s * .3, y0 = hor + (eye + T.h(gx + zz) - bk(lat * .3 + fL, zz) - (gY + fpS * zz)) * s, h = (26 + A.hash(i * 5.3) * 34) * s; if (x0 < -W * .5 || x0 > W * 1.5) continue; g.moveTo(x0 - h * .32, y0 + 1); g.lineTo(x0, y0 - h); g.lineTo(x0 + h * .32, y0 + 1); } g.fillStyle = mix(R.shade(pal.pine[0], 1), pal.fog, .45); g.fill(); }
    // distant snow-blown cornice haze drifting across the slope
    { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const zz = 300 + i * 320, s = F / zz, yy = hor + eye * s, xx = cx + Math.sin(t * .2 + i * 2) * W * .4; g.globalAlpha = .06 * rm + .04; g.drawImage(R.glow(pal.fog), xx - W * .6, yy - 18 * s - 6, W * 1.2, 36 * s + 12); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // fog at horizon
    const hf = g.createLinearGradient(0, hor - 6, 0, hor + H * .12);
    hf.addColorStop(0, 'rgba(' + pal.fog + ',.55)'); hf.addColorStop(1, 'rgba(' + pal.fog + ',0)');
    g.fillStyle = hf; g.fillRect(-W, hor - 6, W * 3, H * .12 + 6);
    // atmospheric scattering: the key light blooms along the horizon and lays a specular sheen down the slope
    { const lx = W * pal.sp[0], lc = pal.night ? '150,180,240' : pal.sun; g.globalCompositeOperation = 'lighter';
      g.globalAlpha = pal.night ? .12 : .3; g.drawImage(R.glow(lc), lx - W * .8, hor - H * .09, W * 1.6, H * .18);
      g.globalAlpha = pal.night ? .05 : .11; g.drawImage(R.glow(lc), lx * .6 + cx * .4 - W * .22, hor, W * .44, H * .7);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // sculpted wind drifts: lit crests and cool lee shadows sweeping past underfoot
    if (!p.dead) { const sh0 = R.glow(pal.night ? '10,20,50' : '70,100,160'), li0 = R.glow(pal.night ? '170,195,245' : '255,252,244'), m0 = Math.floor(gx / 26);
      for (let i = 72; i > 0; i--) { const kk = m0 + i, z = kk * 26 - gx; if (z < 16 || z > 1400 || T.type(gx + z) === 1) continue;
        const sc = F / z, sz = (12 + Math.pow(A.hash(kk * 3.1), 2) * 34) * sc, lat = (A.hash(kk * 1.7) - .5) * 760, mx = cx + (lat - (G.fpLat || 0)) * sc, my = hor + (eye + T.h(gx + z) - bk(lat, z) - (gY + fpS * z)) * sc;
        if (mx < -sz * 2 || mx > W + sz * 2 || my > H + sz) continue; const a = Math.min(1, (1400 - z) / 500), hh = sz * Math.min(.45, .12 + eye / z * 2.5);
        g.globalAlpha = a * .32; g.drawImage(sh0, mx + sDir * sz * .25 - sz, my - hh * .2, sz * 2, hh * 1.4);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (pal.night ? .12 : .2); g.drawImage(li0, mx - sDir * sz * .2 - sz * .7, my - hh * .9, sz * 1.4, hh); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1; }
    // corduroy grooves rushing toward you
    if (!p.dead) { g.save(); g.strokeStyle = pal.night ? 'rgba(40,60,110,.22)' : 'rgba(110,140,190,.16)'; g.lineWidth = 1; g.setLineDash([18, 26]); g.lineDashOffset = -(gx * 1.6) % 44; for (let i = -9; i <= 9; i++) { const bx = cx + i * W * .11 - (G.fpLat || 0) * 3; g.beginPath(); g.moveTo(bx + i * W * .25, H * 1.2); g.lineTo(cx + i * 3, hor + 4); g.stroke(); } g.restore(); }
    // sun glints on the snow
    if (!p.dead) { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const zz = 40 + A.hash(i * 9.3 + Math.floor(gx / 300)) * 900, lat = (A.hash(i * 4.1) - .5) * 900, s = F / zz, gl = Math.pow(Math.max(0, Math.sin(t * 3 + i * 2.7)), 12); if (gl < .05) continue; const sx = cx + (lat - (G.fpLat || 0)) * s, sy = hor + (eye - bk(lat, zz)) * s; g.globalAlpha = gl * .8; g.drawImage(R.glow(pal.night ? '200,220,255' : '255,250,235'), sx - 6, sy - 6, 12, 12); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // ski tracks
    R.fpTracks(g, { cx, W, H, hor, fL, lean: G.fpLean || 0, pal, sDir });
    if (!p.dead) R.fpShadow(g, { cx, W, H, hor, sDir, pal, air, lean: (G.fpLean || 0) * W * .6 * rm, tk: p.tuck && p.ground, t, rm });
    const proj = (z, wy, lat) => { const s = F / z; return { x: cx + (lat - (G.fpLat || 0)) * s, y: hor + (eye + wy - (gY + fpS * z)) * s, s }; };
    // rails
    for (const r of T.rails) { if (R.hazOn) break; // chrome 3D rails take over
      const z1 = Math.max(14, r.x1 - gx), z2 = r.x2 - gx; if (z2 < 14 || z1 > 2000) continue;
      const a = proj(z1, r.y1 + (gx + z1 - r.x1) * r.m, 0), b = proj(z2, r.y2, 0);
      g.strokeStyle = '#8f9bb0'; g.lineCap = 'round'; g.lineWidth = Math.min(30, 4.5 * a.s); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.min(8, 1.2 * a.s); g.stroke();
    }
    // objects
    const list = [];
    for (const o of T.objs) { const z = o.x - gx; if (z < 14 || z > 2000 || o.got) continue; list.push({ z, o, lat: (o.k === 'coin' || o.k === 'mag') ? 0 : (o.s - .5) * 24 }); }
    for (const L of T.lodges) { const z = L.x - gx; if (z > 14 && z < 2200) list.push({ z, L, lat: (A.hash(L.x) > .5 ? 1 : -1) * 230 }); }
    const k0 = Math.floor(gx / 55);
    for (let i = 1; i < 40; i++) {
      const kk = k0 + i, z = kk * 55 - gx; if (z < 14) continue;
      const side = A.hash(kk * 3.3) < .5 ? -1 : 1;
      list.push({ z, tree: 1, lat: side * (110 + A.hash(kk * 7.1) * 420), sz: .8 + A.hash(kk * 1.9) * .9 });
      if (A.hash(kk * 5.7) > .4) list.push({ z: z + 20, tree: 1, lat: -side * (140 + A.hash(kk * 2.3) * 500), sz: .7 + A.hash(kk * 4.1) });
    }
    list.sort((a, b) => b.z - a.z);
    for (const e of list) {
      const x = gx + e.z, gy = T.h(x), q = proj(e.z, gy - bk(e.lat, e.z), e.lat);
      if (q.x < -W * .6 || q.x > W * 1.6) continue;
      g.globalAlpha = Math.min(1, Math.max(0, 1 - (e.z - 1500) / 500));
      g.save(); g.translate(q.x, q.y); g.scale(q.s, q.s);
      const in3 = (e.tree && R.forestOn) || (e.L && R.lodgeOn && R.forestOn) || (e.o && R.hazOn && (e.o.k !== 'mag' && (e.o.k !== 'coin' || R.coinOn))); // real 3D shadows cover these
      if (!in3 && !(e.o && (e.o.k === 'coin' || e.o.k === 'mag'))) { const sw = e.tree ? 16 * e.sz : e.L ? 70 : 16; g.fillStyle = pal.night ? 'rgba(5,10,30,.35)' : 'rgba(40,70,120,.22)'; g.beginPath(); g.ellipse(sw * .35, 1, sw, sw * .22, 0, 0, 7); g.fill();
        if (!pal.night) { const L = sw * (1.4 + pal.sp[1] * 4); g.fillStyle = 'rgba(60,90,150,.16)'; g.beginPath(); g.ellipse(sDir * L * .5, 1.5, L * .55, sw * .16, 0, 0, 7); g.fill(); } }
      if (e.tree && R.forestOn) { /* drawn as real 3D spruces below */ }
      else if (e.tree) { g.transform(1, 0, ((A.noise(t * .5 + e.lat * .013) - .5) * .09 + (G.wind || 0) * .04) * rm, 1, 0, 0); const pv = graded('pine', pal, e.z > 1100 ? .45 : e.z > 500 ? .22 : 0); if (pv) { const th = 66 * e.sz, tw = th * pv.width / pv.height; g.drawImage(pv, -tw / 2, -th + 2, tw, th); } else g.drawImage(R.trees[e.z > 900 ? 1 : 3], -14 * e.sz, -58 * e.sz, 28 * e.sz, 60 * e.sz);
        // wind-packed snow mound hugging the trunk, lit on its sun side
        const mf = Math.round(Math.pow(e.z / 2400, .7) * .5 * 20) / 20, ms = e.sz * 9;
        g.fillStyle = mix(R.shade(pal.snow, .9), pal.fog, mf); g.beginPath(); g.ellipse(0, 1.5, ms, ms * .3, 0, Math.PI, 0); g.ellipse(0, 1.5, ms, ms * .12, 0, 0, Math.PI); g.fill();
        g.fillStyle = mix(R.shade(pal.snow, 1.06), pal.fog, mf); g.beginPath(); g.ellipse(-sDir * ms * .2, .5, ms * .7, ms * .2, 0, Math.PI, 0); g.fill(); }
      else if (e.L) { if (!in3) R.lodge(g, { x: 0, s: e.L.s }, t, pal, FT); }
      else { const o = e.o, c = Object.assign({}, o, { x: 0, y: (o.k === 'coin' || o.k === 'mag') ? o.y - gy : 0 }); if (o.k !== 'coin' && o.k !== 'mag' && !o.hit && e.z < 700 && !p.dead) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - e.z / 700) * (.45 + .25 * Math.sin(t * 12)); g.drawImage(R.glow('255,90,60'), -30, -60, 60, 70); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; } if (!in3) R.drawObj(g, c, t, pal); }
      g.restore();
    }
    g.globalAlpha = 1;
    R.forestOn = R.fpForest(g, { W, H, d, F, hor, cx, eye, gx, gY, fpS, fL, pal, t, rm, dt, bk, T, G });
    if (dim > .005) { g.fillStyle = 'rgba(30,50,100,' + Math.min(.16, dim).toFixed(3) + ')'; g.fillRect(-W, -H, W * 3, H * 3); }
    // streaking snow
    g.strokeStyle = pal.night ? '#dfe8ff' : '#ffffff'; g.lineCap = 'round';
    const v = sp * .9 + 40, bokC = R.glow(pal.night ? '220,232,255' : '255,255,255');
    for (const f of fl) {
      f.z -= v * dt; f.x += (G.wind || 0) * 40 * dt; f.y -= 20 * dt;
      if (f.z < 8 || f.y < -40) { f.z = 600 + Math.random() * 400; f.x = (Math.random() - .5) * 700; f.y = Math.random() * 220 - 20; }
      const s = F / f.z, sx = cx + f.x * s, sy = hor + (eye - f.y) * s;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
      if (f.z < 70) { const br = Math.min(26, 500 / f.z); g.globalAlpha = .22 * Math.min(1, (f.z - 8) / 20); g.drawImage(bokC, sx - br, sy - br, br * 2, br * 2); continue; } // out-of-focus flakes right at the lens
      const s2 = F / (f.z + 6 + v * .04), tx = cx + f.x * s2, tyy = hor + (eye - f.y) * s2;
      g.globalAlpha = Math.min(.9, .2 + 30 / f.z); g.lineWidth = Math.min(4, .6 + 40 / f.z);
      g.beginPath(); g.moveTo(tx, tyy); g.lineTo(sx, sy); g.stroke();
    }
    g.globalAlpha = 1;
    g.restore();
    // radial zoom blur at speed: the frame smears outward from the vanishing point
    if (k > .5 && !p.dead && rm > .5) { const zk = (k - .5) / .5, cv = g.canvas, cw = cv.width, ch = cv.height; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      [1.02, 1.045].forEach((sc, i) => { g.globalAlpha = (.26 - i * .08) * zk; g.drawImage(cv, (cw - cw * sc) * cx / W, (ch - ch * sc) * hor / H, cw * sc, ch * sc); }); g.restore(); }
    R.fpBloom(g, { W, H, pal });
    // landing reticle + speed gauge
    if (!p.dead && !p.ground && !p.rail && p.air > .15) {
      const la = Math.atan(T.slope(p.x + p.vx * .25)), df = A.wrapA(p.ang - la), ad = Math.abs(df), col = ad < .42 ? '120,255,170' : ad < 1 ? '255,210,90' : '255,90,80', ry = H * .46, rr = 26;
      g.save(); g.translate(cx, ry); g.strokeStyle = 'rgba(' + col + ',.85)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.stroke();
      g.rotate(df); g.lineWidth = 3; g.beginPath(); g.moveTo(-rr - 10, 0); g.lineTo(-rr + 6, 0); g.moveTo(rr - 6, 0); g.lineTo(rr + 10, 0); g.stroke(); g.restore();
      g.fillStyle = 'rgba(' + col + ',.95)'; g.font = '800 10px -apple-system,system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(ad < .42 ? 'LAND IT' : ad < 1 ? 'LEVEL OUT' : 'TOO ROTATED', cx, ry + rr + 16); const fl2 = Math.abs(p.rot) / (2 * Math.PI); if (fl2 > .15) { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'italic 900 13px -apple-system,system-ui,sans-serif'; g.fillText((p.rot < 0 ? '↺ ' : '↻ ') + Math.round(Math.abs(p.rot) * 57.3) + '°', cx, ry - rr - 10); }
    }
    if (!p.dead) { const mph = Math.round(sp * .112), gk = Math.min(1, sp / 1400), gy2 = H - 14; g.lineCap = 'round'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,20,45,.35)'; g.beginPath(); g.arc(cx, gy2, 30, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.strokeStyle = gk > .8 ? '#ff8a5c' : '#bfe3ff'; g.beginPath(); g.arc(cx, gy2, 30, Math.PI * 1.1, Math.PI * (1.1 + .8 * gk)); g.stroke(); if (p.ground && p.hold > 0) { const hk = Math.min(1, p.hold / .6); g.lineWidth = 3; g.strokeStyle = hk >= 1 ? '#c8ffda' : 'rgba(255,230,140,.9)'; g.beginPath(); g.arc(cx, gy2, 23, Math.PI * 1.1, Math.PI * (1.1 + .8 * hk)); g.stroke(); }
      g.fillStyle = '#fff'; g.font = 'italic 900 15px -apple-system,system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(mph, cx, gy2 - 6); g.font = '700 7px system-ui'; g.fillText('MPH', cx, gy2 + 3); }
    // sun lens flare
    if (!pal.night && !p.dead) { const sx = W * pal.sp[0], sy = H * pal.sp[1], s = Math.min(W, H); g.globalCompositeOperation = 'lighter'; [[.35, .12, .25], [.6, .06, .18], [1.25, .09, .14], [1.5, .03, .3]].forEach(f => { const fx = sx + (cx - sx) * f[0] * 2, fy = sy + (H * .5 - sy) * f[0] * 2; g.globalAlpha = f[2]; g.drawImage(R.glow(pal.sun), fx - s * f[1], fy - s * f[1], s * f[1] * 2, s * f[1] * 2); }); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (!p.dead) R.fpStreak(g, { W, H, pal, t });
    if (!p.dead) R.fpDirt(g, { W, H, pal, cx });
    // chromatic speed fringe
    if (k > .6 && !p.dead) { const ck = (k - .6) * 2.5 * rm; g.globalCompositeOperation = 'lighter'; [[0, 1, '80,200,255'], [W, -1, '255,80,180']].forEach(e => { const gr = g.createLinearGradient(e[0], 0, e[0] + e[1] * W * .12, 0); gr.addColorStop(0, 'rgba(' + e[2] + ',' + (.18 * ck).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + e[2] + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }); g.globalCompositeOperation = 'source-over'; }
    // speed lines
    if (k > .5 && !p.dead) {
      const kk = (k - .5) * 2; g.strokeStyle = 'rgba(255,255,255,' + (.3 * kk) + ')'; g.lineWidth = 1.2;
      for (let i = 0; i < 18; i++) { const a = A.hash(i * 3.7 + Math.floor(t * 12)) * Math.PI * 2, r0 = Math.max(W, H) * (.38 + A.hash(i + Math.floor(t * 12)) * .1), r1 = r0 + 60 + 140 * kk;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, hor + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, hor + Math.sin(a) * r1); g.stroke(); }
    }
    // spray
    if (p.ground && !p.dead && (p.carve || T.type(p.x) === 2 || sp > 700)) for (let i = 0; i < (p.carve ? 3 : 1); i++) { if (spray.length < 90) { const s = Math.random() < .5 ? -1 : 1; spray.push({ x: cx + s * W * (.18 + Math.random() * .2), y: H * .95, vx: s * (60 + Math.random() * 140), vy: -120 - Math.random() * 200, l: .6, r: 2 + Math.random() * 5 }); } }
    if (p.ground && !p.dead && p.carve) { const st = (A.input.right ? 1 : 0) - (A.input.left ? 1 : 0) || 1; for (let i = 0; i < 2; i++) if (spray.length < 110) spray.push({ x: cx + st * W * (.06 + Math.random() * .05), y: H * .8, vx: st * (160 + Math.random() * 220), vy: -260 - Math.random() * 220, l: .7, r: 1.5 + Math.random() * 3 }); }
    // powder spray: soft volumetric puffs, back-lit by the key light
    const sprC = R.glow(pal.night ? '205,220,250' : '250,252,255'), litC = R.glow(pal.sun);
    for (let i = spray.length - 1; i >= 0; i--) { const q = spray[i]; q.vy += 500 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt; q.r += dt * 14; if (q.l <= 0) { spray.splice(i, 1); continue; } const r = q.r * 2.6; g.globalAlpha = Math.min(1, q.l * 1.4) * .85; g.drawImage(sprC, q.x - r, q.y - r, r * 2, r * 2); if (!pal.night && q.r < 5) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = q.l * .5; g.drawImage(litC, q.x - r * .5, q.y - r * .5, r, r); g.globalCompositeOperation = 'source-over'; } }
    g.globalAlpha = 1;
    R.fpBurst(g, { W, H, cx, p, dt, pal });
    // edge vignette tunnel at speed (radial motion blur feel)
    if (k > .45 && !p.dead) { const vk = (k - .45) * 1.8 * rm, gr = g.createRadialGradient(cx, hor, Math.min(W, H) * (.5 - .15 * vk), cx, hor, Math.max(W, H) * .8); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(' + pal.fog + ',' + (.35 * vk).toFixed(3) + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    // airborne: sky-light bloom and ground shadow drop for the big float
    if (!p.dead && !p.ground && !p.rail && air > 40) { const ak = Math.min(1, air / 300); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .18 * ak; g.drawImage(R.glow(pal.sun), cx - W, hor - H * .9, W * 2, H * 1.2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    // landing impact flash
    if (G.shake > 6 && !p.dead) { g.fillStyle = 'rgba(255,255,255,' + Math.min(.25, (G.shake - 6) * .03).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    // night: headlamp
    if (pal.night) {
      g.fillStyle = 'rgba(4,8,22,.42)'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      const hy = hor + H * .16, gr = g.createRadialGradient(cx, hy, 4, cx, hy, W * .6);
      gr.addColorStop(0, 'rgba(255,232,180,.34)'); gr.addColorStop(.5, 'rgba(255,232,180,.12)'); gr.addColorStop(1, 'rgba(255,232,180,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(cx - W * .12, H); g.lineTo(cx - W * .7, hor - 20); g.lineTo(cx + W * .7, hor - 20); g.lineTo(cx + W * .12, H); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    // skis and hands
    if (!p.dead) {
      const rd = A.rider(), lean = (G.fpLean || 0) * W * .6 * rm;
      const tipY = H * (p.ground ? .8 : .86) + bob * 2 + (p.grab ? -H * .03 : 0);
      const tk = p.tuck && p.ground ? 1 : 0, pl = Math.sin((p.pole || 0) * Math.PI * 2);
      if (p.ground) [-1, 1].forEach(s => { const bx = cx + s * W * .17 + lean * .3, tx = cx + s * W * .07 + lean, ox2 = sDir * W * .03, oy2 = H * .012; g.fillStyle = pal.night ? 'rgba(4,8,24,.4)' : 'rgba(50,80,140,.26)'; g.beginPath(); g.moveTo(bx - W * .07 + ox2, H + 10); g.lineTo(tx - W * .03 + ox2, tipY + oy2); g.lineTo(tx + W * .03 + ox2, tipY + oy2); g.lineTo(bx + W * .08 + ox2, H + 10); g.fill(); }); // contact shadow on the snow
      const rig = R.fpRig(g, { W, H, d, F, hor, cx, pal, lean, bob, p, tipY, tk, pl, sDir, t });
      [-1, 1].forEach(s => {
        const bx = cx + s * W * .17 + lean * .3, tx = cx + s * W * .07 + lean;
        if (!rig) {
        g.fillStyle = R.shade(rd.skis, .7); g.beginPath(); g.moveTo(bx - W * .07, H + 10); g.lineTo(tx - W * .025, tipY); g.quadraticCurveTo(tx, tipY - H * .035, tx + W * .025, tipY); g.lineTo(bx + W * .07, H + 10); g.fill();
        g.fillStyle = rd.skis; g.beginPath(); g.moveTo(bx - W * .06, H + 10); g.lineTo(tx - W * .02, tipY + 2); g.quadraticCurveTo(tx, tipY - H * .03, tx + W * .02, tipY + 2); g.lineTo(bx + W * .06, H + 10); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx - W * .02, H); g.lineTo(tx - W * .005, tipY + 4); g.stroke();
        // topsheet stripe, steel edges and a sky reflection sliding along the ski
        g.strokeStyle = R.shade(rd.jacket, 1.1); g.lineWidth = 3; g.beginPath(); g.moveTo(bx + W * .015, H + 8); g.lineTo(tx + W * .004, tipY + 6); g.stroke();
        g.strokeStyle = 'rgba(210,225,240,.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx - s * W * .07, H + 10); g.lineTo(tx - s * W * .025, tipY); g.stroke();
        const ph = ((gx * .004 + (s > 0 ? .5 : 0)) % 1 + 1) % 1, gxp = bx + (tx - bx) * ph, gyp = H + 10 + (tipY - H - 10) * ph;
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55 * Math.sin(ph * Math.PI); g.drawImage(R.glow(pal.night ? '180,200,255' : pal.sun), gxp - 18, gyp - 8, 36, 16); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        }
        R.fpTipSnow(g, { tx, tipY, W, H, s, pal, n: Math.min(1, (G.runT || 0) / 12), bob });
        // deep powder: tips plow under a churning bow wave
        if (p.ground && T.type(p.x) === 2) { const pw = R.glow(pal.night ? '215,226,250' : '252,253,255'); for (let j = 0; j < 4; j++) { const ph2 = t * (3 + k * 6) + j * 1.7 + s, r = W * (.05 + .02 * Math.sin(ph2)); g.globalAlpha = .7 - j * .1; g.drawImage(pw, tx + (j - 1.5) * W * .025 - r, tipY + H * .025 - r * .55 - Math.abs(Math.sin(ph2)) * 6, r * 2, r * 1.1); } g.globalAlpha = 1; }
      });
      if (!rig) [-1, 1].forEach(s => {
        let hx = cx + s * W * (tk ? .2 : .32) + lean * .5, hy = H * (tk ? .8 : .84) + (p.ground ? pl * s * 6 : -10) + bob;
        if (p.grab) { hx = cx + s * W * .1 + lean; hy = tipY + H * .06; }
        if (!p.grab) { g.strokeStyle = '#c9d2dc'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + s * W * (tk ? .25 : .12), H * (tk ? .95 : 1.15)); g.stroke(); }
        R.fpArm(g, { s, x0: cx + s * W * .62, y0: H + 30, x1: hx + s * 6, y1: hy + 8, col: rd.jacket, pal, sDir });
        // sculpted glove: cuff, fist, knuckle ridge, pole grip and a rim of key light
        g.save(); g.translate(hx, hy); g.rotate(s * .35); g.scale(1.3, 1.3); g.lineJoin = 'round';
        g.fillStyle = R.shade(rd.jacket, .55); g.beginPath(); g.roundRect ? g.roundRect(-13, 6, 26, 12, 6) : g.rect(-13, 6, 26, 12); g.fill();
        const gg = g.createLinearGradient(-12, -12, 12, 12); gg.addColorStop(0, '#3a3f4c'); gg.addColorStop(.55, '#1e2129'); gg.addColorStop(1, '#121419'); g.fillStyle = gg;
        g.beginPath(); g.ellipse(0, 0, 13, 11.5, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.2; g.beginPath(); for (let j = -1; j <= 1; j++) { g.moveTo(j * 6 - 2.5, -7); g.quadraticCurveTo(j * 6, -10.5, j * 6 + 2.5, -7); } g.stroke();
        g.fillStyle = '#2b2f38'; g.beginPath(); g.ellipse(-s * 10, 1, 5, 7, -s * .4, 0, 7); g.fill();
        g.fillStyle = '#5a6272'; g.fillRect(-3, -15, 6, 5);
        g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(' + (pal.night ? '150,170,230' : pal.sun) + ',.45)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 12, 10.5, 0, sDir > 0 ? Math.PI * .9 : -Math.PI * .4, sDir > 0 ? Math.PI * 1.4 : Math.PI * .1); g.stroke(); g.globalCompositeOperation = 'source-over';
        g.restore();
      });
    } else { g.fillStyle = 'rgba(255,255,255,' + Math.max(0, .5 - G.crashT * .4) + ')'; g.fillRect(0, 0, W, H); }
    // frosty breath: a puff every few seconds, quicker when you're working hard at speed
    if (!p.dead) { const per = 2.8 - k * 1.3; if (t - (breath.t || 0) > per || t < (breath.t || 0)) { breath.t = t; for (let i = 0; i < 4; i++) breath.push({ x: cx + (Math.random() - .5) * 20, y: H + 6, vx: (Math.random() - .5) * 30 + (G.wind || 0) * 30, vy: -55 - Math.random() * 35 - k * 40, r: 10 + Math.random() * 8, l: 1.5 }); } }
    for (let i = breath.length - 1; i >= 0; i--) { const q = breath[i]; q.l -= dt; if (q.l <= 0) { breath.splice(i, 1); continue; } q.x += (q.vx - (G.fpLean || 0) * 200) * dt; q.y += q.vy * dt; q.vy *= 1 - dt * .8; q.r += dt * 40; g.globalAlpha = Math.min(1, q.l) * (pal.night ? .1 : .16) * Math.min(1, (1.5 - q.l) * 5); g.drawImage(R.glow('235,242,255'), q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
    g.globalAlpha = 1;
    // goggle lens frame: tinted rim, soft edge refraction
    if (!p.dead) { const rd = A.rider(), gr = g.createRadialGradient(cx, H * .5, Math.min(W, H) * .42, cx, H * .5, Math.max(W, H) * .72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.7, 'rgba(10,14,26,.18)'); gr.addColorStop(1, 'rgba(8,10,20,.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .07; g.fillStyle = rd.goggle; g.fillRect(0, 0, W, H); g.globalAlpha = .12; g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(cx - W * .25, H * .2, W * .35, Math.PI * 1.05, Math.PI * 1.35); g.stroke(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      R.fpGoggle(g, { W, H, cx, lean: (G.fpLean || 0) * W * .6 * rm, t, pal });
      // next-hazard chip
      let nh = null; for (const o of T.objs) { if (o.hit || o.k === 'coin' || o.k === 'mag') continue; const z = o.x - gx; if (z > 10 && z < 900 && (!nh || z < nh.z)) nh = { z, k: o.k }; }
      if (nh && G.state === 'play') { const m = Math.round(nh.z / 20), urg = nh.z < 300, lbl = (nh.k === 'yeti' ? 'YETI' : nh.k.toUpperCase()) + ' ' + m + ' m' + (urg ? ' · JUMP!' : ''); g.font = '800 11px -apple-system,system-ui,sans-serif'; const w = g.measureText(lbl).width + 20; g.fillStyle = urg ? 'rgba(200,40,40,' + (.55 + .25 * Math.sin(t * 14)) + ')' : 'rgba(10,25,55,.5)'; g.beginPath(); g.roundRect ? g.roundRect(cx - w / 2, 54, w, 22, 11) : g.rect(cx - w / 2, 54, w, 22); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(lbl, cx, 69); } }
    // flakes landing on the goggle lens, melting into beads
    if (!p.dead && G.state === 'play') { if (drops.length < 14 && Math.random() < dt * (1.2 + k * 3)) drops.push({ x: Math.random() * W, y: Math.random() * H * .7, r: 2 + Math.random() * 4, l: 1, sx: 0 }); for (let i = drops.length - 1; i >= 0; i--) { const q = drops[i]; q.l -= dt * (.35 + k * .4); q.sx += k * 60 * dt; if (q.l <= 0) { drops.splice(i, 1); continue; } const x = q.x + (q.x < cx ? -q.sx : q.sx), y = q.y + (1 - q.l) * 10, a = Math.min(1, q.l * 2); g.globalAlpha = a * .5; g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x, y, q.r, 0, 7); g.fill(); g.globalAlpha = a * .8; g.fillStyle = '#fff'; g.beginPath(); g.arc(x - q.r * .35, y - q.r * .35, q.r * .3, 0, 7); g.fill(); g.globalAlpha = a * .25; g.strokeStyle = 'rgba(20,40,80,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, q.r, .2, 2.6); g.stroke(); } g.globalAlpha = 1; } else drops.length = 0;
    if (G.state === 'play' && !p.dead && G.runT < 6 && (A.save.viewRuns || {}).fp < 6 || (G.state === 'play' && !p.dead && G.runT < 6 && !(A.save.viewRuns || {}).fp)) { g.globalAlpha = Math.min(1, (6 - G.runT) / 1.5); g.font = '700 11px -apple-system,system-ui,sans-serif'; const tx = 'Hold = tuck · Release = jump · ↓ carve · ←/→ flip'; const w = g.measureText(tx).width + 22; g.fillStyle = 'rgba(10,25,55,.55)'; g.beginPath(); g.roundRect ? g.roundRect(cx - w / 2, H * .62, w, 24, 12) : g.rect(cx - w / 2, H * .62, w, 24); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(tx, cx, H * .62 + 16); g.globalAlpha = 1; }
    // terrain profile radar
    if (!p.dead && G.state === 'play') { const bw = 92, bh = 30, bx = 10, by = H - bh - 10, n = 30; g.fillStyle = 'rgba(10,25,55,.45)'; g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, 8) : g.rect(bx, by, bw, bh); g.fill(); const ys = []; let mn = 1e9, mx = -1e9; for (let i = 0; i <= n; i++) { const v = T.h(gx + i * 40) - gY - .3 * i * 40; ys.push(v); mn = Math.min(mn, v); mx = Math.max(mx, v); } const sc = (bh - 10) / Math.max(40, mx - mn); g.strokeStyle = 'rgba(220,240,255,.9)'; g.lineWidth = 1.5; g.beginPath(); ys.forEach((v, i) => g.lineTo(bx + 4 + i * (bw - 8) / n, by + 5 + (v - mn) * sc)); g.stroke(); for (const o of T.objs) { if (o.hit || o.got || o.k === 'coin' || o.k === 'mag') continue; const z = o.x - gx; if (z < 0 || z > 1200) continue; const i = z / 40; g.fillStyle = '#ff6a55'; g.beginPath(); g.arc(bx + 4 + i * (bw - 8) / n, by + 5 + (T.h(o.x) - gY - .3 * z - mn) * sc - 2, 2.2, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(bx + 4, by + 5 + (p.y - gY - mn) * sc, 2.5, 0, 7); g.fill(); }
    // avalanche dust at edges
    const al = G.avalLevel || 0;
    if (al > 0) {
      [[0, 1], [W, -1]].forEach(e => { const gr = g.createLinearGradient(e[0], 0, e[0] + e[1] * W * .35, 0); gr.addColorStop(0, 'rgba(240,245,255,' + al * .8 + ')'); gr.addColorStop(1, 'rgba(240,245,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
      g.fillStyle = 'rgba(245,248,255,' + al * .6 + ')';
      for (let i = 0; i < 24; i++) { const s = i % 2 ? 1 : -1, x = s > 0 ? W - A.hash(i) * W * .2 * al : A.hash(i) * W * .2 * al, y = ((A.hash(i * 3) * H + t * 200 * (1 + A.hash(i))) % (H + 40)) - 20; g.beginPath(); g.arc(x, y, 8 + A.hash(i * 7) * 22, 0, 7); g.fill(); }
    }
  };
})(window.App);
