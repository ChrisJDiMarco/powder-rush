(function (A) {
  const R = A.R, X = R.X3;
  // particles living in the 3D world: falling snow, powder kicked off your skis, landing bursts, sloughs off
  // the spruces, chimney smoke, frosty breath and the avalanche's powder cloud rolling past you
  const NP = 520, NF = 900;
  const V = 'attribute float aSize; attribute float aAlpha; attribute vec3 aCol; uniform float uScale; varying float vA; varying vec3 vC;\n' +
    'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; float z = max(1., -mv.z); gl_PointSize = min(300., aSize * uScale / z); vA = aAlpha * smoothstep(1.5, 9., z) * (1. - smoothstep(1800., 4200., z)); vC = aCol; }';
  const F = 'uniform sampler2D uTex; varying float vA; varying vec3 vC; void main(){ float a = texture2D(uTex, gl_PointCoord).a * vA; if (a < .003) discard; gl_FragColor = vec4(vC, a); }';
  function sys(T, n, tex, blend) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('aSize', new T.BufferAttribute(new Float32Array(n), 1).setUsage(T.DynamicDrawUsage));
    g.setAttribute('aAlpha', new T.BufferAttribute(new Float32Array(n), 1).setUsage(T.DynamicDrawUsage));
    g.setAttribute('aCol', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    const m = new T.ShaderMaterial({ uniforms: { uTex: { value: tex }, uScale: { value: 400 } }, vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, blending: blend || T.NormalBlending });
    const o = new T.Points(g, m); o.frustumCulled = false; o.renderOrder = 5; X.sc.add(o); return o;
  }
  const P = [], FL = [];
  X.fxInit = function (T) {
    X.puffs = sys(T, NP, X.puffTex); X.flakes = sys(T, NF, X.flakeTex);
    X.pc = { snow: [1, 1, 1], lit: [1, 1, 1], smoke: [.8, .8, .85], gold: [1, .8, .3] };
    (X.onGrade = X.onGrade || []).push((pal, key, night) => { const s = new T.Color(X.col(pal.sun));
      const sn = night ? [.62, .7, .86] : key === 'sunset' ? [1, .86, .8] : [.97, .98, 1];
      X.pc.snow = sn; X.pc.lit = [Math.min(1, sn[0] * .7 + s.r * .4), Math.min(1, sn[1] * .7 + s.g * .4), Math.min(1, sn[2] * .7 + s.b * .4)];
      X.pc.smoke = night ? [.45, .48, .58] : [.86, .87, .9]; X.pc.flake = night ? [.85, .9, 1] : [1, 1, 1]; });
  };
  // x: run position, wy: world y (down), lat: across; velocities in the same axes
  X.emit = function (x, wy, lat, vx, vy, vl, size, grow, life, alpha, kind, grav) {
    if (P.length >= NP) P.shift();
    P.push({ x, wy, lat, vx, vy, vl, s: size, gs: grow, l: 0, L: life, a: alpha, k: kind || 0, gr: grav == null ? 420 : grav });
  };
  let wasAir = 0, breathT = 0;
  // o: { T, G, p, gx, gY, dt, t, k, fL, eye, wind, rm }
  X.fxUpdate = function (o) {
    const { T, G, p, gx, gY, dt, t, k, fL, eye, wind, rm } = o, sp = p.dead ? 0 : p.speed(), ty = T.type(p.x), E = X.emit, rnd = Math.random;
    // spray off the skis
    if (p.ground && !p.dead) {
      const n = (p.carve ? 4 : 0) + (ty === 2 ? 3 : 0) + (sp > 700 ? 1 : 0) + (rnd() < .4 ? 1 : 0);
      for (let i = 0; i < n; i++) { const s = rnd() < .5 ? -1 : 1, st = (A.input.right ? 1 : 0) - (A.input.left ? 1 : 0);
        const side = p.carve ? (st || s) : s; E(gx + 10 + rnd() * 30, gY - 2, fL + side * (6 + rnd() * 6), p.vx * (.55 + rnd() * .3), -60 - rnd() * (p.carve ? 260 : 140), side * (30 + rnd() * (p.carve ? 220 : 90)), 5 + rnd() * 6, 22, .5 + rnd() * .5, ty === 2 ? .8 : .55, 0); }
    }
    // landing burst
    if (p.ground && wasAir > .35 && !p.dead) { const n = Math.min(40, 14 + wasAir * 14); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, v = 80 + rnd() * 260; E(gx + 10 + rnd() * 20, gY - 2, fL + Math.cos(a) * 8, p.vx * .6 + Math.sin(a) * v * .5, -120 - rnd() * 260, Math.cos(a) * v, 9 + rnd() * 10, 50, .7 + rnd() * .6, .75, 0); } }
    wasAir = p.ground || p.rail || p.dead ? 0 : wasAir + dt;
    if (p.dead && G.crashT < .15) for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, v = 60 + rnd() * 240; E(gx + rnd() * 30, gY - 4, fL + Math.cos(a) * 10, Math.sin(a) * v, -100 - rnd() * 280, Math.cos(a) * v, 12 + rnd() * 14, 60, .9 + rnd() * .7, .85, 0); }
    // snow sloughing off a bough now and then
    const NT = X.nearTrees || []; if (NT.length && rnd() < dt * 1.4) { const i = (rnd() * NT.length / 3 | 0) * 3, x = NT[i], lat = NT[i + 1], sz = NT[i + 2], gyT = X.surf(T, x, lat);
      for (let j = 0; j < 7; j++) E(x + (rnd() - .5) * sz * .3, gyT - sz * (.4 + rnd() * .45), lat + (rnd() - .5) * sz * .3, (rnd() - .5) * 10, 10 + rnd() * 20, (rnd() - .5) * 14 + wind * 20, 5 + rnd() * 6, 12, 1.6 + rnd(), .7, 0, 60); }
    // chimney smoke drifting downwind
    for (const L of (X.lodges || [])) if (L.z > -2800 && rnd() < dt * 7) { const cs = Math.cos(L.ry), sn = Math.sin(L.ry);
      E(L.x + (26 * sn + 8 * cs) * L.s, L.wy - 92 * L.s, L.lat + (26 * cs - 8 * sn) * L.s, 0, -18, 6 + wind * 20, 7 * L.s, 14 * L.s, 3.5 + rnd() * 1.5, .5, 1, -6); }
    // frosty breath
    if (!p.dead && t - breathT > 2.8 - k * 1.3) { breathT = t; for (let i = 0; i < 4; i++) E(gx - 4, (p.y - eye + 4), fL + (rnd() - .5) * 3, p.vx * .9 + 10, -6 - rnd() * 8, (rnd() - .5) * 8, 2.5 + rnd() * 1.5, 7, 1.2, .16, 0, -4); }
    // the avalanche's powder cloud overtakes you from behind
    const al = G.avalLevel || 0; if (al > .05) for (let i = 0; i < al * 6; i++) { const s = rnd() < .5 ? -1 : 1; E(gx - 30, gY - 20 - rnd() * 120, fL + s * (40 + rnd() * 160), sp + 200 + rnd() * 300, -20 - rnd() * 60, s * rnd() * 60, 40 + rnd() * 50, 40, 1.4, .5 * al, 0, 0); }
    // integrate and upload
    const g = X.puffs.geometry, Pp = g.attributes.position, Sz = g.attributes.aSize, Al = g.attributes.aAlpha, Co = g.attributes.aCol;
    let n = 0;
    for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.l += dt; if (q.l >= q.L) { P.splice(i, 1); continue; }
      q.vy += q.gr * dt; const dr = Math.exp(-dt * 1.8); q.vx *= dr; q.vl *= dr; if (q.gr > 100) q.vy *= Math.exp(-dt * .6);
      q.x += q.vx * dt; q.wy += q.vy * dt; q.lat += (q.vl + (q.k === 1 ? wind * 14 : 0)) * dt; q.s += q.gs * dt;
      if (q.gr > 100) { const gy = X.surf(T, q.x, q.lat) - q.s * .3; if (q.wy > gy) { q.wy = gy; q.vy *= -.1; q.vl *= .5; } }
      const u = q.l / q.L, a = q.a * Math.min(1, q.l * 8) * (1 - u) * (1 - u * .3);
      Pp.setXYZ(n, q.lat, -(q.wy - gY), -(q.x - gx)); Sz.setX(n, q.s); Al.setX(n, a);
      const c = q.k === 1 ? X.pc.smoke : (u < .3 ? X.pc.lit : X.pc.snow); Co.setXYZ(n, c[0], c[1], c[2]); n++; }
    g.setDrawRange(0, n); Pp.needsUpdate = Sz.needsUpdate = Al.needsUpdate = Co.needsUpdate = true;
    // falling snow, streaming toward you at speed
    if (!FL.length) for (let i = 0; i < NF; i++) FL.push({ x: gx - 1600 * rnd(), wy: 0, lat: 0, r: 0, s: 0, ph: rnd() * 6 });
    const f = X.flakes.geometry, fp = f.attributes.position, fs = f.attributes.aSize, fa = f.attributes.aAlpha, fc = f.attributes.aCol, fcol = X.pc.flake || [1, 1, 1];
    const camY = p.y - eye;
    for (let i = 0; i < NF; i++) { const q = FL[i];
      let z = -(q.x - gx);
      if (z > 30 || q.wy > camY + 260 || q.wy === 0) { const near = rnd() < .45; q.x = gx + (near ? 20 + rnd() * 240 : 260 + rnd() * 1300); q.lat = fL + (rnd() - .5) * (near ? 260 : 1600); q.wy = camY - 40 - rnd() * 300 + (near ? 120 : 0); q.s = 1.2 + rnd() * 1.4; z = -(q.x - gx); }
      q.wy += (34 + q.s * 10) * dt; q.lat += (wind * 46 + Math.sin(t * 1.3 + q.ph) * 8) * dt; q.x -= wind * 4 * dt;
      fp.setXYZ(i, q.lat, -(q.wy - gY), z); fs.setX(i, q.s * (1 + k * .6)); fa.setX(i, .85); fc.setXYZ(i, fcol[0], fcol[1], fcol[2]); }
    fp.needsUpdate = fs.needsUpdate = fa.needsUpdate = fc.needsUpdate = true;
  };
})(window.App);
