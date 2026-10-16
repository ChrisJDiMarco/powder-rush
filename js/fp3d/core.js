(function (A) {
  const R = A.R;
  // Powder Rush 3D: one real three.js world for the first-person view. A WebGL canvas sits under the game
  // canvas; the 2D canvas only keeps the HUD. Two passes: a far scene (physical-ish sky, stars, aurora, lit 3D
  // mountain ranges and a photoreal panorama) and the near world (slope, forest, hazards, lodges, your gear).
  // Everything is placed relative to the snow under your feet (a floating origin), so nothing jitters at speed.
  const X = R.X3 = { ready: false, failed: false };
  const col = s => (s[0] === '#' ? s : 'rgb(' + s + ')');
  X.col = col;
  X.sunDir = function (T, pal) { const el = A.clamp((.62 - pal.sp[1]) * (pal.night ? 1.05 : .95), .07, .75), az = (pal.sp[0] - .5) * (pal.night || pal.rays > .1 ? 1.9 : 2.3); /* a low, slightly back-lit sun: long shadows reach across the run */ return new T.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); };
  X.img = function (file, cb) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { try { cb(im); } catch (e) { console.warn(e); } }; try { im.src = window.cabinet ? cabinet.file(file) : file; } catch (e) {} };
  // a soft cloudy puff and a crisp flake for the particle systems
  function spriteTex(T, kind) {
    const c = R.mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (kind === 'flake') { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    else { gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.5, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const rnd = A.rng(99); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = 10 + rnd() * 20, q = g.createRadialGradient(32 + Math.cos(a) * r, 32 + Math.sin(a) * r, 0, 32 + Math.cos(a) * r, 32 + Math.sin(a) * r, 6 + rnd() * 8); q.addColorStop(0, 'rgba(0,0,0,.35)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); } }
    const t = new T.CanvasTexture(c); return t;
  }
  const SKY_V = 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }';
  const SKY_F = `
uniform vec3 uTop, uMid, uHor, uSun, uSunCol; uniform float uNight, uAur, uTime, uCloud, uMoon;
varying vec3 vDir;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
void main(){
  vec3 d = normalize(vDir); float y = d.y;
  vec3 c = mix(uMid, uTop, pow(clamp(y / .65, 0., 1.), .8));
  c = mix(uHor, c, smoothstep(-.03, .25, y));
  float sd = max(dot(d, uSun), 0.);
  c += uSunCol * (pow(sd, 6.) * .22 + pow(sd, 48.) * .45 + pow(sd, 600.) * 1.2) * (1. - uNight * .75);
  // drifting cirrus and cumulus banks, lit from the sun side
  if (y > .0) { vec2 uv = d.xz / (y + .12); float cl = fbm(uv * .9 + vec2(uTime * .006, uTime * .002)); float k = smoothstep(.52, .86, cl) * uCloud * smoothstep(.0, .18, y);
    vec3 cc = mix(uHor * 1.08, mix(uMid, vec3(1.), .55), smoothstep(.0, .5, y)) + uSunCol * pow(sd, 3.) * .5; c = mix(c, cc, k * .85); }
  if (uNight > .5) {
    if (y > 0.) { vec3 g = d * 300.; vec3 cell = floor(g); float s = h3(cell); float r = length(fract(g) - .5);
      float st = step(.9965, s) * smoothstep(.42, .0, r) * (.55 + .45 * sin(uTime * (1.5 + s * 3.) + s * 60.)) * smoothstep(.0, .2, y);
      c += vec3(.85, .9, 1.) * st * (1. + step(.9993, s) * 2.);
      float mw = exp(-pow((d.x * .8 + d.y - .55) / .18, 2.)) * fbm(d.xy * 9.) * .12; c += vec3(.5, .55, .7) * mw; }
    // the moon: a cratered disc with a soft halo
    float md = smoothstep(.99955, .99972, sd); vec2 mp = (d - uSun).xy * 400.; float cr = fbm(mp * .7 + 3.);
    c = mix(c, uSunCol * (1.25 - cr * .45), md * uMoon);
  } else {
    c = mix(c, uSunCol * 4., smoothstep(.99965, .9998, sd));
  }
  if (uAur > 0. && y > 0.) { float az = atan(d.x, -d.z);
    for (int i = 0; i < 2; i++) { float fi = float(i); float e0 = .22 + fi * .1 + .07 * sin(az * 2.3 + uTime * .07 + fi * 2.) + (fbm(vec2(az * 2.5 + fi * 4., uTime * .04)) - .5) * .18;
      float band = exp(-pow((y - e0) / (.05 + .05 * fi), 2.)) + smoothstep(e0 - .02, e0 + .25, y) * exp(-(y - e0) * 6.) * .8 * step(e0, y);
      float rays = .35 + 1.3 * pow(fbm(vec2(az * 38. + fi * 9., uTime * .25)), 2.);
      vec3 ac = mix(vec3(.15, 1., .55), vec3(.6, .25, 1.), smoothstep(e0, e0 + .2, y));
      c += ac * band * rays * uAur * (.5 - fi * .15) * smoothstep(-.6, .4, -d.z); } }
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
  X.init = function (T) {
    const cv = document.createElement('canvas'); cv.id = 'c3';
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none';
    const c2 = document.getElementById('c'); c2.parentNode.insertBefore(cv, c2);
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance' });
    r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = .8; r.autoClear = false;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    Object.assign(X, { T, r, cv, aniso: Math.min(8, r.capabilities.getMaxAnisotropy()), key: '' });
    // far pass
    const bg = X.bg = new T.Scene(); X.bgCam = new T.PerspectiveCamera(60, 1, 10, 40000);
    X.skyU = { uTop: { value: new T.Color() }, uMid: { value: new T.Color() }, uHor: { value: new T.Color() }, uSun: { value: new T.Vector3(0, 1, 0) }, uSunCol: { value: new T.Color() }, uNight: { value: 0 }, uAur: { value: 0 }, uTime: { value: 0 }, uCloud: { value: 1 }, uMoon: { value: 1 } };
    const sky = new T.Mesh(new T.SphereGeometry(30000, 48, 24), new T.ShaderMaterial({ uniforms: X.skyU, vertexShader: SKY_V, fragmentShader: SKY_F, side: T.BackSide, depthWrite: false, toneMapped: true }));
    sky.renderOrder = -10; bg.add(sky); X.sky = sky;
    X.bgSun = new T.DirectionalLight(0xffffff, 2); X.bgHemi = new T.HemisphereLight(0xbfd8ff, 0xffffff, .8); bg.add(X.bgSun, X.bgHemi);
    // near pass
    const sc = X.sc = new T.Scene(); sc.fog = new T.Fog(0xdce8f6, 500, 5200);
    X.cam = new T.PerspectiveCamera(64, 1, 1.5, 5600); X.body = new T.Group(); X.body.rotation.order = 'YXZ'; X.body.add(X.cam); sc.add(X.body);
    X.cam.layers.enable(0);
    X.hemi = new T.HemisphereLight(0xbfd8ff, 0xffffff, .9); X.sun = new T.DirectionalLight(0xffffff, 3); sc.add(X.hemi, X.sun, X.sun.target);
    X.sun.castShadow = true; const sh = X.sun.shadow; sh.mapSize.set(1024, 1024); sh.bias = -.0005; sh.normalBias = 1.4;
    Object.assign(sh.camera, { left: -820, right: 820, top: 820, bottom: -820, near: 10, far: 4600 }); sh.camera.updateProjectionMatrix(); sh.camera.layers.enable(1);
    // headlamp for night runs, worn on the helmet
    X.lamp = new T.SpotLight(0xffe3b8, 0, 1500, .55, .55, 1); X.lamp.position.set(0, 4, 0); X.lamp.target.position.set(0, -30, -300); X.cam.add(X.lamp, X.lamp.target);
    X.pm = new T.PMREMGenerator(r);
    X.puffTex = spriteTex(T, 'puff'); X.flakeTex = spriteTex(T, 'flake');
    X.ready = true;
  };
  // grade the whole world to the run's time of day: sky, fog, sun or moon, ambient, exposure and reflections
  X.grade = function (pal, key) {
    const T = X.T, u = X.skyU, night = pal.night ? 1 : 0;
    u.uTop.value.set(pal.sky[0]); u.uMid.value.set(pal.sky[1]);
    const hor = new T.Color(pal.sky[2]).lerp(new T.Color(col(pal.fog)), .55); u.uHor.value.copy(hor);
    X.horC = hor; X.sc.fog.color.copy(hor);
    const sd = X.sunDir(T, pal); X.sdir = sd; u.uSun.value.copy(sd); u.uSunCol.value.set(col(pal.sun));
    u.uNight.value = night; u.uAur.value = pal.aurora ? 1 : 0; u.uCloud.value = key === 'day' ? .9 : key === 'sunset' ? 1 : .35; u.uMoon.value = pal.moon ? 1 : 0;
    const sunI = key === 'day' ? 2.7 : key === 'sunset' ? 2.5 : .95;
    [X.sun, X.bgSun].forEach(l => { l.color.set(col(pal.sun)); l.intensity = sunI; });
    X.bgSun.position.copy(sd).multiplyScalar(1000);
    X.hemi.color.set(pal.sky[1]); X.hemi.groundColor.set(pal.snow); X.hemi.intensity = night ? .5 : key === 'sunset' ? .38 : .36;
    X.bgHemi.color.copy(X.hemi.color); X.bgHemi.groundColor.set(pal.mtn[3]); X.bgHemi.intensity = X.hemi.intensity;
    X.r.toneMappingExposure = key === 'day' ? .8 : key === 'sunset' ? .92 : 1.6;
    X.lamp.intensity = night ? 9 : 0;
    X.sc.fog.near = night ? 250 : 500; X.sc.fog.far = night ? 3600 : 5200;
    if (X.onGrade) X.onGrade.forEach(f => f(pal, key, night));
    // reflections: bake the far scene (sky, ranges) into an environment map for snow, chrome and gold
    try { if (X.env) X.env.dispose(); X.bgCam.position.set(0, 0, 0); X.env = X.pm.fromScene(X.bg, 0, 10, 35000).texture; X.sc.environment = X.env; X.sc.environmentIntensity = night ? .3 : .38; } catch (e) { console.warn('env', e); }
  };
  X.resize = function (W, H, dpr) {
    // keep the GPU load steady in the large view: about 2.4 MP at most
    const pr = Math.min(dpr, Math.sqrt(2.4e6 / Math.max(1, W * H)));
    if (X.W !== W || X.H !== H || X.pr !== pr) { X.W = W; X.H = H; X.pr = pr; X.r.setPixelRatio(pr); X.r.setSize(W, H, false); }
  };
})(window.App);
