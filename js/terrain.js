(function (A) {
  const DX = 24;
  function T(seed) {
    this.r = A.rng(seed); this.y = []; this.t = []; this.objs = []; this.rails = []; this.lodges = [];
    this.cy = 0; this.s = .28;
    for (let i = 0; i < 34; i++) this.push(.28, 0);
  }
  A.Terrain = T; T.DX = DX;
  T.prototype.push = function (s, t) { this.cy += s * DX; this.y.push(this.cy); this.t.push(t || 0); };
  T.prototype.ensure = function (x) { while (this.y.length * DX < x + 2600) this.feature(); };
  T.prototype.h = function (x) {
    let f = x / DX; const i = Math.floor(f); f -= i;
    const Y = this.y, n = Y.length, g = k => Y[k < 0 ? 0 : k >= n ? n - 1 : k];
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    return .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  };
  T.prototype.slope = function (x) { return (this.h(x + 3) - this.h(x - 3)) / 6; };
  T.prototype.type = function (x) { return this.t[A.clamp(Math.round(x / DX), 0, this.t.length - 1)]; };

  T.prototype.ease = function (n, ts, t) {
    for (let j = 0; j < n; j++) {
      this.s += (ts - this.s) * .12;
      this.push(this.s + (A.noise(this.y.length * .17) - .5) * .1, t);
    }
  };
  T.prototype.feature = function () {
    const r = this.r, i0 = this.y.length, d = Math.min(1, i0 / 2500), k = r();
    if (i0 < 60) { this.ease(30, .3, 0); this.decorate(i0 + 6, this.y.length, .5); return; }
    if (k < .24) { this.ease(22 + (r() * 30 | 0), .22 + r() * .3, 0); this.decorate(i0, this.y.length, 1); }
    else if (k < .42) { // kicker
      this.ease(9, .18, 0);
      const sz = .7 + r() * .5 * (.6 + d);
      [-.12, -.3, -.46, -.58].forEach(v => this.push(v * sz, 0));
      const li = this.y.length - 1, lx = li * DX, ly = this.y[li];
      for (let j = 0; j < 6; j++) this.push(1 + .3 * sz, 0);
      this.s = .75; this.ease(26, .42, 0);
      if (r() < .3) this.objs.push({ k: 'mag', x: lx + 190, y: ly - 120 * sz });
      for (let j = 0; j < 6; j++) this.objs.push({ k: 'coin', x: lx + 70 + j * 48, y: ly - 40 - Math.sin(j / 5 * Math.PI) * 55 * sz });
    } else if (k < .52) { // cliff
      this.ease(10, .1, 0);
      const n = 2 + (r() * 2 * (.4 + d) | 0);
      for (let j = 0; j < n; j++) this.push(3 + r() * 1.5, 0);
      this.s = .7; this.ease(26, .48, 0); this.decorate(this.y.length - 12, this.y.length, .4);
    } else if (k < .61) { // moguls
      for (let j = 0; j < 26; j++) this.push(.32 + Math.sin(j * 1.05) * .75, 0);
      this.s = .32;
    } else if (k < .7) { // rail
      this.ease(6, .3, 0);
      const a = this.y.length;
      for (let j = 0; j < 22; j++) this.push(.32, 0);
      const x1 = (a + 3) * DX, x2 = (a + 18) * DX, y1 = this.y[a + 3] - 30, y2 = this.y[a + 18] - 30;
      const m = (y2 - y1) / (x2 - x1);
      this.rails.push({ x1, y1, x2, y2, m, a: Math.atan(m) });
      for (let j = 0; j < 5; j++) this.objs.push({ k: 'coin', x: x1 + 60 + j * 70, y: y1 + (60 + j * 70) * m - 26 });
    } else if (k < .8) { this.ease(30, .36, 2); this.decorate(i0 + 4, this.y.length, .6); }
    else if (k < .88) { this.ease(20, .55, 1); }
    else { // lodge plateau
      this.ease(18, .12, 0);
      const li = i0 + 9; this.lodges.push({ x: li * DX, s: .8 + r() * .5 });
      this.decorate(i0 + 13, this.y.length, .8);
    }
  };
  T.prototype.decorate = function (a, b, dens) {
    const r = this.r, d = Math.min(1, a / 1500);
    for (let j = a + 4; j < b - 3; j += 6 + (r() * 9 | 0)) {
      const x = j * DX + r() * DX, q = r();
      if (q < .3 * dens * (.55 + .45 * d)) {
        const z = r(); let o;
        if (z < .35) o = { k: 'rock', r: 15, h: 16 };
        else if (z < .6) o = { k: 'tree', r: 10, h: 30 };
        else if (z < .85 || d < .25) o = { k: 'snowman', r: 11, h: 34 };
        else o = { k: 'yeti', r: 15, h: 50, vx: -40 };
        o.x = x; o.y = this.h(x); o.s = A.hash(x); this.objs.push(o);
        j += 5 + Math.round((1 - d) * 7);
      } else if (q < .62 * dens) {
        const n = 3 + (r() * 3 | 0);
        for (let c = 0; c < n; c++) { const cx = x + c * 34; this.objs.push({ k: 'coin', x: cx, y: this.y[Math.min(this.y.length - 1, Math.round(cx / DX))] - 24 }); }
        j += 4;
      }
    }
  };
  T.prototype.prune = function (x) {
    this.objs = this.objs.filter(o => o.x > x - 900);
    this.rails = this.rails.filter(r => r.x2 > x - 900);
    this.lodges = this.lodges.filter(l => l.x > x - 1600);
  };
})(window.App);
