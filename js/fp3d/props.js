(function (A) {
  const R = A.R, X = R.X3;
  // everything standing on the snow: a real spruce forest climbing the valley walls, boulders, and the run's own
  // hazards (snowmen, yetis, rocks, lone spruces), chrome rails, timber lodges with lit windows, gold coins
  const FN = 170, FF = 420;
  function inst(T, geo, mat, n, shadow) { const o = new T.InstancedMesh(geo, mat, n); o.frustumCulled = false; o.castShadow = !!shadow; o.receiveShadow = true; o.instanceMatrix.setUsage(T.DynamicDrawUsage); o.count = 0; X.sc.add(o); return o; }
  X.propsInit = function (T) {
    const Gm = R.fpGeo, D = X.dummy = new T.Object3D();
    const treeM = new T.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0, side: T.DoubleSide });
    const tg = Gm.spruce(T), rg = Gm.boulder(T);
    X.fNear = inst(T, tg, treeM, FN, true); X.fFar = inst(T, tg, treeM, FF, false);
    const c = new T.Color(); [X.fNear, X.fFar].forEach(m => { for (let i = 0; i < m.instanceMatrix.count; i++) { const h = A.hash(i * 4.7); m.setColorAt(i, c.setRGB(.82 + h * .22, .88 + h * .14, .86 + A.hash(i * 2.1) * .16)); } });
    const rockM = new T.MeshStandardMaterial({ vertexColors: true, roughness: .85, metalness: 0, flatShading: true });
    X.boul = inst(T, rg, rockM, 70, true);
    // hazards
    const vm = new T.MeshStandardMaterial({ vertexColors: true, roughness: .8, metalness: 0 });
    X.men = inst(T, Gm.snowman(T), vm, 14, true); X.hRock = inst(T, rg, rockM, 16, true); X.hTree = inst(T, tg, treeM, 16, true);
    const furM = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: .95, sheen: 1, sheenRoughness: .6, sheenColor: 0xdfeaff });
    X.eyeM = new T.MeshStandardMaterial({ color: 0x14202e, emissive: 0x7fd8ff, emissiveIntensity: 0, roughness: .3 });
    const bg = Gm.yetiBody(T), ag = Gm.yetiArm(T), eg = new T.SphereGeometry(1.25, 10, 8); X.yetis = [];
    for (let i = 0; i < 4; i++) { const y = new T.Group(), b = new T.Mesh(bg, furM); b.castShadow = true; y.add(b);
      const arms = [-1, 1].map(s => { const a = new T.Mesh(ag, furM); a.castShadow = true; a.position.set(s * 12, 30, 1); y.add(a); return a; });
      [-1, 1].forEach(s => { const e = new T.Mesh(eg, X.eyeM); e.position.set(s * 2.8, 37.6, 14.4); y.add(e); });
      y.visible = false; X.sc.add(y); X.yetis.push({ g: y, arms }); }
    X.railM = new T.MeshStandardMaterial({ color: 0xe6edf5, metalness: 1, roughness: .14 });
    const cyl = new T.CylinderGeometry(1, 1, 1, 16); X.rails = [];
    for (let i = 0; i < 3; i++) { const m = new T.Mesh(cyl, X.railM); m.castShadow = true; m.visible = false; X.sc.add(m); X.rails.push(m); }
    X.posts = inst(T, cyl, new T.MeshStandardMaterial({ color: 0x3a4250, metalness: .6, roughness: .45 }), 24, true);
    X.lod = inst(T, Gm.lodge(T), new T.MeshStandardMaterial({ vertexColors: true, roughness: .86 }), 3, true);
    X.winM = new T.MeshStandardMaterial({ color: 0x2c3a4e, emissive: 0xffa94a, emissiveIntensity: 0, roughness: .15, metalness: .3 });
    X.win = inst(T, Gm.lodgeWin(T), X.winM, 3, false);
    X.coinM = new T.MeshStandardMaterial({ vertexColors: true, color: 0xffd25a, metalness: 1, roughness: .24, emissive: 0x6a3c00, emissiveIntensity: .3 });
    X.coin = inst(T, Gm.coin(T), X.coinM, 40, true);
    X.magM = new T.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x3aa0ff, emissiveIntensity: 1.6, metalness: .3, roughness: .2 });
    X.mag = inst(T, new T.IcosahedronGeometry(9, 1), X.magM, 4, false);
    // warm pools of window light on the snow at dusk and night
    X.lodgeL = [0, 1].map(() => { const l = new T.PointLight(0xffa858, 0, 700, 1); X.sc.add(l); return l; });
    // your own body, seen only by the sun: it throws your shadow on the snow
    const me = new T.Group(), sm = new T.MeshBasicMaterial({ color: 0 }), torso = new T.Mesh(new T.CapsuleGeometry(7, 22, 4, 8), sm); torso.position.y = 24; me.add(torso);
    const head = new T.Mesh(new T.SphereGeometry(5.5, 10, 8), sm); head.position.y = 42; me.add(head);
    [-1, 1].forEach(s => { const l = new T.Mesh(new T.CapsuleGeometry(3.5, 12, 3, 6), sm); l.position.set(s * 4.5, 8, 0); me.add(l); const k = new T.Mesh(new T.BoxGeometry(2.5, 1, 40), sm); k.position.set(s * 4.5, .6, -4); me.add(k);
      const pole = new T.Mesh(new T.CylinderGeometry(.6, .6, 30, 4), sm); pole.position.set(s * 14, 14, 2); pole.rotation.z = s * .2; me.add(pole); });
    me.traverse(o => { o.layers.set(1); o.castShadow = true; }); X.sc.add(me); X.me = me;
    (X.onGrade = X.onGrade || []).push((pal, key, night) => { const lit = night || key === 'sunset'; X.winM.emissiveIntensity = lit ? 2.6 : .05; X.winM.color.set(lit ? 0x6a4a2a : 0x2c3a4e); X.eyeM.emissiveIntensity = night ? 3.4 : .15; X.lodgeLit = lit;
      X.coinM.envMapIntensity = 1.4; X.railM.envMapIntensity = 1.3; });
  };
  const put = (m, i, x, y, z, s, sy, ry, rz) => { const D = X.dummy; D.position.set(x, y, z); D.rotation.set(0, ry || 0, rz || 0); D.scale.set(s, sy, s); D.updateMatrix(); m.setMatrixAt(i, D.matrix); };
  // o: { T, gx, gY, t, rm, wind, fL }
  X.propsUpdate = function (o) {
    const { T, gx, gY, t, rm, wind } = o, Y = wy => -(wy - gY);
    // forest: world-locked cells; dense clumps on the walls, a few loners near the piste
    let nn = 0, nf = 0; X.nearTrees = X.nearTrees || []; X.nearTrees.length = 0;
    const k0 = Math.floor((gx - 160) / 64), k1 = Math.floor((gx + 5100) / 64);
    for (let k = k0; k <= k1; k++) for (let j = 0; j < 7; j++) {
      const h = A.hash(k * 13.1 + j * 7.7), side = j % 2 ? 1 : -1, lat = side * (275 + Math.pow(A.hash(k * 3.3 + j * 1.9), 1.4) * 2900);
      const clump = A.noise(k * .09 + side * 11 + lat * .0011) * .8 + A.noise(lat * .004 + k * .02) * .3; if (clump < .48 + (Math.abs(lat) < 520 ? .2 : 0)) continue;
      const x = k * 64 + h * 60, z = -(x - gx); if (z > 60 || z < -5150) { continue; }
      const sz = 130 + Math.pow(A.hash(k * 5.1 + j), 1.6) * 300, wy = X.surf(T, x, lat), sway = ((A.noise(t * .45 + lat * .01) - .5) * .05 + wind * .02) * rm;
      if (-z < 1300 && nn < 170) { put(X.fNear, nn++, lat, Y(wy) - 2, z, sz * (.85 + h * .3), sz, h * 6.28, sway); if (-z < 900) X.nearTrees.push(x, lat, sz); }
      else if (nf < 420) put(X.fFar, nf++, lat, Y(wy) - 2, z, sz * (.85 + h * .3), sz, h * 6.28, sway * .5); }
    X.fNear.count = nn; X.fFar.count = nf; X.fNear.instanceMatrix.needsUpdate = X.fFar.instanceMatrix.needsUpdate = true;
    // boulders breaking through along the run's edges and on the walls
    let b = 0; const r0 = Math.floor(gx / 80);
    for (let i = -2; i < 50 && b < 70; i++) { const kk = r0 + i; if (A.hash(kk * 6.1) < .4) continue; const x = kk * 80 + A.hash(kk * 8.3) * 50, z = -(x - gx);
      const side = A.hash(kk * 2.9) < .5 ? -1 : 1, lat = side * (255 + Math.pow(A.hash(kk * 3.7), 1.5) * 1400), s = 8 + Math.pow(A.hash(kk * 1.1), 2.2) * 46;
      put(X.boul, b++, lat, Y(X.surf(T, x, lat)) + s * .25, z, s, s * .8, A.hash(kk) * 6.28);
      if (A.hash(kk * 4.4) > .55 && b < 70) { const s2 = s * .5; put(X.boul, b++, lat + side * s * 1.1, Y(X.surf(T, x + s, lat + side * s * 1.1)) + s2 * .2, z - s * .9, s2, s2 * .8, A.hash(kk * 2) * 6.28); } }
    X.boul.count = b; X.boul.instanceMatrix.needsUpdate = true;
    // the run's hazards, exactly where the game puts them
    let nm = 0, nr = 0, nt = 0, ny = 0, nc = 0, ng = 0;
    for (const ob of T.objs) { const k = ob.k, z = -(ob.x - gx); if (z > 40 || z < -3600 || ob.got) continue;
      if (k === 'coin') { if (nc < 40) put(X.coin, nc++, 0, Y(ob.y) + Math.sin(t * 3 + ob.x * .02) * 1.5, z, 1.3, 1.3, t * 3.2 + ob.x * .01); continue; }
      if (k === 'mag') { if (ng < 4) put(X.mag, ng++, 0, Y(ob.y), z, 1 + Math.sin(t * 6) * .1, 1 + Math.sin(t * 6) * .1, t * 2); continue; }
      const lat = (ob.s - .5) * 24, wy = T.h(ob.x), ry = (ob.s - .5) * .8;
      if (k === 'snowman' && nm < 14) put(X.men, nm++, lat, Y(wy) + 1, z, 1.05, 1.05, ry);
      else if (k === 'rock' && nr < 16) put(X.hRock, nr++, lat, Y(wy) + 4, z, 17, 15, ob.s * 6.28);
      else if (k === 'tree' && nt < 16) put(X.hTree, nt++, lat, Y(wy) - 1, z, 70, 72, ob.s * 6.28);
      else if (k === 'yeti' && ny < 4) { const Yt = X.yetis[ny++], g = Yt.g, ph = t * 8 + ob.x * .01, bob = Math.abs(Math.sin(ph)) * 2 * rm;
        g.visible = true; g.position.set(lat, Y(wy) + bob, z); g.scale.setScalar(1.15); g.rotation.set(0, Math.sin(t * 1.3 + ob.s * 9) * .25 * rm, Math.sin(ph * .5) * .05 * rm);
        Yt.arms.forEach((a, i) => { const s = i ? 1 : -1, w = Math.sin(t * 6 + ob.x * .01 + i * Math.PI) * .45 * rm; a.rotation.set(.35 + w * .4, 0, -s * (.65 + w)); }); } }
    X.men.count = nm; X.hRock.count = nr; X.hTree.count = nt; X.coin.count = nc; X.mag.count = ng;
    [X.men, X.hRock, X.hTree, X.coin, X.mag].forEach(m => m.instanceMatrix.needsUpdate = true);
    for (let i = ny; i < 4; i++) X.yetis[i].g.visible = false;
    // rails on posts
    let ri = 0, pi = 0; const V = X.v3 || (X.v3 = [new X.T.Vector3(), new X.T.Vector3(), new X.T.Vector3(0, 1, 0)]);
    for (const r of T.rails) { const z1 = -(r.x1 - gx), z2 = -(r.x2 - gx); if (z2 > 40 || z1 < -3600 || ri >= 3) continue;
      const a = V[0].set(0, Y(r.y1), z1), bb = V[1].set(0, Y(r.y2), z2), m = X.rails[ri++], L = a.distanceTo(bb);
      m.visible = true; m.position.copy(a).add(bb).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V[2], bb.sub(a).normalize()); m.scale.set(2.2, L, 2.2);
      for (let x = Math.ceil((r.x1 + 20) / 70) * 70; x < r.x2 && pi < 24; x += 70) { const top = Y(r.y1 + (x - r.x1) * r.m), bot = Y(T.h(x));
        put(X.posts, pi++, 0, (top + bot) / 2, -(x - gx), 1.4, Math.max(1, top - bot + 2), 0); } }
    for (let i = ri; i < 3; i++) X.rails[i].visible = false; X.posts.count = pi; X.posts.instanceMatrix.needsUpdate = true;
    // lodges
    let n = 0; X.lodges = X.lodges || []; X.lodges.length = 0;
    for (const L of T.lodges) { const z = -(L.x - gx); if (z > 200 || z < -4800 || n >= 3) continue;
      const side = A.hash(L.x) > .5 ? 1 : -1, lat = side * 330, s = L.s * 1.7, ry = -side * .5, wy = X.surf(T, L.x, lat);
      put(X.lod, n, lat, Y(wy) - 2, z, s, s, ry); put(X.win, n++, lat, Y(wy) - 2, z, s, s, ry); X.lodges.push({ x: L.x, lat, wy, s, ry, z }); }
    X.lod.count = X.win.count = n; X.lod.instanceMatrix.needsUpdate = X.win.instanceMatrix.needsUpdate = true;
    X.lodgeL.forEach((l, i) => { const q = X.lodges[i]; l.intensity = q && X.lodgeLit ? 240 * (.94 + Math.sin(t * 7 + i) * .06) : 0; if (q) l.position.set(q.lat + Math.sin(q.ry) * 62 * q.s, Y(q.wy) + 26 * q.s, q.z + Math.cos(q.ry) * 62 * q.s); });
  };
})(window.App);
