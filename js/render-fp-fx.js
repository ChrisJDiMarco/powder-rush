(function (A) {
  const R = A.R;
  // the rider's own shadow, cast across the slope by the low side light; it detaches and shrinks in the air
  R.fpShadow = function (g, o) {
    const { cx, W, H, hor, sDir, pal, air, lean, tk, t, rm } = o;
    const lift = Math.min(1, air / 220), a = (pal.night ? .16 : .36) * (1 - lift * .75);
    if (a < .01) return;
    const fx = cx + lean * .4 - sDir * W * (.04 + lift * .18), fy = H * (1.02 - lift * .12);
    const ex = fx - sDir * W * (.62 - lift * .2), ey = hor + (H - hor) * (.34 + lift * .18);
    const ux = ex - fx, uy = ey - fy, L = Math.hypot(ux, uy), vx = -uy / L, vy = ux / L, w = W * .11 * (1 - lift * .3);
    g.save(); g.transform(ux, uy, vx * w, vy * w, fx, fy); // local: y-axis lateral (±1), x-axis 0..1 feet->head
    g.fillStyle = pal.night ? 'rgba(6,10,30,' + a + ')' : 'rgba(40,66,128,' + a + ')';
    const sway = Math.sin(t * 2.1) * .04 * rm, c = tk ? .82 : 1;
    g.beginPath();
    g.ellipse(.2 * c, -.32, .2 * c, .17, 0, 0, 7); g.ellipse(.2 * c, .32, .2 * c, .17, 0, 0, 7); // legs
    g.ellipse(.56 * c, sway, .2 * c, .5, 0, 0, 7); // torso
    g.ellipse(.82 * c, sway * 1.4, .085, .25, 0, 0, 7); // head
    g.fill();
    g.strokeStyle = g.fillStyle; g.lineCap = 'round'; g.lineWidth = .02;
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(.62 * c, s * .45); g.lineTo(.42 * c, s * (tk ? .8 : 1.05)); g.lineWidth = .16; g.stroke(); g.beginPath(); g.lineWidth = .025; g.moveTo(.42 * c, s * (tk ? .8 : 1.05)); g.lineTo(tk ? .55 : .02, s * (tk ? 1.6 : 1.25)); g.stroke(); });
    // ski shadows streaking out ahead of the feet
    g.lineWidth = .1; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(-.25, s * .3); g.lineTo(.12, s * .3); g.stroke(); });
    g.restore();
    // soft penumbra under the feet
    g.globalAlpha = a * 1.2; g.drawImage(R.glow(pal.night ? '6,10,30' : '40,66,128'), fx - W * .2, fy - H * .05, W * .4, H * .1); g.globalAlpha = 1;
  };
  // sculpted, quilted sleeve: tapered, shaded across its round, puffy baffles and a sun-side rim
  R.fpArm = function (g, o) {
    const { s, x0, y0, x1, y1, col, pal, sDir } = o;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w0 = 20, w1 = 12;
    g.save();
    const P = (u, v) => [x0 + dx * u + nx * v * (w0 + (w1 - w0) * u), y0 + dy * u + ny * v * (w0 + (w1 - w0) * u)];
    g.beginPath(); let q = P(0, -1); g.moveTo(q[0], q[1]);
    for (let i = 1; i <= 8; i++) { const u = i / 8, b = 1 + Math.sin(u * Math.PI * 4) * .06; q = P(u, -b); g.lineTo(q[0], q[1]); }
    q = P(1, 0); const qe = P(1.06, 0); g.quadraticCurveTo(qe[0], qe[1], ...P(1, 1));
    for (let i = 7; i >= 0; i--) { const u = i / 8, b = 1 + Math.sin(u * Math.PI * 4) * .06; q = P(u, b); g.lineTo(q[0], q[1]); }
    g.closePath();
    const lit = s === sDir ? -1 : 1, a = P(.5, -1 * lit), b = P(.5, lit), gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
    gr.addColorStop(0, R.shade(col, 1.28)); gr.addColorStop(.45, col); gr.addColorStop(1, R.shade(col, .5));
    g.fillStyle = gr; g.fill();
    g.clip();
    // baffle seams with soft shading between puffs
    g.lineCap = 'round';
    for (let i = 1; i <= 3; i++) { const u = i / 4, l = P(u, -1.2), r = P(u, 1.2), m = P(u - .04, 0);
      g.strokeStyle = 'rgba(10,12,30,.28)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(l[0], l[1]); g.quadraticCurveTo(m[0], m[1], r[0], r[1]); g.stroke();
      const l2 = P(u - .05, -1.2), r2 = P(u - .05, 1.2), m2 = P(u - .09, 0); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 3; g.beginPath(); g.moveTo(l2[0], l2[1]); g.quadraticCurveTo(m2[0], m2[1], r2[0], r2[1]); g.stroke(); }
    // reflective piping running down the sleeve
    const p0 = P(0, .35), p1 = P(1, .35); g.strokeStyle = 'rgba(235,240,250,.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
    g.restore();
    // key-light rim along the lit edge
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(' + (pal.night ? '150,170,230' : pal.sun) + ',.4)'; g.lineWidth = 1.6; g.beginPath();
    for (let i = 0; i <= 8; i++) { const u = i / 8; q = P(u, -lit * .96); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); g.restore();
    // elastic cuff at the wrist
    const c0 = P(.93, -1.05), c1 = P(.93, 1.05); g.strokeStyle = R.shade(col, .42); g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1]); g.stroke();
  };
  // glare ice: mirror sheen of the sky and crisp running glints
  R.fpIce = function (g, o) {
    const { rows, W, pal, t, k } = o; if (!rows.length) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    const sky = pal.night ? '120,150,220' : pal.sun;
    for (const r of rows) { const h = r.y1 - r.y0; if (h < .6) continue;
      const gr = g.createLinearGradient(0, r.y0, 0, r.y1); gr.addColorStop(0, 'rgba(' + sky + ',' + (.22 * r.a).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(160,210,255,' + (.06 * r.a).toFixed(3) + ')');
      g.fillStyle = gr; g.fillRect(r.xl, r.y0, r.xr - r.xl, h);
      if (h > 2) { g.strokeStyle = 'rgba(255,255,255,' + (.5 * r.a).toFixed(3) + ')'; g.lineWidth = Math.min(2, h * .15);
        for (let i = 0; i < 3; i++) { const ph = (A.hash(r.z * .01 + i * 7.7) + t * (.05 + k * .2)) % 1, sx = r.xl + ph * (r.xr - r.xl) * .85, sl = W * (.08 + A.hash(i + r.z) * .14) * Math.min(1, h / 8); g.beginPath(); g.moveTo(sx, r.y0 + h * (.3 + i * .2)); g.lineTo(sx + sl, r.y0 + h * (.3 + i * .2)); g.stroke(); } } }
    g.restore();
  };
  // crust of packed snow riding on the ski tips, jiggling over the bumps
  R.fpTipSnow = function (g, o) {
    const { tx, tipY, W, H, s, pal, n, bob } = o; if (n < .05) return;
    const c1 = R.shade(pal.snow, 1.04), c0 = R.shade(pal.snow, .82);
    for (let i = 0; i < 5; i++) { if (i / 5 > n) break; const h1 = A.hash(i * 3.1 + s), u = .03 + i * .05, x = tx + (h1 - .5) * W * .03 + s * W * u * .3, y = tipY + H * (.025 + u * .5) + bob * .3 * (i % 2 ? 1 : -1), r = W * (.008 + h1 * .009) * (1 + u * 3);
      g.fillStyle = c0; g.beginPath(); g.ellipse(x, y + r * .35, r * 1.1, r * .7, 0, 0, 7); g.fill();
      g.fillStyle = c1; g.beginPath(); g.ellipse(x - r * .15, y, r, r * .62, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x - r * .4, y - r * .2, r * .22, 0, 7); g.fill(); }
  };
  // anamorphic streak through the key light, like a wide cinema lens
  R.fpStreak = function (g, o) {
    const { W, H, pal, t } = o, sx = W * pal.sp[0], sy = H * pal.sp[1], fl = .85 + .15 * Math.sin(t * 1.3);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = (pal.night ? .18 : .42) * fl; g.drawImage(R.glow(pal.night ? '160,190,255' : pal.sun), sx - W * 1.1, sy - 3, W * 2.2, 6);
    g.globalAlpha = (pal.night ? .1 : .22) * fl; g.drawImage(R.glow('110,165,255'), sx - W * .8, sy - 9, W * 1.6, 18);
    g.globalAlpha = .5 * fl; g.drawImage(R.glow('255,255,255'), sx - W * .25, sy - 1.5, W * .5, 3);
    g.restore();
  };
})(window.App);
