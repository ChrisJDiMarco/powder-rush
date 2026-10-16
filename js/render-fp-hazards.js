(function (A) {
  const R = A.R;
  // 3D lodges and coins for the first-person view: timber chalets with stone bases, snow-loaded roofs and
  // glowing windows, and spinning gold coins that mirror the sky; plus their 2D touches drawn over the
  // frame (window light pooling on the snow, chimney smoke, star glints on the coins)
  let X3 = null, failed = false;
  const SNOW = [.95, .97, 1], LOG = [.44, .26, .17], LOG2 = [.32, .18, .11], STONE = [.46, .47, .52], STONE2 = [.3, .31, .36], TRIM = [.92, .87, .74], DOOR = [.24, .13, .08], EAVE = [.2, .12, .08];
  const at = (g, x, y, z) => { g.translate(x, y, z); return g; };
  function lodgeGeo(T) {
    const P = [];
    P.push([at(new T.BoxGeometry(98, 14, 76), 0, 7, 0), (x, y, z) => { const n = A.hash(Math.round(x / 7) * 3 + Math.round(y / 5) * 17 + Math.round(z / 7) * 5); return n > .5 ? STONE : STONE2; }]);
    P.push([at(new T.BoxGeometry(92, 32, 70), 0, 30, 0), (x, y) => Math.floor(y / 4) % 2 ? LOG : LOG2]);
    const gab = new T.CylinderGeometry(1, 1, 1, 3); gab.rotateX(-Math.PI / 2); gab.scale(92 / 1.732, 32 / 1.5, 70); gab.translate(0, 46 + 32 / 3, 0);
    P.push([gab, (x) => Math.floor((x + 60) / 6) % 2 ? LOG2 : EAVE]);
    [-1, 1].forEach(s => { const r = new T.BoxGeometry(72, 6, 86); r.rotateZ(-s * .6); P.push([at(r, s * 29, 63, 0), (x, y, z, ny) => ny > .3 ? SNOW : ny > -.3 ? [.86, .9, .97] : EAVE]); });
    P.push([at(new T.BoxGeometry(11, 30, 11), 26, 74, -8), () => STONE2]);
    P.push([at(new T.BoxGeometry(14, 4, 14), 26, 90, -8), () => SNOW]);
    P.push([at(new T.BoxGeometry(18, 26, 1.4), 0, 27, 35.4), () => DOOR]);
    [[-28, 30], [28, 30], [0, 54]].forEach(([x, y]) => P.push([at(new T.BoxGeometry(18, 16, 1), x, y, 35.2), () => TRIM]));
    [-1, 1].forEach(s => [-16, 16].forEach(z => P.push([at(new T.BoxGeometry(1, 16, 18), s * 46.2, 30, z), () => TRIM])));
    P.push([at(new T.BoxGeometry(100, 3, 4), 0, 21, 37), () => SNOW]); // snow along the porch beam
    return R.fpMerge(T, P);
  }
  function windowGeo(T) {
    const P = [];
    [[-28, 30], [28, 30], [0, 54]].forEach(([x, y]) => P.push([at(new T.BoxGeometry(14, 12, 1), x, y, 35.9), () => [1, 1, 1]]));
    [-1, 1].forEach(s => [-16, 16].forEach(z => P.push([at(new T.BoxGeometry(1, 12, 14), s * 46.8, 30, z), () => [1, 1, 1]])));
    return R.fpMerge(T, P);
  }
  function coinGeo(T) {
    const face = new T.CylinderGeometry(7, 7, 1.4, 30); face.rotateX(Math.PI / 2);
    const P = [[face, (x, y, z) => Math.hypot(x, y) > 5.2 ? [1, .86, .42] : [1, .74, .26]]];
    [-1, 1].forEach(s => P.push([at(new T.TorusGeometry(6.3, .75, 6, 30), 0, 0, s * .7), () => [1, .9, .55]]));
    const star = new T.CylinderGeometry(3.2, 3.2, 2.2, 5); star.rotateX(Math.PI / 2); P.push([star, () => [1, .93, .6]]);
    return R.fpMerge(T, P);
  }
  R.fpGeo = Object.assign(R.fpGeo || {}, { lodge: lodgeGeo, lodgeWin: windowGeo, coin: coinGeo });
  function build(T, F3) {
    const inst = (geo, m, n, sh) => { const o = new T.InstancedMesh(geo, m, n); o.frustumCulled = false; o.castShadow = sh; o.instanceMatrix.setUsage(T.DynamicDrawUsage); F3.sc.add(o); return o; };
    X3 = { lod: inst(lodgeGeo(T), new T.MeshStandardMaterial({ vertexColors: true, roughness: .86, metalness: 0 }), 3, true) };
    X3.winM = new T.MeshStandardMaterial({ color: 0x2c3a4e, emissive: 0xffa94a, emissiveIntensity: 0, roughness: .15, metalness: .3 });
    X3.win = inst(windowGeo(T), X3.winM, 3, false);
    X3.coinM = new T.MeshStandardMaterial({ vertexColors: true, color: 0xffd25a, metalness: 1, roughness: .26, emissive: 0x6a3c00, emissiveIntensity: .35 });
    X3.coin = inst(coinGeo(T), X3.coinM, 40, true);
  }
  const lodges = [], coins = [], smoke = [];
  // called from fpHaz inside the 3D frame: o = { Y, put, D, gx, fL, t, pal, rm, bk, T }
  R.fpExtra = function (T3, F3, S, o) {
    if (failed) return;
    try {
      if (!X3) build(T3, F3);
      const { put, gx, t, pal, bk, T } = o, lit = pal.night || R.key === 'sunset';
      if (S.env && X3.coinM.envMap !== S.env) { X3.coinM.envMap = S.env; X3.coinM.needsUpdate = true; }
      X3.winM.emissiveIntensity = lit ? 2.6 + Math.sin(t * 7) * .15 : .05;
      X3.winM.color.set(lit ? 0x6a4a2a : 0x2c3a4e);
      lodges.length = 0; let n = 0;
      for (const L of T.lodges) { const z = L.x - gx; if (z < 14 || z > 2200 || n >= 3) continue;
        const side = A.hash(L.x) > .5 ? 1 : -1, lat = side * 230, wy = T.h(L.x) - bk(lat, z) + 8 * L.s, ry = -side * .45;
        put(X3.lod, n, z, lat, wy, L.s, L.s, ry, 0); put(X3.win, n++, z, lat, wy, L.s, L.s, ry, 0);
        lodges.push({ x: L.x, z, lat, wy, s: L.s, ry }); }
      X3.lod.count = X3.win.count = n; X3.lod.instanceMatrix.needsUpdate = X3.win.instanceMatrix.needsUpdate = true;
      coins.length = 0; let c = 0;
      for (const ob of T.objs) { if (ob.k !== 'coin' || ob.got) continue; const z = ob.x - gx; if (z < 14 || z > 2000 || c >= 40) continue;
        const wy = ob.y - bk(0, z), bob = Math.sin(t * 3 + ob.x * .02) * 1.5;
        put(X3.coin, c++, z, 0, wy + bob, 1.25, 1.25, t * 3.2 + ob.x * .01, 0); coins.push({ x: ob.x, z, wy: wy + bob }); }
      X3.coin.count = c; X3.coin.instanceMatrix.needsUpdate = true;
      R.lodgeOn = R.coinOn = true;
    } catch (e) { failed = true; R.lodgeOn = R.coinOn = false; console.warn('3D lodges/coins off:', e); if (X3) X3.lod.count = X3.win.count = X3.coin.count = 0; }
  };
  // 2D touches over the rendered 3D frame: o = { g, F, cx, hor, eye, gY, fpS, fL, dt, pal, t, G, W }
  R.fpExtraFx = function (g, o) {
    if (failed || !R.lodgeOn) return;
    const { F, cx, hor, eye, gY, fpS, fL, dt, pal, t, G, W } = o, lit = pal.night || R.key === 'sunset', rm = window.cabinet && cabinet.reducedMotion ? .3 : 1;
    const pr = (z, wy, lat) => { const s = F / z; return [cx + (lat - fL) * s, hor + (eye + wy - (gY + fpS * z)) * s, s]; };
    g.save(); g.globalCompositeOperation = 'lighter';
    // warm window light pooling on the snow in front of each lodge
    if (lit) { const wg = R.glow('255,170,90');
      for (const L of lodges) { const [x, y, s] = pr(Math.max(14, L.z - 44 * L.s), L.wy - 8 * L.s, L.lat - Math.sin(L.ry) * 30 * L.s), r = 70 * L.s * s; if (x < -r || x > W + r) continue;
        g.globalAlpha = (pal.night ? .55 : .3) * (1 - L.z / 2400) * (.94 + Math.sin(t * 7 + L.x) * .06); g.drawImage(wg, x - r, y - r * .22, r * 2, r * .44); } }
    // star glints sweeping across the spinning coins
    const sg = R.glow('255,236,170');
    for (const k of coins) { if (k.z > 1100) continue; const [x, y, s] = pr(k.z, k.wy, 0), ph = Math.pow(Math.max(0, Math.sin(t * 3.2 + k.x * .01) ), 18); if (ph < .05) continue;
      const r = Math.max(4, 22 * s) * ph; g.globalAlpha = ph * .9 * (1 - k.z / 1100); g.drawImage(sg, x - r, y - r, r * 2, r * 2);
      g.globalAlpha *= .8; g.drawImage(sg, x - r * 2.4, y - r * .09, r * 4.8, r * .18); g.drawImage(sg, x - r * .09, y - r * 1.6, r * .18, r * 3.2); }
    g.restore();
    // chimney smoke curling off downwind
    for (const L of lodges) if (L.z < 1800 && smoke.length < 90 && Math.random() < dt * 6) {
      const cs = Math.cos(L.ry), sn = Math.sin(L.ry); smoke.push({ x: L.x - (-8 * cs + 26 * sn) * L.s, lat: L.lat + (26 * cs + -8 * sn) * L.s, h: 94 * L.s, gy: L.wy, vx: 6 + Math.random() * 6, r: 5 * L.s, l: 0, L: 3.5 + Math.random() * 1.5 }); }
    const sc = R.glow(pal.night ? '150,160,185' : '235,238,245');
    for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.l += dt; if (p.l > p.L) { smoke.splice(i, 1); continue; }
      p.h += (18 - p.l * 2) * dt * rm; p.lat += (p.vx + (G.wind || 0) * 24 + Math.sin(p.l * 2 + p.x) * 6) * dt * rm; p.r += dt * 7;
      const z = p.x - o.gx; if (z < 14) continue; const [x, y, s] = pr(z, p.gy - p.h, p.lat), r = Math.max(1.5, p.r * s), u = p.l / p.L;
      g.globalAlpha = Math.min(1, p.l * 3) * (1 - u) * .45; g.drawImage(sc, x - r, y - r, r * 2, r * 2); }
    g.globalAlpha = 1;
  };
})(window.App);
