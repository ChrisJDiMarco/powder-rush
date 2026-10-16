(function (A) {
  const R = A.R, X = R.X3;
  // the first-person camera and frame: your head rides the real slope (eye height, tuck, bob, carve lean),
  // flips pitch the whole world over, crashes tumble you into the snow; then the far and near passes render
  let sunV = null;
  R.fp3Hide = function () { if (X.cv) X.cv.style.display = 'none'; };
  R.drawFP3 = function (g, G, dt) {
    const T3 = A.THREE; if (!T3 || X.failed || !R.fpGeo || !R.fpGeo.ski) return false;
    try {
      if (!X.ready) { X.init(T3); X.landInit(T3); X.propsInit(T3); X.rigInit(T3); X.fxInit(T3); sunV = new T3.Vector3(); }
      const W = R.W, H = R.H, pal = R.pal; X.resize(W, H, R.dpr); X.cv.style.display = 'block';
      if (X.key !== R.key) { X.key = R.key; X.grade(pal, R.key); }
      const p = G.p, T = G.terr, t = G.t, rm = (window.cabinet && cabinet.reducedMotion) ? .3 : 1;
      const sp = p.dead ? 0 : p.speed(), k = Math.min(1, sp / 1300), gx = p.x, gY = T.h(gx);
      const tk = p.tuck && p.ground, eyeT = p.dead ? 9 : tk ? 25 : 32; X.eye = X.eye == null ? eyeT : X.eye + (eyeT - X.eye) * Math.min(1, dt * 8); const eye = X.eye;
      const fL = G.fpLat || 0, lean = (G.fpLean || 0) * rm, slopeA = Math.atan(G.fpS || 0), wind = G.wind || 0;
      let rel = p.dead ? 0 : A.wrapA(p.ang - slopeA); rel *= (p.ground || p.rail) ? .45 : A.clamp(Math.abs(p.rot) / 1.4, .4, 1); // flips turn the world fully over; a plain jump only nods
      // body: on the snow under you, pitched with the fall line (your head stays a little more level), rolled into carves
      const B = X.body; B.position.set(fL, -(p.y - gY) + eye, 0);
      if (p.dead) { const c = Math.min(1, G.crashT * 1.4); B.rotation.set(-(slopeA * .5) + Math.sin(G.crashT * 9) * .25 * (1 - c) * rm - c * .35, Math.sin(G.crashT * 3) * .3 * rm, Math.min(1.3, G.crashT * 2.2) * rm); }
      else B.rotation.set(-(slopeA + rel), -lean * .5, -lean * 1.6);
      // head: held a little more level than the slope so the horizon stays in view, bobbing, shaking on hard landings
      const bob = (p.ground && !p.dead ? Math.sin(t * (6 + k * 10)) * (.004 + k * .008) : 0) * rm, sh = (G.shake || 0) * rm * .0035;
      X.cam.rotation.set((p.dead ? 0 : slopeA * .5) - .2 + bob + (A.noise(t * 23) - .5) * sh, (A.noise(t * 19 + 40) - .5) * sh, 0);
      X.cam.position.set(0, bob * 60, 0);
      const base = W / H > 1 ? 58 : 74; X.cam.fov = base + k * 12 * rm + (G.fovKick || 0) * 6 * rm; X.cam.aspect = W / H; X.cam.updateProjectionMatrix();
      // world
      X.landUpdate(T, gx, gY, pal);
      X.propsUpdate({ T, gx, gY, t, rm, wind, fL });
      X.rigUpdate({ p, t, eye, lean, pl: Math.sin((p.pole || 0) * Math.PI * 2), tk, rd: A.rider(), k, runT: G.runT || 0 });
      X.fxUpdate({ T, G, p, gx, gY, dt, t, k, fL, eye, wind, rm });
      X.me.visible = !p.dead; X.me.position.set(fL, -(p.y - gY), 0); X.me.rotation.set(-slopeA * .2, 0, -lean); X.me.scale.set(1, tk ? .72 : 1, 1);
      // sun follows the action so shadows stay crisp just ahead of you
      const tz = 520, tg = X.sun.target.position.set(0, -(T.h(gx + tz) - gY), -tz); X.sun.position.copy(tg).addScaledVector(X.sdir, 2000);
      // render: far scene from the same view direction, then the near world on top
      const r = X.r; X.cam.updateMatrixWorld(true);      X.bgCam.fov = X.cam.fov; X.bgCam.aspect = X.cam.aspect; X.bgCam.updateProjectionMatrix(); X.cam.getWorldQuaternion(X.bgCam.quaternion); X.bgCam.position.set(0, 0, 0);
      X.skyU.uTime.value = t;
      const sc = 1 / Math.tan(X.cam.fov * Math.PI / 360) * H * X.pr / 2; X.puffs.material.uniforms.uScale.value = sc; X.flakes.material.uniforms.uScale.value = sc;
      r.clear(); r.render(X.bg, X.bgCam); r.clearDepth(); r.render(X.sc, X.cam);
      // where the sun/moon and the horizon land on screen, for the lens effects
      sunV.copy(X.sdir).multiplyScalar(1000).applyQuaternion(X.bgCam.quaternion.clone().invert()); const on = sunV.z < 0;
      sunV.copy(X.sdir).multiplyScalar(1000).project(X.bgCam); const sun = { x: (sunV.x + 1) / 2 * W, y: (1 - sunV.y) / 2 * H, on: on && sunV.x > -1.3 && sunV.x < 1.3 && sunV.y > -1.3 && sunV.y < 1.3 };
      sunV.set(0, 0, -1000).project(X.bgCam); const hor = A.clamp((1 - sunV.y) / 2 * H, 0, H);
      R.fp3Hud(g, G, dt, { W, H, pal, p, T, k, rm, sun, hor });
      return true;
    } catch (e) { X.failed = true; R.fp3Hide(); console.error('3D view off, falling back:', e); return false; }
  };
})(window.App);
