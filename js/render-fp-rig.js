(function (A) {
  const R = A.R;
  // real-time 3D gear for the first-person view: clearcoat skis with steel edges, aluminium poles,
  // quilted sleeves and leather gloves, lit by the run's sun or moon and reflecting its sky (three.js)
  let S = null, failed = false;
  const hex = c => { if (c[0] === '#') return c; const m = c.match(/\d+/g).map(Number); return '#' + m.map(v => v.toString(16).padStart(2, '0')).join(''); };
  function skiGeo(T) {
    const g = new T.BoxGeometry(1, 1, 1, 1, 1, 56), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const t = P.getZ(i) + .5; // 0 tail .. 1 tip
      let w = .075 * (1 + .7 * Math.pow(t - .55, 2)); if (t > .9) w *= Math.sqrt(Math.max(.04, 1 - Math.pow((t - .9) / .1, 2)));
      const th = .022 - .01 * Math.max(0, t - .8) / .2, up = t > .78 ? Math.pow((t - .78) / .22, 2) * .11 : 0;
      P.setX(i, P.getX(i) * w); P.setY(i, (P.getY(i) + .5) * th + up);
    }
    g.computeVertexNormals(); return g;
  }
  function edgeGeo(T, side) { // steel edge strip hugging the sidecut
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; let w = .075 * (1 + .7 * Math.pow(t - .55, 2)); if (t > .9) w *= Math.sqrt(Math.max(.04, 1 - Math.pow((t - .9) / .1, 2))); pts.push(new T.Vector3(side * w * .5, .002 + (t > .78 ? Math.pow((t - .78) / .22, 2) * .11 : 0), t - .5)); }
    return new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, .0035, 4, false);
  }
  function sleeveGeo(T) { // puffy baffled sleeve along +y, unit length
    const pts = []; for (let i = 0; i <= 32; i++) { const u = i / 32; pts.push(new T.Vector2((.07 - .028 * u) * (1 + .08 * Math.pow(Math.sin(u * Math.PI * 5), 2)) * (u > .94 ? .82 : 1), u - .5)); }
    return new T.LatheGeometry(pts, 18);
  }
  function topsheet(T, rd) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, R.shade(rd.skis, .78)); gr.addColorStop(.5, rd.skis); gr.addColorStop(1, R.shade(rd.skis, .78)); x.fillStyle = gr; x.fillRect(0, 0, 64, 512);
    x.fillStyle = R.shade(rd.skis, .62); for (let y = 40; y < 470; y += 26) { x.beginPath(); x.moveTo(6, y); x.lineTo(32, y + 14); x.lineTo(58, y); x.lineTo(58, y + 6); x.lineTo(32, y + 20); x.lineTo(6, y + 6); x.fill(); }
    x.fillStyle = rd.jacket; x.fillRect(27, 0, 10, 512); x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(25, 0, 2, 512); x.fillRect(37, 0, 2, 512);
    x.save(); x.translate(32, 300); x.rotate(Math.PI / 2); x.fillStyle = '#fff'; x.font = '900 italic 15px -apple-system,system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('POWDER RUSH', 0, -10); x.fillText('RUSH 28', 0, 22); x.restore();
    const tg = x.createLinearGradient(0, 440, 0, 512); tg.addColorStop(0, R.shade(rd.skis, .55)); tg.addColorStop(1, '#16181f'); x.fillStyle = tg; x.fillRect(0, 446, 64, 66); x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(0, 444, 64, 2);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; return tx;
  }
  function envFor(T, pal) { // equirect sky/snow panorama for reflections, graded to the time of day
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, pal.sky[0]); gr.addColorStop(.6, pal.sky[1]); gr.addColorStop(1, pal.sky[2]); x.fillStyle = gr; x.fillRect(0, 0, 256, 64);
    const sg = x.createLinearGradient(0, 64, 0, 128); sg.addColorStop(0, 'rgb(' + pal.fog + ')'); sg.addColorStop(.3, pal.snow); sg.addColorStop(1, R.shade(pal.snow, .8)); x.fillStyle = sg; x.fillRect(0, 64, 256, 64);
    const sx = pal.sp[0] > .5 ? 96 : 32, sy = 64 - (1 - pal.sp[1]) * 40, rg = x.createRadialGradient(sx, sy, 0, sx, sy, 22); rg.addColorStop(0, 'rgba(' + pal.sun + ',1)'); rg.addColorStop(1, 'rgba(' + pal.sun + ',0)'); x.fillStyle = rg; x.fillRect(0, 0, 256, 128);
    const tx = new T.CanvasTexture(c); tx.mapping = T.EquirectangularReflectionMapping; tx.colorSpace = T.SRGBColorSpace;
    const e = S.pm.fromEquirectangular(tx).texture; tx.dispose(); return e;
  }
  R.fpGeo = Object.assign(R.fpGeo || {}, { ski: skiGeo, skiEdge: edgeGeo, sleeve: sleeveGeo, topsheet });
  function build(T) {
    const cv = document.createElement('canvas');
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = .95; r.setClearColor(0x000000, 0);
    const sc = new T.Scene(), cam = new T.PerspectiveCamera(60, 1, .02, 20);
    S = { T, r, cv, sc, cam, pm: new T.PMREMGenerator(r), key: '', rid: '' };
    S.hemi = new T.HemisphereLight(0xbfd8ff, 0xffffff, 1); S.sun = new T.DirectionalLight(0xffffff, 2.4); S.sun.target.position.set(0, -1, -2);
    S.lamp = new T.SpotLight(0xffe2b0, 0, 6, .7, .6, 0); S.lamp.position.set(0, .1, 0); S.lamp.target.position.set(0, -1.1, -3);
    sc.add(S.hemi, S.sun, S.sun.target, S.lamp, S.lamp.target);
    S.mSki = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .32, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.2 });
    S.mEdge = new T.MeshStandardMaterial({ color: 0xd4dbe4, metalness: 1, roughness: .22 });
    S.mPole = new T.MeshStandardMaterial({ color: 0xc9d2dc, metalness: .95, roughness: .28 });
    S.mGrip = new T.MeshStandardMaterial({ color: 0x15171c, roughness: .7 });
    S.mGlove = new T.MeshPhysicalMaterial({ color: 0x2e323c, roughness: .55, sheen: .6, sheenColor: 0x8899aa, clearcoat: .25 });
    S.mPalm = new T.MeshStandardMaterial({ color: 0x3a3226, roughness: .8 });
    S.mSleeve = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .5, sheen: .35, sheenRoughness: .5, sheenColor: 0xffffff, clearcoat: .2, clearcoatRoughness: .4, envMapIntensity: .5 });
    S.mCuff = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .85 });
    const sg = skiGeo(T), eL = edgeGeo(T, -1), eR = edgeGeo(T, 1), slv = sleeveGeo(T), cyl = new T.CylinderGeometry(1, 1, 1, 10), fist = new T.SphereGeometry(1, 20, 14), cap = new T.CapsuleGeometry(1, 1.4, 4, 10), bsk = new T.TorusGeometry(1, .12, 6, 16), stg = new T.TorusGeometry(1, .09, 5, 22, Math.PI * 1.55);
    S.mStrap = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .45, sheen: .8, sheenColor: 0xffffff }); // woven wrist strap in the rider's colour
    S.side = [-1, 1].map(() => {
      const ski = new T.Group(), body = new T.Mesh(sg, S.mSki); ski.add(body, new T.Mesh(eL, S.mEdge), new T.Mesh(eR, S.mEdge));
      const pole = new T.Group(), shaft = new T.Mesh(cyl, S.mPole), grip = new T.Mesh(cyl, S.mGrip), basket = new T.Mesh(bsk, S.mGrip); pole.add(shaft, grip, basket);
      const arm = new T.Mesh(slv, S.mSleeve), hand = new T.Group(), f = new T.Mesh(fist, S.mGlove), th = new T.Mesh(cap, S.mGlove), palm = new T.Mesh(fist, S.mPalm), cuff = new T.Mesh(cyl, S.mCuff);
      const kn = new T.Mesh(cap, S.mGlove); kn.scale.set(.016, .03, .016); kn.rotation.z = Math.PI / 2; kn.position.set(0, .028, -.03); hand.add(kn);
      f.scale.set(.06, .045, .07); palm.scale.set(.052, .04, .056); palm.position.set(0, -.014, .006); th.scale.setScalar(.019); th.rotation.z = 1.1; cuff.scale.set(.04, .035, .04); cuff.position.set(0, -.03, .085); cuff.rotation.x = Math.PI / 2;
      hand.add(f, palm, th, cuff);
      const strap = new T.Mesh(stg, S.mStrap); sc.add(ski, pole, arm, hand, strap);
      return { ski, pole, shaft, grip, basket, arm, hand, th, strap };
    });
  }
  function seg(T, m, a, b, rad) { // place a unit +y mesh between two points
    const d = b.clone().sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); m.scale.set(rad == null ? 1 : rad, L, rad == null ? 1 : rad);
  }
  R.fpGL = function () { const T = A.THREE; if (!T || failed) return null; try { if (!S) build(T); return S; } catch (e) { failed = true; return null; } };
  R.fpRig = function (g, o) {
    const T = A.THREE; if (!T || failed) return false;
    try {
      if (!S) build(T);
      const { W, H, d, F, hor, cx, pal, lean, bob, p, tipY, tk, pl, sDir, t } = o, rd = A.rider();
      const pw = Math.round(W * d), ph = Math.round(H * d);
      if (S.cv.width !== pw || S.cv.height !== ph) { S.r.setPixelRatio(d); S.r.setSize(W, H, false); }
      if (S.key !== R.key) { S.key = R.key; if (S.env) S.env.dispose(); S.env = envFor(T, pal); S.sc.environment = S.env;
        const n = pal.night ? 1 : 0; S.sun.color.set(hex(pal.sun)); S.sun.intensity = n ? .55 : pal.rays > .1 ? 1.8 : 2.1; S.hemi.color.set(pal.sky[1]); S.hemi.groundColor.set(pal.snow); S.hemi.intensity = n ? .35 : .55;
        S.sc.environmentIntensity = n ? .3 : .85; S.lamp.intensity = n ? 3.2 : 0; S.sun.position.set(pal.sp[0] > .5 ? 1.4 : -1.4, 1.6 - pal.sp[1] * 2.4, -1.6); }
      if (S.rid !== rd.id) { S.rid = rd.id; if (S.mSki.map) S.mSki.map.dispose(); S.mSki.map = topsheet(T, rd); S.mSki.needsUpdate = true; S.mSleeve.color.set(hex(R.shade(rd.jacket, .78))); S.mCuff.color.set(R.shade(rd.jacket, .55)); S.mStrap.color.set(hex(R.shade(rd.jacket, 1.05))); }
      // pinhole camera matching the 2D projection: focal F, principal point at (cx, hor)
      const Hf = 2 * Math.max(hor, H - hor), cam = S.cam; cam.fov = 2 * Math.atan(Hf / 2 / F) * 57.2958; cam.aspect = W / Hf; cam.setViewOffset(W, Hf, 0, Hf / 2 - hor, W, H); cam.updateProjectionMatrix();
      const at = (sx, sy, z) => new T.Vector3((sx - cx) * z / F, -(sy - hor) * z / F, -z);
      S.side.forEach((q, i) => {
        const s = i ? 1 : -1, bx = cx + s * W * .17 + lean * .3, tx = cx + s * W * .07 + lean;
        const tail = at(bx, H + 10, .8), tip = at(tx, tipY + H * .02, 2.6), L = tail.distanceTo(tip);
        q.ski.position.copy(tail).lerp(tip, .5); q.ski.lookAt(tip); q.ski.rotateZ(-lean / W * .9 + (p.ground ? 0 : s * .05)); q.ski.scale.set(1, 1, L);
        let hx = cx + s * W * (tk ? .2 : .32) + lean * .5, hy = H * (tk ? .8 : .84) + (p.ground ? pl * s * 6 : -10) + bob; if (p.grab) { hx = cx + s * W * .1 + lean; hy = tipY + H * .06; }
        const hand = at(hx, hy, .62); q.hand.position.copy(hand); q.hand.rotation.set(-.5 - (tk ? .3 : 0), -s * .35, s * .35); q.th.position.set(-s * .042, .004, -.02);
        const sh = at(cx + s * W * .62, H + 30, .32); seg(T, q.arm, sh, hand.clone().add(new T.Vector3(0, -.01, .05)));
        q.pole.visible = q.strap.visible = !p.grab;
        // the wrist strap loops from the grip around the cuff and swings with each pole plant
        q.strap.position.copy(hand).add(new T.Vector3(s * .006, -.022, .045)); q.strap.scale.setScalar(.034); q.strap.rotation.set(1.15 + Math.sin(t * 7 + s) * .12 + pl * .2, s * .5, s * .3 + Math.PI * .6);
        if (!p.grab) { const end = tk ? at(hx + s * W * .25, H * .95, .3).add(new T.Vector3(0, 0, .5)) : at(hx + s * W * .12, H * 1.15, .55).add(new T.Vector3(0, -.15 - pl * s * .05, -.1));
          const top = hand.clone().add(new T.Vector3(0, -.01, 0)); seg(T, q.shaft, top, end, .008); const gd = end.clone().sub(top).normalize();
          seg(T, q.grip, top, top.clone().addScaledVector(gd, .1), .016); q.basket.position.copy(end).addScaledVector(gd, -.08); q.basket.scale.setScalar(.04); q.basket.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), gd); }
      });
      S.r.render(S.sc, cam);
      g.save(); g.setTransform(d, 0, 0, d, 0, 0); g.drawImage(S.cv, 0, 0, W, H); g.restore();
      return true;
    } catch (e) { failed = true; console.warn('3D rig off:', e); return false; }
  };
})(window.App);
