(function (A) {
  const G = 1000;
  function P(t, x) {
    this.t = t; this.x = x; this.y = t.h(x);
    const a = Math.atan(t.slope(x));
    this.sp = 380; this.vx = this.sp * Math.cos(a); this.vy = this.sp * Math.sin(a);
    this.ang = a; this.av = 0; this.ground = true; this.crouch = .2; this.grabT = 0; this.air = 0; this.rot = 0;
    this.rail = null; this.railT = 0; this.dead = false; this.tuck = false; this.hold = 0; this.parts = null;
    this.pole = 0; this.tricks = []; this.maxH = 0; this.groundT = 0; this.grab = false;
  }
  A.Player = P;
  P.prototype.speed = function () { return Math.hypot(this.vx, this.vy); };
  P.prototype.jump = function () {
    if (this.dead || !(this.ground || this.rail)) return false;
    const a = this.rail ? this.rail.a : Math.atan(this.t.slope(this.x));
    const p = 330 + Math.min(this.hold, .6) * 260;
    if (this.rail) { this.vx = this.sp * Math.cos(a); this.vy = this.sp * Math.sin(a); }
    this.vx += Math.sin(a) * p; this.vy -= Math.cos(a) * p;
    this.hold = 0; this.leave(); A.Audio.pop(); return true;
  };
  P.prototype.leave = function () {
    if (this.rail && this.railT > .15) this.tricks.push({ n: 'RAIL GRIND', p: Math.round(200 + this.railT * 600) });
    if (!this.rail) this.tricks = [];
    this.ground = false; this.rail = null; this.air = 0; this.rot = 0; this.grabT = 0; this.maxH = 0; this.av *= .3;
  };
  P.prototype.airTricks = function () {
    const out = [], n = Math.floor((Math.abs(this.rot) + 1.0) / (2 * Math.PI));
    if (n > 0) out.push({ n: (['', '', 'DOUBLE ', 'TRIPLE ', 'QUAD '][n] || n + 'x ') + (this.rot < 0 ? 'BACKFLIP' : 'FRONTFLIP'), p: n * n * 500 + (this.rot > 0 ? 150 : 0), f: n });
    if (this.grabT > .3) out.push({ n: this.grabT > 1 ? 'LONG GRAB' : n ? 'GRAB' : 'TAIL GRAB', p: Math.round(150 + this.grabT * 300) });
    if (this.air > 1.3) out.push({ n: 'BIG AIR', p: Math.round(this.air * 160) });
    this.rot = 0; this.grabT = 0; this.air = 0;
    return out;
  };
  P.prototype.update = function (dt, inp, g) {
    if (this.dead) { this.updParts(dt); return; }
    const t = this.t;
    this.grab = false;
    if (this.rail) {
      const R = this.rail;
      this.sp += (G * Math.sin(R.a) * .8 - .0004 * this.sp * this.sp) * dt;
      this.sp = Math.max(160, this.sp);
      this.x += this.sp * Math.cos(R.a) * dt; this.y = R.y1 + (this.x - R.x1) * R.m;
      this.vx = this.sp * Math.cos(R.a); this.vy = this.sp * Math.sin(R.a);
      this.ang += A.wrapA(R.a - this.ang) * Math.min(1, dt * 14);
      this.railT += dt; this.tuck = inp.act; if (inp.act) this.hold += dt;
      this.crouch += (.55 - this.crouch) * Math.min(1, dt * 8);
      if (this.x > R.x2) { const tr = this.tricks; this.leave(); this.tricks = tr; }
      return;
    }
    if (this.ground) {
      const a = Math.atan(t.slope(this.x)), ty = t.type(this.x);
      this.tuck = inp.act; if (inp.act) this.hold += dt; else this.hold = 0;
      const mu = ty === 1 ? .012 : ty === 2 ? .17 : .045;
      const dr = (this.tuck ? .00032 : .00075) * (ty === 2 ? 1.5 : 1) * (inp.down && !this.tuck ? 2.6 : 1);
      this.carve = inp.down && !this.tuck;
      const acc = G * Math.sin(a) - mu * G * Math.cos(a) - dr * this.sp * this.sp;
      this.sp += acc * dt;
      if (this.sp < 150) this.sp += (150 - this.sp) * dt * 2;
      const vm = (g && g.vmax) || 1400; if (this.sp > vm) this.sp -= (this.sp - vm) * Math.min(1, dt * 1.5);
      this.sp = Math.min(this.sp, 1400);
      const vx = this.sp * Math.cos(a), vy = this.sp * Math.sin(a);
      const nx = this.x + vx * dt, by = this.y + vy * dt + .5 * G * dt * dt, gy = t.h(nx);
      if (gy > by + 1.2 && this.sp > 160) {
        this.x = nx; this.y = by; this.vx = vx; this.vy = vy + G * dt; this.leave();
      } else {
        this.x = nx; this.y = gy;
        const a2 = Math.atan(t.slope(nx));
        this.vx = this.sp * Math.cos(a2); this.vy = this.sp * Math.sin(a2);
        this.ang += A.wrapA(a2 - this.ang) * Math.min(1, dt * 16);
        this.groundT += dt;
      }
      this.crouch += ((this.tuck ? 1 : .18 + Math.min(.35, Math.max(0, -acc) / 2500)) - this.crouch) * Math.min(1, dt * 10);
      this.pole = this.tuck || this.sp > 650 ? 0 : (this.pole + dt * 1.3) % 1;
      this.av *= .5;
    } else {
      this.air += dt; this.vy += G * dt; this.vx *= 1 - .03 * dt;
      const py = this.y; this.x += this.vx * dt; this.y += this.vy * dt;
      let tgt = 0; if (inp.back) tgt = -7.4; else if (inp.front) tgt = 7.4;
      if (tgt) this.av += (tgt - this.av) * Math.min(1, dt * 5); else this.av *= Math.pow(.3, dt);
      this.ang += this.av * dt; this.rot += this.av * dt;
      if (inp.down) { this.grabT += dt; this.grab = true; }
      this.crouch += (((tgt || inp.down) ? .95 : .35) - this.crouch) * Math.min(1, dt * 8);
      const gy = t.h(this.x); this.maxH = Math.max(this.maxH, gy - this.y);
      if (this.vy > 0) for (const R of t.rails) {
        if (this.x > R.x1 && this.x < R.x2) {
          const ry = R.y1 + (this.x - R.x1) * R.m;
          if (py <= ry + 3 && this.y >= ry && Math.abs(A.wrapA(this.ang - R.a)) < .75) {
            this.tricks = this.tricks.concat(this.airTricks());
            this.rail = R; this.y = ry; this.railT = 0; this.ang = R.a; this.av = 0;
            this.sp = Math.max(220, this.vx * Math.cos(R.a) + this.vy * Math.sin(R.a));
            g.onRail(this); return;
          }
        }
      }
      if (this.y >= gy) { this.y = gy; g.land(this); }
    }
  };
  P.prototype.crash = function (rd) {
    this.dead = true; this.rail = null;
    const c = Math.cos(this.ang), s = Math.sin(this.ang), self = this;
    const at = (lx, ly) => ({ x: self.x + lx * c - ly * s, y: self.y + lx * s + ly * c });
    const spec = [
      ['head', 6, 0, -40, rd.helmet], ['torso', 18, -1, -28, rd.jacket], ['arm', 14, 4, -30, rd.jacket], ['arm', 14, -2, -30, rd.jacket],
      ['leg', 18, 2, -12, rd.pants], ['leg', 18, -4, -12, rd.pants], ['ski', 54, 0, -2, rd.skis], ['ski', 54, 2, -2, rd.skis],
      ['pole', 30, 8, -20, '#c9d2dc'], ['pole', 30, -6, -20, '#c9d2dc']
    ];
    this.parts = spec.map((p, i) => {
      const q = at(p[2], p[3]), sk = p[0] === 'ski' || p[0] === 'pole';
      return { k: p[0], len: p[1], col: p[4], x: q.x, y: q.y, ang: this.ang + (Math.random() - .5),
        vx: this.vx * (sk ? .8 : .55) + (Math.random() - .5) * 260, vy: this.vy * .4 - 160 - Math.random() * 260,
        av: (Math.random() - .5) * (sk ? 22 : 14), r: p[0] === 'head' ? 6 : 4, i };
    });
  };
  P.prototype.updParts = function (dt) {
    const t = this.t;
    for (const p of this.parts) {
      p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.ang += p.av * dt;
      const gy = t.h(p.x) - p.r;
      if (p.y > gy) {
        p.y = gy; const a = Math.atan(t.slope(p.x));
        const vn = p.vx * Math.sin(a) - p.vy * Math.cos(a);
        if (vn < 0) { p.vx -= 1.4 * vn * Math.sin(a); p.vy += 1.4 * vn * Math.cos(a); }
        p.vx *= .86; p.vy *= .86; p.av = p.av * .7 + (p.vx / 60) * .3;
      }
    }
    const torso = this.parts[1]; this.x = torso.x; this.y = torso.y + 20; this.vx = torso.vx; this.vy = torso.vy;
  };
})(window.App);
