(function (A) {
  const R = A.R;
  // bloom: a tiny copy of the frame, raised to the 4th power so only the brights survive, blurred by scaling, added back
  let b1 = null, b2 = null;
  R.fpBloom = function (g, o) {
    const { W, H, pal } = o, w = Math.max(8, W / 8 | 0), h = Math.max(8, H / 8 | 0);
    if (!b1 || b1.width !== w || b1.height !== h) { b1 = R.mk(w, h); b2 = R.mk(w / 2, h / 2); }
    const x = b1.getContext('2d'), y = b2.getContext('2d');
    x.globalCompositeOperation = 'copy'; x.imageSmoothingQuality = 'high'; x.drawImage(g.canvas, 0, 0, w, h);
    x.globalCompositeOperation = 'multiply'; x.drawImage(b1, 0, 0); x.drawImage(b1, 0, 0); x.drawImage(b1, 0, 0);
    y.globalCompositeOperation = 'copy'; y.drawImage(b1, 0, 0, b2.width, b2.height);
    x.globalCompositeOperation = 'copy'; x.drawImage(b2, 0, 0, w, h);
    g.save(); g.setTransform(R.dpr, 0, 0, R.dpr, 0, 0); g.globalCompositeOperation = 'lighter'; g.imageSmoothingQuality = 'high';
    g.globalAlpha = pal.night ? .45 : .08; g.drawImage(b1, 0, 0, W, H);
    g.globalAlpha = pal.night ? .3 : .06; g.drawImage(b2, -W * .04, -H * .04, W * 1.08, H * 1.08);
    g.restore();
  };
  // lens dirt: specks, droplet rings and smudges on the goggle that only show when they catch the light
  let dirt = null;
  function makeDirt() {
    const w = 360, h = 450, c = R.mk(w, h), x = c.getContext('2d'), rnd = A.rng(2727), gw = R.glow('255,255,255');
    const edge = () => { let px, py, e; do { px = rnd() * w; py = rnd() * h; e = Math.max(Math.abs(px / w - .5), Math.abs(py / h - .5)) * 2; } while (rnd() > e * e + .15); return [px, py]; };
    for (let i = 0; i < 9; i++) { const [px, py] = edge(), r = 30 + rnd() * 60; x.save(); x.translate(px, py); x.rotate(rnd() * 3); x.globalAlpha = .1 + rnd() * .1; x.drawImage(gw, -r, -r * .35, r * 2, r * .7); x.restore(); }
    for (let i = 0; i < 70; i++) { const [px, py] = edge(), r = 1.5 + Math.pow(rnd(), 3) * 14; x.globalAlpha = .25 + rnd() * .5; x.drawImage(gw, px - r, py - r, r * 2, r * 2); }
    x.strokeStyle = '#fff'; for (let i = 0; i < 14; i++) { const [px, py] = edge(), r = 4 + rnd() * 12; x.globalAlpha = .18 + rnd() * .2; x.lineWidth = .8 + rnd(); x.beginPath(); x.arc(px, py, r, 0, 7); x.stroke(); }
    x.lineWidth = .6; for (let i = 0; i < 6; i++) { const [px, py] = edge(), a = rnd() * 3, l = 20 + rnd() * 60; x.globalAlpha = .14; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + 8, py + Math.sin(a) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    return c;
  }
  R.fpDirt = function (g, o) {
    const { W, H, pal, cx } = o; if (!dirt) dirt = makeDirt();
    const sx = W * pal.sp[0], sy = H * pal.sp[1], near = 1 - Math.min(1, Math.hypot(sx - cx, sy - H * .45) / (W * .9));
    const a = pal.night ? .12 + (pal.aurora ? .06 : 0) : .18 + near * .4; if (a < .02) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.drawImage(dirt, 0, 0, W, H);
    g.restore();
    // the part of the lens nearest the light flares up through the dirt
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .9; g.beginPath(); g.arc(sx, sy, W * .5, 0, 7); g.clip(); g.drawImage(dirt, 0, 0, W, H); g.restore();
  };
  // landing burst: powder explodes out from under the skis and blows past the lens
  const puffs = []; let wasAir = 0;
  R.fpBurst = function (g, o) {
    const { W, H, cx, p, dt, pal } = o;
    if (p.ground && wasAir > .35 && !p.dead) { const n = Math.min(26, 10 + wasAir * 10); for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1, a = -Math.PI / 2 + s * (.5 + Math.random() * 1.1); const v = 260 + Math.random() * 420; puffs.push({ x: cx + s * W * (.05 + Math.random() * .22), y: H * (.86 + Math.random() * .1), vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7, r: 14 + Math.random() * 22, l: .7 + Math.random() * .5, m: 1.2 }); } }
    wasAir = p.ground || p.rail || p.dead ? 0 : wasAir + dt;
    if (!puffs.length) return;
    const c = R.glow(pal.night ? '210,222,250' : '252,253,255'), lit = R.glow(pal.sun);
    for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.l -= dt; if (q.l <= 0) { puffs.splice(i, 1); continue; }
      q.vy += 380 * dt; q.vx *= 1 - dt * 1.6; q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 90;
      const k = Math.min(1, q.l / q.m * 1.6); g.globalAlpha = k * .55; g.drawImage(c, q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      if (!pal.night) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = k * .25; g.drawImage(lit, q.x - q.r * .5, q.y - q.r * .6, q.r, q.r); g.globalCompositeOperation = 'source-over'; } }
    g.globalAlpha = 1;
  };
  // mirrored goggle lens: a thin-film rainbow sheen along the rims that slides as you lean, and the foam frame edge
  R.fpGoggle = function (g, o) {
    const { W, H, cx, lean, t, pal } = o, sh = (lean / W) * 2 + Math.sin(t * .3) * .15;
    g.save(); g.globalCompositeOperation = 'lighter';
    const film = (x0, y0, x1, y1, a) => { const gr = g.createLinearGradient(x0, y0, x1, y1), hues = ['255,90,170', '255,190,80', '120,255,170', '80,180,255', '170,110,255'];
      hues.forEach((c, i) => gr.addColorStop(Math.min(1, Math.max(0, i / 4 * .8 + .1 + sh * .2)), 'rgba(' + c + ',' + a + ')')); return gr; };
    const a = pal.night ? .05 : .09;
    g.lineWidth = W * .06; g.strokeStyle = film(0, 0, W, H * .3, a); g.beginPath(); g.ellipse(cx, H * .62, W * .78, H * .66, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.lineWidth = W * .04; g.strokeStyle = film(W, H, 0, H * .7, a * .8); g.beginPath(); g.ellipse(cx, H * .3, W * .74, H * .72, 0, Math.PI * .12, Math.PI * .88); g.stroke();
    g.restore();
    // soft dark foam rim bleeding in at the corners of the lens
    const rim = (x, y, rx, ry) => { const gr = g.createRadialGradient(x, y, 0, x, y, 1); gr.addColorStop(0, 'rgba(6,8,16,.7)'); gr.addColorStop(1, 'rgba(6,8,16,0)'); g.save(); g.translate(x, y); g.scale(rx, ry); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 1, 0, 7); g.fill(); g.restore(); };
    rim(-W * .02, -H * .02, W * .2, H * .12); rim(W * 1.02, -H * .02, W * .2, H * .12);
  };
})(window.App);
(function (A) {
  const R = A.R;
  // real 3D hazards for the first-person view: carrot-nosed snowmen in scarves and top hats, shaggy yetis
  // with glowing eyes, snow-capped rocks, hazard spruces and chrome grind rails, all in the forest's lit,
  // fogged, shadow-casting scene and placed exactly where the 2D game puts them
  let H3 = null, failed = false;
  const SNOW = [.95, .97, 1], COAL = [.07, .07, .09], CARROT = [1, .45, .12], SCARF = [.82, .16, .18], SCARF2 = [.98, .9, .86], HAT = [.1, .1, .13], STICK = [.32, .2, .12];
  const FUR = [.9, .94, .99], FUR2 = [.66, .76, .9], FACE = [.5, .66, .82], FANG = [1, .98, .94];
  function snowmanGeo(T) {
    const M = R.fpMerge, P = [], at = (g, x, y, z) => { g.translate(x, y, z); return g; };
    const ball = (r, y) => P.push([at(new T.SphereGeometry(r, 22, 16), 0, y, 0), (x, yy, z, ny) => { const n = A.hash(Math.round(x * 3) * 7 + Math.round(yy * 3) * 13 + Math.round(z * 3)); return [SNOW[0] - n * .04, SNOW[1] - n * .03, SNOW[2]]; }]);
    ball(11, 10); ball(8, 26); ball(6, 38);
    const nose = new T.ConeGeometry(1.3, 7, 10); nose.rotateX(Math.PI / 2); P.push([at(nose, 0, 38, 9), () => CARROT]);
    [-2.2, 2.2].forEach(x => P.push([at(new T.SphereGeometry(.9, 8, 6), x, 40.4, 5.4), () => COAL]));
    for (let i = 0; i < 5; i++) { const a = -.7 + i * .35; P.push([at(new T.SphereGeometry(.55, 6, 5), Math.sin(a) * 3.2, 35.6 - Math.cos(a) * 1.2 + 1.2, 5.2), () => COAL]); }
    [29.5, 25.5, 21.5].forEach(y => P.push([at(new T.SphereGeometry(.95, 8, 6), 0, y, Math.sqrt(64 - (y - 26) * (y - 26)) + .2), () => COAL]));
    const sc = new T.TorusGeometry(6.2, 1.7, 8, 26); sc.rotateX(Math.PI / 2); P.push([at(sc, 0, 32.6, 0), (x) => Math.floor((x + 9) / 2.4) % 2 ? SCARF : SCARF2]);
    const tail = new T.BoxGeometry(3, 9, 1.2); tail.rotateZ(.25); P.push([at(tail, 3.5, 28, 6.3), (x, y) => Math.floor((y + 2) / 2.2) % 2 ? SCARF : SCARF2]);
    P.push([at(new T.CylinderGeometry(7.4, 7.4, 1.2, 20), 0, 43.3, 0), () => HAT]);
    P.push([at(new T.CylinderGeometry(4.6, 4.9, 7, 20), 0, 47.4, 0), (x, y) => y < 45.2 ? SCARF : HAT]);
    [-1, 1].forEach(s => { const a = new T.CylinderGeometry(.5, .8, 15, 5); a.rotateZ(s * -1.05); P.push([at(a, s * 13.5, 30, 0), () => STICK]);
      const f = new T.CylinderGeometry(.35, .5, 5, 4); f.rotateZ(s * -.3); P.push([at(f, s * 19.5, 35.5, 0), () => STICK]); });
    return M(T, P);
  }
  function yetiBodyGeo(T) { // a shaggy egg of fur with a pale face mask and fangs
    const body = new T.IcosahedronGeometry(1, 4), P = body.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), sh = 1 + (A.hash(Math.round(x * 24) * 7.3 + Math.round(y * 24) * 3.1 + Math.round(z * 24) * 11.7) - .5) * .16 + A.fbm(y * 4 + x * 2 + 9) * .08;
      P.setXYZ(i, x * 14 * sh, (y + 1) * 24 * (y < 0 ? 1 : sh), z * 12 * sh); }
    const face = new T.SphereGeometry(1, 18, 12); face.scale(7.4, 6.4, 3.4); face.translate(0, 36, 11.6);
    const parts = [[body, (x, y, z, ny) => { const k = A.clamp(ny * .5 + .5 + (y - 20) / 60, 0, 1), n = A.hash(Math.round(x * 2) * 5 + Math.round(y * 2) * 9 + Math.round(z * 2)); return [FUR2[0] + (FUR[0] - FUR2[0]) * k - n * .05, FUR2[1] + (FUR[1] - FUR2[1]) * k - n * .04, FUR2[2] + (FUR[2] - FUR2[2]) * k]; }], [face, () => FACE]];
    [-1, 1].forEach(s => { const f = new T.ConeGeometry(.8, 2.6, 6); f.rotateX(Math.PI); f.translate(s * 2.4, 31.8, 14.1); parts.push([f, () => FANG]); });
    const brow = new T.BoxGeometry(11, 1.6, 3); brow.translate(0, 40.8, 12.4); parts.push([brow, () => FUR2]);
    return R.fpMerge(T, parts);
  }
  function armGeo(T) { const g = new T.CapsuleGeometry(3.6, 15, 4, 10); g.translate(0, 10, 0); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const sh = 1 + (A.hash(i * 1.7) - .5) * .22; P.setX(i, P.getX(i) * sh); P.setZ(i, P.getZ(i) * sh); }
    const claw = []; for (let j = -1; j <= 1; j++) { const c = new T.ConeGeometry(.6, 3, 5); c.translate(j * 1.8, 22.5, 1.5); claw.push([c, () => FANG]); }
    return R.fpMerge(T, [[g, (x, y) => y > 18 ? FUR2 : FUR]].concat(claw)); }
  R.fpGeo = Object.assign(R.fpGeo || {}, { snowman: snowmanGeo, yetiBody: yetiBodyGeo, yetiArm: armGeo });
  function build(T, F3, S) {
    const sc = F3.sc, mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .82, metalness: 0 });
    const inst = (geo, m, n) => { const o = new T.InstancedMesh(geo, m, n); o.frustumCulled = false; o.castShadow = true; o.instanceMatrix.setUsage(T.DynamicDrawUsage); sc.add(o); return o; };
    H3 = { men: inst(snowmanGeo(T), mat, 14), rocks: inst(F3.rocks.geometry, F3.rocks.material, 16), trees: inst(F3.trees.geometry, F3.trees.material, 16), yetis: [] };
    const furM = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: .95, sheen: 1, sheenRoughness: .6, sheenColor: 0xdfeaff }); // soft fur, not faceted rock
    H3.eyeM = new T.MeshStandardMaterial({ color: 0x14202e, emissive: 0x7fd8ff, emissiveIntensity: 0, roughness: .3 });
    const bg = yetiBodyGeo(T), ag = armGeo(T), eg = new T.SphereGeometry(1.25, 10, 8);
    for (let i = 0; i < 4; i++) { const y = new T.Group(), b = new T.Mesh(bg, furM); b.castShadow = true; y.add(b);
      const arms = [-1, 1].map(s => { const a = new T.Mesh(ag, furM); a.castShadow = true; a.position.set(s * 12, 30, 1); y.add(a); return a; });
      [-1, 1].forEach(s => { const e = new T.Mesh(eg, H3.eyeM); e.position.set(s * 2.8, 37.6, 14.4); y.add(e); });
      y.visible = false; sc.add(y); H3.yetis.push({ g: y, arms }); }
    // chrome grind rail with posts, reflecting the run's sky
    H3.railM = new T.MeshStandardMaterial({ color: 0xe6edf5, metalness: 1, roughness: .16 });
    H3.postM = new T.MeshStandardMaterial({ color: 0x3a4250, metalness: .6, roughness: .45 });
    H3.rails = []; const cyl = new T.CylinderGeometry(1, 1, 1, 14);
    for (let i = 0; i < 3; i++) { const m = new T.Mesh(cyl, H3.railM); m.castShadow = true; m.visible = false; sc.add(m); H3.rails.push(m); }
    H3.posts = inst(cyl, H3.postM, 24);
  }
  const V = (T, x, y, z) => new T.Vector3(x, y, z);
  // o: { Y, put, D, gx, fL, t, pal, rm, bk, T }
  R.fpHaz = function (T3, F3, S, o) {
    if (failed) return false;
    try {
      if (!H3) build(T3, F3, S);
      const { Y, put, D, gx, fL, t, pal, rm, bk, T } = o, night = pal.night ? 1 : 0;      if (S.env && H3.railM.envMap !== S.env) { H3.railM.envMap = S.env; H3.railM.needsUpdate = true; }
      H3.eyeM.emissiveIntensity = night ? 3.2 + Math.sin(t * 5) * .6 : .15;
      let nm = 0, nr = 0, nt = 0, ny = 0;
      for (const ob of T.objs) { const k = ob.k; if (k === 'coin' || k === 'mag' || ob.got) continue; const z = ob.x - gx; if (z < 14 || z > 2000) continue;
        const lat = (ob.s - .5) * 24, wy = T.h(ob.x) - bk(lat, z), ry = (ob.s - .5) * .8;
        if (k === 'snowman' && nm < 14) put(H3.men, nm++, z, lat, wy + 1.5, 1, 1, ry, 0);
        else if (k === 'rock' && nr < 16) put(H3.rocks, nr++, z, lat, wy + 3, 16, 15, ob.s * 6.28, 0);
        else if (k === 'tree' && nt < 16) put(H3.trees, nt++, z, lat, wy, 64, 62, ob.s * 6.28, 0);
        else if (k === 'yeti' && ny < 4) { const Yt = H3.yetis[ny++], g = Yt.g, ph = t * 8 + ob.x * .01, bob = Math.sin(ph) * 1.5 * rm;
          g.visible = true; g.position.set(lat - fL, Y(z, wy) + bob, -z); g.rotation.set(0, Math.sin(t * 1.3 + ob.s * 9) * .25 * rm, Math.sin(ph * .5) * .05 * rm);
          Yt.arms.forEach((a, i) => { const s = i ? 1 : -1, w = Math.sin(t * 6 + ob.x * .01 + i * Math.PI) * .45 * rm; a.rotation.set(.35 + w * .4, 0, -s * (.65 + w)); }); } }
      H3.men.count = nm; H3.rocks.count = nr; H3.trees.count = nt; [H3.men, H3.rocks, H3.trees].forEach(m => m.instanceMatrix.needsUpdate = true);
      for (let i = ny; i < 4; i++) H3.yetis[i].g.visible = false;
      // rails
      let ri = 0, pi = 0;
      for (const r of T.rails) { const z1 = Math.max(14, r.x1 - gx), z2 = r.x2 - gx; if (z2 < 14 || z1 > 2000 || ri >= 3) continue;
        const y1 = r.y1 + (gx + z1 - r.x1) * r.m, a = V(T3, -fL, Y(z1, y1), -z1), b = V(T3, -fL, Y(z2, r.y2), -z2), m = H3.rails[ri++], d = b.clone().sub(a), L = d.length();
        m.visible = true; m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(T3, 0, 1, 0), d.normalize()); m.scale.set(2.2, L, 2.2);
        for (let x = Math.ceil((r.x1 + 20) / 70) * 70; x < r.x2 && pi < 24; x += 70) { const z = x - gx; if (z < 14) continue; const ry2 = r.y1 + (x - r.x1) * r.m, gy = T.h(x) - bk(0, z), top = Y(z, ry2), bot = Y(z, gy);
          D.position.set(-fL, (top + bot) / 2, -z); D.rotation.set(0, 0, 0); D.scale.set(1.3, Math.max(1, top - bot + 2), 1.3); D.updateMatrix(); H3.posts.setMatrixAt(pi++, D.matrix); } }
      for (let i = ri; i < 3; i++) H3.rails[i].visible = false;
      H3.posts.count = pi; H3.posts.instanceMatrix.needsUpdate = true;
      if (R.fpExtra) R.fpExtra(T3, F3, S, o);
      return true;
    } catch (e) { failed = true; console.warn('3D hazards off:', e); if (H3) { [H3.men, H3.rocks, H3.trees, H3.posts].forEach(m => m.count = 0); H3.yetis.forEach(y => y.g.visible = false); H3.rails.forEach(m => m.visible = false); } return false; }
  };
})(window.App);
