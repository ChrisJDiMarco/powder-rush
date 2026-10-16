(function (A) {
  const R = A.R;
  // real-time 3D forest for the first-person view: snow-laden spruces and half-buried boulders as lit,
  // fogged three.js meshes, placed on the same seeded layout as before; the 2D obstacles and lodges
  // write invisible depth so the trees tuck in front of and behind them correctly
  let F3 = null, failed = false;
  const slough = [];
  const hexOf = c => { if (c[0] === '#') return c; const m = c.match(/\d+/g).map(Number); return '#' + m.map(v => v.toString(16).padStart(2, '0')).join(''); };
  function merge(T, parts) { // [geometry, rgb fn(pos, normal) -> [r,g,b]] -> one non-indexed geometry with vertex colours
    const pos = [], nor = [], col = [];
    for (const [g0, cf] of parts) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); const P = g.attributes.position, N = g.attributes.normal;
      for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); col.push(...cf(P.getX(i), P.getY(i), P.getZ(i), N.getY(i))); } }
    const o = new T.BufferGeometry(); o.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); o.setAttribute('color', new T.Float32BufferAttribute(col, 3)); return o;
  }
  R.fpMerge = merge;
  // shadow catcher: an invisible copy of the slope (lat x depth grid) that only shows the sun's shadows
  const GX = 29, GZ = 46, gzOf = j => 14 * Math.pow(1.105, j);
  function groundGeo(T) {
    const g = new T.BufferGeometry(), idx = []; g.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(GX * GZ * 3), 3));
    for (let j = 0; j < GZ - 1; j++) for (let i = 0; i < GX - 1; i++) { const a = j * GX + i, b = a + 1, c = a + GX, d = c + 1; idx.push(a, b, c, b, d, c); }
    g.setIndex(idx); g.setAttribute('normal', new T.Float32BufferAttribute(new Float32Array(GX * GZ * 3).map((v, i) => i % 3 === 1 ? 1 : 0), 3)); return g;
  }
  const SNOW = [.95, .97, 1], NEEDLE = [.09, .2, .16], NEEDLE2 = [.05, .13, .11], BARK = [.2, .14, .11], ROCK = [.25, .27, .31], ROCK2 = [.15, .16, .2];
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  function spruceGeo(T) {
    const parts = [[new T.CylinderGeometry(.022, .034, .2, 6), () => BARK]];
    const tiers = 9;
    for (let i = 0; i < tiers; i++) {
      const u = i / (tiers - 1), r = (.31 - u * .25) * (.9 + A.hash(i * 5.3) * .2), h = .2 - u * .07, y0 = .08 + u * .78;
      const c = new T.ConeGeometry(r, h, 16, 4, true), P = c.attributes.position;
      for (let j = 0; j < P.count; j++) { const x = P.getX(j), y = P.getY(j), z = P.getZ(j), a = Math.atan2(z, x), lo = (h / 2 - y) / h; // 0 tip .. 1 rim
        const jag = 1 + (A.hash(i * 31 + Math.round(a * 5) * 7) - .5) * .5 * lo, droop = lo > .95 ? -.035 - A.hash(i + a * 3) * .03 : 0;
        P.setX(j, x * jag); P.setZ(j, z * jag); P.setY(j, y + y0 + h / 2 + droop); }
      // snow sits in patches on the upper face of each bough; the dark needles show through underneath and at the rims
      parts.push([c, (x, y, z, ny) => { const lo = A.clamp((y0 + h - y) / h, 0, 1), n = A.hash(Math.round(x * 70) * 3.1 + Math.round(z * 70) * 7.7 + i);
        const s = lo < .2 + n * .35 ? 1 : lo < .6 && n > .55 ? .55 : 0; return lerp3(lo > .9 ? NEEDLE2 : lerp3(NEEDLE, NEEDLE2, n * .6), SNOW, s * (.8 + n * .2)); }]);
    }
    const tip = new T.ConeGeometry(.035, .14, 7); tip.translate(0, .92, 0); parts.push([tip, () => SNOW]);
    const mound = new T.SphereGeometry(.2, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2); mound.scale(1, .22, 1); parts.push([mound, () => SNOW]);
    return merge(T, parts);
  }
  function boulderGeo(T) {
    const g = new T.IcosahedronGeometry(1, 2), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = .78 + A.fbm(x * 1.7 + 3 + z * 1.3) * .5 + (A.hash(Math.round(x * 5) + Math.round(y * 5) * 9 + Math.round(z * 5) * 81) - .5) * .12; P.setXYZ(i, x * n * 1.15, y * n * (y > 0 ? .8 : 1), z * n); }
    return merge(T, [[g, (x, y, z, ny) => { const n = A.hash(Math.round(x * 40) + Math.round(z * 40) * 13); return ny > .42 - n * .2 ? SNOW : lerp3(ROCK2, ROCK, A.clamp(ny + .6, 0, 1) * (.7 + n * .3)); }]]);
  }
  R.fpGeo = Object.assign(R.fpGeo || {}, { spruce: spruceGeo, boulder: boulderGeo });
  function build(T, S) {
    const sc = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, 6, 2300);
    F3 = { sc, cam, key: '', dummy: new T.Object3D() }; F3.dummy.rotation.order = 'ZYX';
    F3.hemi = new T.HemisphereLight(0xbfd8ff, 0xffffff, 1.1); F3.sun = new T.DirectionalLight(0xffffff, 2.2); F3.sun.target.position.set(0, 0, -1);
    sc.add(F3.hemi, F3.sun, F3.sun.target); sc.fog = new T.Fog(0xdce8f6, 150, 2150);
    const tm = new T.MeshStandardMaterial({ vertexColors: true, roughness: .88, metalness: 0, side: T.DoubleSide }), bm = new T.MeshStandardMaterial({ vertexColors: true, roughness: .8, metalness: 0, flatShading: true });
    F3.trees = new T.InstancedMesh(spruceGeo(T), tm, 100); F3.rocks = new T.InstancedMesh(boulderGeo(T), bm, 40);
    const occ = new T.MeshBasicMaterial({ colorWrite: false }); F3.occ = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1).translate(0, .5, -.5), occ, 40); F3.occ.renderOrder = -1;
    [F3.trees, F3.rocks, F3.occ].forEach(m => { m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(m); });
    const c = new T.Color(); for (let i = 0; i < 100; i++) { const h = A.hash(i * 4.7); F3.trees.setColorAt(i, c.setRGB(.86 + h * .2, .9 + h * .14, .88 + A.hash(i * 2.1) * .14)); }
    // real-time sun shadows: spruces, boulders and hazards throw soft shadows down the slope
    S.r.shadowMap.enabled = true; S.r.shadowMap.type = T.PCFSoftShadowMap;
    F3.trees.castShadow = F3.rocks.castShadow = true;
    const sh = F3.sun.shadow; F3.sun.castShadow = true; sh.mapSize.set(1024, 1024); sh.bias = -.0006; sh.normalBias = 1.5; sh.radius = 3;
    Object.assign(sh.camera, { left: -820, right: 820, top: 820, bottom: -820, near: 1, far: 4000 }); sh.camera.updateProjectionMatrix();
    F3.gMat = new T.ShadowMaterial({ color: 0x1c2f66, opacity: .34, depthWrite: false });
    F3.ground = new T.Mesh(groundGeo(T), F3.gMat); F3.ground.receiveShadow = true; F3.ground.frustumCulled = false; F3.ground.renderOrder = -2; sc.add(F3.ground);
    F3.sdir = new T.Vector3(1, 1, .3).normalize();
  }
  const OCC = { rock: [28, 15], tree: [16, 54], snowman: [18, 45], yeti: [24, 45] };
  // o: { W, H, d, F, hor, cx, eye, gx, gY, fpS, fL, pal, t, rm, dt, bk, T: terrain, G }
  R.fpForest = function (g, o) {
    const T3 = A.THREE; if (!T3 || failed || !R.fpGL) return false;
    try {
      const S = R.fpGL(); if (!S) return false;
      if (!F3) build(T3, S);
      const { W, H, d, F, hor, cx, eye, gx, gY, fpS, fL, pal, t, rm, dt, bk, T, G } = o;
      const pw = Math.round(W * d), ph = Math.round(H * d);
      if (S.cv.width !== pw || S.cv.height !== ph) { S.r.setPixelRatio(d); S.r.setSize(W, H, false); }
      if (F3.key !== R.key) { F3.key = R.key; const n = pal.night ? 1 : 0;
        F3.sc.fog.color.set(hexOf('rgb(' + pal.fog + ')')); F3.hemi.color.set(pal.sky[1]); F3.hemi.groundColor.set(pal.snow); F3.hemi.intensity = n ? .5 : 1.05;
        F3.sun.color.set(hexOf('rgb(' + pal.sun + ')')); F3.sun.intensity = n ? .7 : pal.rays > .1 ? 2.1 : 2.5; F3.sdir.set(pal.sp[0] > .5 ? 1.3 : -1.3, Math.max(.45, 1.5 - pal.sp[1] * 2), .35).normalize(); F3.gMat.opacity = n ? .26 : pal.rays > .1 ? .3 : .36; F3.gMat.color.set(n ? 0x050a1e : 0x1c2f66); }
      const Hf = 2 * Math.max(hor, H - hor), cam = F3.cam; cam.fov = 2 * Math.atan(Hf / 2 / F) * 57.2958; cam.aspect = W / Hf; cam.setViewOffset(W, Hf, 0, Hf / 2 - hor, W, H); cam.updateProjectionMatrix();
      const Y = (z, wy) => -(eye + wy - (gY + fpS * z)), D = F3.dummy;
      const put = (m, i, z, lat, wy, s, sy, ry, rz) => { D.position.set(lat - fL, Y(z, wy), -z); D.rotation.set(0, ry, rz); D.scale.set(s, sy, s); D.updateMatrix(); m.setMatrixAt(i, D.matrix); };
      // spruces: same seeded rows as the old sprite forest
      let n = 0; const k0 = Math.floor(gx / 55), wind = (G.wind || 0) * .04;
      const tree = (z, lat, sz, seed) => { if (z < 14 || n >= 100) return; const sx = cx + (lat - fL) * F / z; if (sx < -W * .7 || sx > W * 1.7) return;
        const sway = ((A.noise(t * .5 + lat * .013) - .5) * .09 + wind) * rm, s = 66 * sz;
        put(F3.trees, n++, z, lat, T.h(gx + z) - bk(lat, z), s * (.92 + A.hash(seed) * .2), s, A.hash(seed * 1.3) * 6.28, -sway);
        // a bough sheds its load now and then: powder sloughs off and drifts down
        if (z > 120 && z < 650 && slough.length < 70 && Math.random() < dt * .08) for (let j = 0; j < 4; j++) slough.push({ x: gx + z, lat: lat + (Math.random() - .5) * s * .4, h: s * (.45 + Math.random() * .4), vy: 4 + Math.random() * 10, vx: (Math.random() - .5) * 8, r: 3 + Math.random() * 4, l: 1.6 + Math.random() * .8, L: 2.4 }); };
      for (let i = 1; i < 40; i++) { const kk = k0 + i, z = kk * 55 - gx, side = A.hash(kk * 3.3) < .5 ? -1 : 1;
        tree(z, side * (110 + A.hash(kk * 7.1) * 420), .8 + A.hash(kk * 1.9) * .9, kk);
        if (A.hash(kk * 5.7) > .4) tree(z + 20, -side * (140 + A.hash(kk * 2.3) * 500), .7 + A.hash(kk * 4.1), kk + .5); }
      F3.trees.count = n; F3.trees.instanceMatrix.needsUpdate = true;
      // boulders breaking through the snow along the run's edges
      let b = 0; const r0 = Math.floor(gx / 90);
      for (let i = 1; i < 26 && b < 40; i++) { const kk = r0 + i, z = kk * 90 + A.hash(kk * 8.3) * 40 - gx; if (z < 14 || A.hash(kk * 6.1) < .45) continue;
        const side = A.hash(kk * 2.9) < .5 ? -1 : 1, lat = side * (150 + A.hash(kk * 3.7) * 480), s = 9 + Math.pow(A.hash(kk * 1.1), 2) * 26;
        put(F3.rocks, b++, z, lat, T.h(gx + z) - bk(lat, z) + s * .4, s, s * .85, A.hash(kk) * 6.28, 0);
        if (A.hash(kk * 4.4) > .6 && b < 40) { const s2 = s * .45; put(F3.rocks, b++, z + s * .9, lat + side * s * 1.2, T.h(gx + z) - bk(lat, z) + s2 * .4, s2, s2 * .8, A.hash(kk * 2) * 6.28, 0); } }
      F3.rocks.count = b; F3.rocks.instanceMatrix.needsUpdate = true;
      // hazards and rails as real 3D models; the slope copy catches every shadow
      R.hazOn = R.fpHaz ? R.fpHaz(T3, F3, S, { Y, put, D, gx, fL, t, pal, rm, bk, T }) : false;
      { const P = F3.ground.geometry.attributes.position;
        for (let j = 0; j < GZ; j++) { const z = gzOf(j), h = T.h(gx + z); for (let i = 0; i < GX; i++) { const lat = (i / (GX - 1) - .5) * 2000 + fL; P.setXYZ(j * GX + i, lat - fL, Y(z, h - bk(lat, z)), -z); } }
        P.needsUpdate = true; const tz = 420, tg = F3.sun.target.position.set(0, Y(tz, T.h(gx + tz)), -tz); F3.sun.position.copy(tg).addScaledVector(F3.sdir, 1800); }
      // depth stand-ins for the 2D obstacles and lodges
      let q = 0;
      for (const ob of T.objs) { const z = ob.x - gx, sz = OCC[ob.k]; if (!sz || R.hazOn || ob.got || z < 14 || z > 2000 || q >= 40) continue; const lat = (ob.s - .5) * 24;
        put(F3.occ, q++, z, lat, T.h(ob.x) - bk(lat, z), 1, 1, 0, 0); D.scale.set(sz[0], sz[1], 14); D.updateMatrix(); F3.occ.setMatrixAt(q - 1, D.matrix); }
      for (const L of T.lodges) { const z = L.x - gx; if (R.lodgeOn || z < 14 || z > 2200 || q >= 40) continue; const lat = (A.hash(L.x) > .5 ? 1 : -1) * 230;
        put(F3.occ, q++, z, lat, T.h(L.x) - bk(lat, z), 1, 1, 0, 0); D.scale.set(108 * L.s, 76 * L.s, 70 * L.s); D.updateMatrix(); F3.occ.setMatrixAt(q - 1, D.matrix); }
      F3.occ.count = q; F3.occ.instanceMatrix.needsUpdate = true;
      S.r.render(F3.sc, cam);
      g.save(); g.drawImage(S.cv, 0, 0, W, H); g.restore();
      // sloughing powder, lit by the key light
      const pc = R.glow(pal.night ? '200,215,245' : '252,253,255');
      for (let i = slough.length - 1; i >= 0; i--) { const p = slough[i]; p.l -= dt; p.h -= p.vy * dt; p.vy += 26 * dt; p.lat += (p.vx + (G.wind || 0) * 30) * dt; p.r += dt * 9;
        const z = p.x - gx; if (p.l <= 0 || z < 14 || p.h < 0) { slough.splice(i, 1); continue; }
        const s = F / z, sx = cx + (p.lat - fL) * s, sy = hor + (eye + T.h(p.x) - bk(p.lat, z) - p.h - (gY + fpS * z)) * s, r = Math.max(1.2, p.r * s);
        g.globalAlpha = Math.min(1, p.l) * Math.min(1, (p.L - p.l) * 4) * .55; g.drawImage(pc, sx - r, sy - r, r * 2, r * 2); }
      g.globalAlpha = 1;
      if (R.fpExtraFx) R.fpExtraFx(g, { F, cx, hor, eye, gY, fpS, fL, dt, pal, t, G, W, gx });
      return true;
    } catch (e) { failed = true; console.warn('3D forest off:', e); return false; }
  };
  // carved ski tracks: twin grooves with a shaded inner wall and a lip catching the key light, tapering to the horizon
  R.fpTracks = function (g, o) {
    const { cx, W, H, hor, fL, lean, pal, sDir } = o, sh = pal.night ? '40,58,110' : '105,135,185', li = pal.night ? '170,190,240' : pal.sun;
    [-1, 1].forEach(s => { const bx = cx + s * W * .16 - fL * 4, mx = cx + s * W * .05 - lean * W * 1.6, ex = cx, ey = hor + 6;
      [-1, 1].forEach(e => { const L = [], Rr = [];
        for (let i = 0; i <= 18; i++) { const u = i / 18, a = (1 - u) * (1 - u), b2 = 2 * u * (1 - u), c = u * u, x = a * bx + b2 * mx + c * ex, y = a * H * 1.1 + b2 * (hor + H * .2) + c * ey, w = (1 - u) * (1 - u) * W * .012 + .3, off = e * (1 - u) * (1 - u) * W * .022;
          L.push(x + off - w, y); Rr.push(x + off + w, y); }
        const poly = (pts, st) => { g.beginPath(); for (let i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); for (let i = Rr.length - 2; i >= 0; i -= 2) g.lineTo(Rr[i], Rr[i + 1]); g.closePath(); g.fillStyle = st; g.fill(); };
        poly(L, 'rgba(' + sh + ',.3)');
        g.lineWidth = 1; g.strokeStyle = 'rgba(' + li + ',' + (pal.night ? .18 : .45) + ')'; g.beginPath(); const lip = e * sDir > 0 ? Rr : L; for (let i = 0; i < lip.length; i += 2) g.lineTo(lip[i] + e * .6, lip[i + 1] - .5); g.stroke(); }); });
  };
})(window.App);
