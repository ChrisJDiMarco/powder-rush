(function (A) {
  const R = A.R, X = R.X3;
  // the land: the run itself as a real lit, shadow-catching snow surface carved between rising valley walls,
  // old ski tracks grooved into it, and 3D mountain ranges plus a photoreal panorama out on the horizon
  const DX = 24, COLS = 65, N1 = 74, N2 = 74, ROWS = N1 + N2;
  const LATS = []; for (let i = 0; i < COLS; i++) { const u = i / (COLS - 1) * 2 - 1; LATS.push(Math.sign(u) * Math.pow(Math.abs(u), 1.75) * 3200); }
  const rowX = (x0, j) => j < N1 ? x0 + j * DX : x0 + N1 * DX + (j - N1) * DX * 2;
  // height above the run's own spline: the groomed piste is flat, the walls rise and roll toward the treeline
  X.rise = function (x, lat) { const b = Math.abs(lat) - 240; if (b <= 0) return 0;
    const n = A.noise(x * .0021 + lat * .0013 + (lat > 0 ? 40 : 0)) * .7 + A.noise(x * .007 + lat * .004) * .3;
    return 1500 * (1 - Math.exp(-b * b / 1.6e6)) + b * .22 + (n - .4) * Math.min(1, b / 260) * 260; };
  // kickers, cliffs and moguls are shaped into the piste itself; off to the sides they melt into a smoothed slope
  X.hs = (T, x) => (T.h(x - 450) + T.h(x - 300) * 2 + T.h(x - 150) * 3 + T.h(x) * 3 + T.h(x + 150) * 3 + T.h(x + 300) * 2 + T.h(x + 450)) / 15;
  X.mixW = lat => { const a = A.clamp((Math.abs(lat) - 130) / 200, 0, 1); return a * a * (3 - 2 * a); };
  // the walls bend the slope's rolls so no ridge runs ruler-straight across the valley
  X.bend = (x, lat, w) => x + (Math.sin(lat * .0031 + 1.3) * 190 + Math.sin(lat * .0087) * 60) * w;
  X.surf = (T, x, lat) => { const w = X.mixW(lat), h = T.h(x); return (w > 0 ? h + (X.hs(T, X.bend(x, lat, w)) - T.h(X.bend(x, lat, w * .0))) * w : h) - X.rise(x, lat); }; // world screen-y (down) of the snow
  function snowMat(T) {
    const m = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .66, metalness: 0, envMapIntensity: .55 });
    m.userData.u = { uGlit: { value: new T.Color(1, 1, 1) } };
    m.onBeforeCompile = s => { s.uniforms.uGlit = m.userData.u.uGlit;
      s.fragmentShader = 'uniform vec3 uGlit;\n' + s.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
      #ifdef USE_MAP
      { vec2 gc = floor(vMapUv * 140.); float gh = fract(sin(dot(gc, vec2(12.9898, 78.233))) * 43758.5453);
        float gv = fract(gh * 23.7 + dot(normalize(vViewPosition), vec3(3.1, 1.7, 2.3)) * 2.2);
        float dist = length(vViewPosition);
        gl_FragColor.rgb += uGlit * step(.992, gh) * smoothstep(.82, 1., gv) * (1. - smoothstep(60., 700., dist)) * 1.6; }
      #endif`); };
    return m;
  }
  function buildSlope(T) {
    const g = new T.BufferGeometry(), n = COLS * ROWS, idx = [];
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('uv', new T.BufferAttribute(new Float32Array(n * 2), 2).setUsage(T.DynamicDrawUsage));
    g.setAttribute('color', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    for (let j = 0; j < ROWS - 1; j++) for (let i = 0; i < COLS - 1; i++) { const a = j * COLS + i, b = a + 1, c = a + COLS, d = c + 1; idx.push(a, c, b, b, c, d); }
    g.setIndex(idx); g.computeVertexNormals();
    const m = new T.Mesh(g, snowMat(T)); m.receiveShadow = true; m.frustumCulled = false; X.sc.add(m); X.slope = m;
    X.img('Seamless tileable texture of a groomed s 1.png', im => {
      const S = 512, c = R.mk(S, S), x = c.getContext('2d'); x.drawImage(im, 0, 0, S, S);
      // lift the photo's own shading out of the albedo (the 3D light does that now) and keep it bright
      x.globalCompositeOperation = 'color'; x.fillStyle = '#eef3fb'; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over'; x.globalAlpha = .45; x.fillStyle = '#f2f6fc'; x.fillRect(0, 0, S, S);
      const tex = new T.CanvasTexture(c); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = X.aniso;
      // a normal map from the photo's brightness so the corduroy and wind ripples catch the real sun
      const N = 256, nc = R.mk(N, N), nx = nc.getContext('2d'); nx.drawImage(im, 0, 0, N, N); const src = nx.getImageData(0, 0, N, N).data, out = nx.createImageData(N, N), L = (i, j) => src[(((j + N) % N) * N + ((i + N) % N)) * 4 + 1] / 255;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = (L(i + 1, j) - L(i - 1, j)) * 2.2, dy = (L(i, j + 1) - L(i, j - 1)) * 2.2, k = 1 / Math.hypot(dx, dy, 1), o = (j * N + i) * 4; out.data[o] = (-dx * k * .5 + .5) * 255; out.data[o + 1] = (dy * k * .5 + .5) * 255; out.data[o + 2] = (k * .5 + .5) * 255; out.data[o + 3] = 255; }
      nx.putImageData(out, 0, 0); const nt = new T.CanvasTexture(nc); nt.wrapS = nt.wrapT = T.RepeatWrapping; nt.anisotropy = X.aniso;
      const mm = X.slope.material; mm.map = tex; mm.normalMap = nt; mm.normalScale.set(1.1, 1.1); mm.needsUpdate = true; });
  }
  // two old ski lines (pairs of grooves) wandering down the run
  const TR = [{ o: -70, a: 1.3, p: 0 }, { o: 85, a: .9, p: 2.1 }, { o: 10, a: 1.6, p: 4.4 }];
  const trLat = (q, x) => q.o + Math.sin(x * .0019 * q.a + q.p) * 70 + Math.sin(x * .00063 + q.p * 2) * 110;
  const TRN = 70;
  function buildTracks(T) {
    const c = R.mk(32, 4), x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 32, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.18, 'rgba(255,255,255,.35)'); gr.addColorStop(.32, 'rgba(70,95,140,.32)'); gr.addColorStop(.7, 'rgba(110,130,170,.16)'); gr.addColorStop(.85, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 4); const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const n = TR.length * 2 * TRN * 2, g = new T.BufferGeometry(), idx = [];
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3).setUsage(T.DynamicDrawUsage));
    const uv = new Float32Array(n * 2); for (let k = 0; k < n / 2; k++) { uv[k * 4] = 0; uv[k * 4 + 2] = 1; } g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    for (let s = 0; s < TR.length * 2; s++) for (let j = 0; j < TRN - 1; j++) { const a = (s * TRN + j) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    g.setIndex(idx); g.setAttribute('normal', new T.BufferAttribute(new Float32Array(n * 3).map((v, i) => i % 3 === 1 ? 1 : 0), 3));
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.frustumCulled = false; m.receiveShadow = true; m.renderOrder = 1; X.sc.add(m); X.tracks = m;
  }
  // mountain ranges ringing the valley: ridged noise heightfields, rock texture on the cliffs, snow on every ledge
  function ridged(x, z) { let s = 0, a = .55, f = 1; for (let i = 0; i < 5; i++) { const n = 1 - Math.abs(A.noise(x * f + i * 17.3) + A.noise(z * f * 1.3 + i * 5.1) - 1); s += n * n * a; a *= .5; f *= 2.1; } return s; }
  function buildRange(T, r0, r1, hMax, seed, tex) {
    const SA = 240, SR = 26, pos = [], uv = [], snow = [], idx = [];
    for (let j = 0; j < SR; j++) { const v = j / (SR - 1), r = r0 + (r1 - r0) * v;
      for (let i = 0; i <= SA; i++) { const az = (i / SA) * Math.PI * 2, x = Math.sin(az) * r, z = -Math.cos(az) * r, mask = Math.sin(v * Math.PI) ** .6;
        const h = (ridged(az * 3.2 + seed, v * 2.4 + seed * .3) * 1.15 - .25) * hMax * mask + (A.noise(az * 40 + seed) - .5) * 60;
        pos.push(x, Math.max(-60, h) - 900, z); uv.push(az * r / 1400, h / 1400); } }
    for (let j = 0; j < SR - 1; j++) for (let i = 0; i < SA; i++) { const a = j * (SA + 1) + i, b = a + 1, c = a + SA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const P = g.attributes.position, Nn = g.attributes.normal; for (let i = 0; i < P.count; i++) { const y = P.getY(i) + 900, ny = Nn.getY(i), n = A.hash(i * .37 + seed); snow.push(A.clamp((ny - .5 + y / hMax * .5 + (n - .5) * .25) * 3.2, 0, 1)); }
    g.setAttribute('snow', new T.Float32BufferAttribute(snow, 1));
    const m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .92, map: tex || null });
    m.userData.u = { uSnowC: { value: new T.Color(1, 1, 1) }, uHaze: { value: new T.Color() }, uHz: { value: new T.Vector3(-900, 1300, .9) } };
    m.onBeforeCompile = s => { Object.assign(s.uniforms, m.userData.u);
      s.vertexShader = 'attribute float snow; varying float vSnow; varying float vWy;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSnow = snow; vWy = position.y;');
      s.fragmentShader = 'uniform vec3 uSnowC, uHaze; uniform vec3 uHz; varying float vSnow; varying float vWy;\n' + s.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb * vec3(.62, .6, .62), uSnowC, smoothstep(.25, .75, vSnow));')
        .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, clamp(1. - (vWy - uHz.x) / uHz.y, 0., 1.) * uHz.z);'); };
    const mesh = new T.Mesh(g, m); X.bg.add(mesh); return mesh;
  }
  function buildPano(T) { // the old photoreal alpine band, keyed off its magenta matte, wrapped far behind the 3D ranges
    X.img('Photoreal wide panoramic band of snowco 1.png', im => {
      const w = Math.min(2048, im.width), h = Math.round(im.height * w / im.width), c = R.mk(w, h), x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
      const id = x.getImageData(0, 0, w, h), D = id.data; for (let i = 0; i < D.length; i += 4) { const m = Math.min(D[i], D[i + 2]) - D[i + 1], a = m > 90 ? 0 : m > 30 ? 1 - (m - 30) / 60 : 1; if (a < 1) { D[i] = Math.min(D[i], D[i + 1] + 40); D[i + 2] = Math.min(D[i + 2], D[i + 1] + 50); } D[i + 3] = a * 255; }
      x.putImageData(id, 0, 0); const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.wrapS = T.MirroredRepeatWrapping; tex.repeat.set(7, 1); tex.anisotropy = X.aniso;
      const r = 26000, lo = r * Math.tan(.05), hi = r * Math.tan(.2), geo = new T.CylinderGeometry(r, r, lo + hi, 128, 1, true, 0, Math.PI * 2);
      X.panoM = new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.BackSide, depthWrite: false, fog: false, color: 0xffffff });
      const m = new T.Mesh(geo, X.panoM); m.position.y = (hi - lo) / 2; m.renderOrder = -5; X.bg.add(m); X.pano = m; if (X.lastPal) X.gradePano(X.lastPal); });
  }
  X.gradePano = function (pal) { if (!X.panoM) return; const T = X.T, c = new T.Color(pal.night ? (pal.aurora ? '#2e5560' : '#3a4a72') : pal.sun === '255,178,110' ? '#f2b7a0' : '#e6eefa'); X.panoM.color.copy(c); X.panoM.opacity = pal.night ? .7 : .85; };
  X.landInit = function (T) {
    buildSlope(T); buildTracks(T);
    X.ranges = [];
    const mk = tex => { X.ranges.push(buildRange(T, 6000, 10500, 1900, 3.1, tex)); X.gradeRanges(); };
    X.img('Seamless tileable texture of a dark gran 1.png', im => { const c = R.mk(512, 512); c.getContext('2d').drawImage(im, 0, 0, 512, 512); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = X.aniso; X.ranges.forEach(m => { m.material.map = t; m.material.needsUpdate = true; }); });
    mk(null); buildPano(T);
    (X.onGrade = X.onGrade || []).push((pal, key, night) => { X.lastPal = pal; X.gradeRanges(); X.gradePano(pal);
      X.slope.material.userData.u.uGlit.value.set(col(pal.sun)).multiplyScalar(night ? .35 : key === 'sunset' ? .9 : 1.2);
      X.tracks.material.color.set(night ? '#8fa6d6' : '#ffffff'); });
  };
  const col = s => X.col(s);
  X.gradeRanges = function () { const pal = X.lastPal; if (!pal || !X.ranges) return; const T = X.T;
    X.ranges.forEach((m, i) => { const u = m.material.userData.u; u.uSnowC.value.set(pal.cap); u.uHaze.value.copy(X.horC || new T.Color(col(pal.fog))); u.uHz.value.set(-900, i ? 2600 : 1500, i ? .95 : .85); m.material.color.set(i ? '#d8e2f0' : '#ffffff'); }); };
  // per frame: rebuild the slope mesh around you on a world-locked grid (so the snow never swims)
  X.landUpdate = function (T, gx, gY, pal) {
    T.ensure(gx + 2900);
    const x0 = Math.floor(gx / (DX * 2)) * DX * 2 - DX * 6, P = X.slope.geometry.attributes.position, U = X.slope.geometry.attributes.uv, C = X.slope.geometry.attributes.color;
    const ice = [.74, .87, 1], pw = 1.03;
    for (let j = 0; j < ROWS; j++) { const x = rowX(x0, j), h = T.h(x), hs = X.hs(T, x), ty = T.type(x), z = -(x - gx);
      for (let i = 0; i < COLS; i++) { const lat = LATS[i], k = j * COLS + i, rs = X.rise(x, lat), w = X.mixW(lat);
        P.setXYZ(k, lat, -(h + (hs - h) * w - rs - gY), z); U.setXY(k, lat / 120, x / 120);
        const on = Math.abs(lat) < 250, sh = .94 + A.noise(x * .01 + lat * .013) * .06;
        if (on && ty === 1) C.setXYZ(k, ice[0], ice[1], ice[2]); else if (on && ty === 2) C.setXYZ(k, pw, pw, pw); else C.setXYZ(k, sh, sh, Math.min(1, sh + .02)); } }
    P.needsUpdate = U.needsUpdate = C.needsUpdate = true; X.slope.geometry.computeVertexNormals();
    // ski grooves follow the surface
    const TP = X.tracks.geometry.attributes.position; let v = 0;
    for (const q of TR) for (const e of [-1, 1]) for (let j = 0; j < TRN; j++) { const x = x0 + j * DX, c = trLat(q, x) + e * 6, y = -(X.surf(T, x, c) - gY) + .25, z = -(x - gx), w = 2.2 * (1 + j / TRN);
      TP.setXYZ(v++, c - w, y, z); TP.setXYZ(v++, c + w, y, z); }
    TP.needsUpdate = true;
  };
})(window.App);
