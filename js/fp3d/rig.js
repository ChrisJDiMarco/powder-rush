(function (A) {
  const R = A.R, X = R.X3;
  // your gear in the world, at true scale (built in metres, 20 px = 1 m): clearcoat skis with steel edges
  // riding on the real snow, aluminium poles that plant and drag, quilted sleeves and gloves, lit by the same
  // sun or moon as everything else and reflecting the same sky
  let V = null;
  X.rigInit = function (T) {
    const Gm = R.fpGeo, rig = X.rig = new T.Group(); rig.scale.setScalar(20); X.body.add(rig);
    V = { up: new T.Vector3(0, 1, 0), z: new T.Vector3(0, 0, 1), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), d: new T.Vector3() };
    X.mSki = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .3, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.1 });
    const mEdge = new T.MeshStandardMaterial({ color: 0xd4dbe4, metalness: 1, roughness: .22 }), mPole = new T.MeshStandardMaterial({ color: 0xc9d2dc, metalness: .95, roughness: .26 }), mGrip = new T.MeshStandardMaterial({ color: 0x15171c, roughness: .7 });
    const mGlove = new T.MeshPhysicalMaterial({ color: 0x2e323c, roughness: .55, sheen: .6, sheenColor: 0x8899aa, clearcoat: .25 }), mPalm = new T.MeshStandardMaterial({ color: 0x3a3226, roughness: .8 });
    X.mSleeve = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .72, envMapIntensity: .35 });
    X.mCuff = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }); X.mStrap = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .45, sheen: .8, sheenColor: 0xffffff });
    const sg = Gm.ski(T), eL = Gm.skiEdge(T, -1), eR = Gm.skiEdge(T, 1), slv = Gm.sleeve(T), cyl = new T.CylinderGeometry(1, 1, 1, 12), fist = new T.SphereGeometry(1, 20, 14), cap = new T.CapsuleGeometry(1, 1.4, 4, 10), bsk = new T.TorusGeometry(1, .12, 6, 16), stg = new T.TorusGeometry(1, .09, 5, 22, Math.PI * 1.55);
    X.side = [-1, 1].map(() => {
      const ski = new T.Group(), body = new T.Mesh(sg, X.mSki); ski.add(body, new T.Mesh(eL, mEdge), new T.Mesh(eR, mEdge));
      const crust = new T.Mesh(new T.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xf6f9ff, roughness: .8 })); crust.scale.set(.035, .012, .1); crust.position.set(0, .03, .3); ski.add(crust);
      const pole = new T.Group(), shaft = new T.Mesh(cyl, mPole), grip = new T.Mesh(cyl, mGrip), basket = new T.Mesh(bsk, mGrip); pole.add(shaft, grip, basket);
      const arm = new T.Mesh(slv, X.mSleeve), hand = new T.Group(), f = new T.Mesh(fist, mGlove), th = new T.Mesh(cap, mGlove), palm = new T.Mesh(fist, mPalm), cuff = new T.Mesh(cyl, X.mCuff);
      const kn = new T.Mesh(cap, mGlove); kn.scale.set(.016, .03, .016); kn.rotation.z = Math.PI / 2; kn.position.set(0, .028, -.03); hand.add(kn);
      f.scale.set(.06, .045, .07); palm.scale.set(.052, .04, .056); palm.position.set(0, -.014, .006); th.scale.setScalar(.019); th.rotation.z = 1.1; cuff.scale.set(.04, .035, .04); cuff.position.set(0, -.03, .085); cuff.rotation.x = Math.PI / 2;
      hand.add(f, palm, th, cuff); const strap = new T.Mesh(stg, X.mStrap);
      rig.add(ski, pole, arm, hand, strap); [ski, pole, arm, hand].forEach(o => o.traverse(m => { m.castShadow = false; m.receiveShadow = false; }));
      return { ski, pole, shaft, grip, basket, arm, hand, th, strap, crust };
    });
  };
  function seg(m, a, b, rad) { const d = V.d.copy(b).sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V.up, d.normalize()); m.scale.set(rad == null ? 1 : rad, L, rad == null ? 1 : rad); }
  // o: { p, t, eye (px), lean, pl, tk, rd, k, runT, slopeRel }
  X.rigUpdate = function (o) {
    const { p, t, eye, lean, pl, tk, rd, k, runT } = o, T = X.T;
    X.rig.visible = !p.dead; if (p.dead) return;
    if (X.rid !== rd.id) { X.rid = rd.id; if (X.mSki.map) X.mSki.map.dispose(); X.mSki.map = R.fpGeo.topsheet(T, rd); X.mSki.needsUpdate = true; X.mSleeve.color.set(R.shade(rd.jacket, .62)); X.mCuff.color.set(R.shade(rd.jacket, .55)); X.mStrap.color.set(R.shade(rd.jacket, 1.05)); }
    const gy = -eye / 20, air = !p.ground && !p.rail, lift = air ? .05 : 0, chat = p.ground ? (A.noise(t * 30) - .5) * .012 * k : 0;
    X.side.forEach((q, i) => {
      const s = i ? 1 : -1, ex = lean * .5;
      // skis: tails under your boots, tips reaching ahead, edged into the turn
      const tail = V.a.set(s * .14 + ex * .3, gy + .02 + lift + chat, .3), tip = V.b.set(s * (p.grab ? .1 : .13) + ex, gy + .02 + lift - chat, -2.6);
      const L = tail.distanceTo(tip); q.ski.position.copy(tail).lerp(tip, .5); q.ski.quaternion.setFromUnitVectors(V.z, V.c.copy(tip).sub(tail).normalize()); q.ski.rotateZ(-lean * .9 + (air ? s * .06 : 0)); q.ski.scale.set(1, 1, L);
      q.crust.visible = runT > 4; q.crust.scale.y = .012 * Math.min(1, runT / 12);
      // hands
      let hx = s * (tk ? .21 : .31) + ex * .6, hy = (tk ? -.5 : -.46) + (p.ground ? pl * s * .03 : .06), hz = tk ? -.85 : -.74 + (p.ground ? -pl * s * .08 : 0);
      if (p.grab) { hx = s * .14 + ex; hy = gy + .4; hz = -1.25; }
      if (air && !p.grab) { hx *= 1.25; hy += .05; }
      const hand = V.c.set(hx, hy, hz); q.hand.position.copy(hand); q.hand.rotation.set(-.5 - (tk ? .3 : 0), -s * .35, s * .35); q.th.position.set(-s * .042, .004, -.02);
      seg(q.arm, V.a.set(s * .26 + ex * .2, -.28, .12), V.b.copy(hand).add(V.d.set(0, -.01, .05)));
      q.pole.visible = q.strap.visible = !p.grab;
      q.strap.position.copy(hand).add(V.d.set(s * .006, -.022, .045)); q.strap.scale.setScalar(.034); q.strap.rotation.set(1.15 + Math.sin(t * 7 + s) * .12 + pl * .2, s * .5, s * .3 + Math.PI * .6);
      if (!p.grab) { const top = V.a.copy(hand).add(V.d.set(0, -.01, 0));
        const end = tk ? V.b.set(s * .42 + ex, gy + .55, .8) : air ? V.b.set(s * .6, gy + .3, -.1) : V.b.set(s * .5 + ex, gy + .02, -.55 - pl * s * .4);
        seg(q.shaft, top, end, .009); const gd = V.c.copy(end).sub(top).normalize();
        seg(q.grip, top, V.d.copy(top).addScaledVector(gd, .11), .017); q.basket.position.copy(end).addScaledVector(gd, -.09); q.basket.scale.setScalar(.045); q.basket.quaternion.setFromUnitVectors(V.z, gd); }
    });
  };
})(window.App);
