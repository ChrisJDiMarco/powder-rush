(function (A) {
  const S = A.Audio = { ctx: null };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function noiseSrc(C, f, type, freq, q) {
    const n = C.createBufferSource(); n.buffer = S.nb; n.loop = true;
    const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q || .7;
    const g = C.createGain(); g.gain.value = 0;
    n.connect(fl); fl.connect(g); g.connect(S.sfx); n.start(); return { f: fl, g };
  }
  S.init = function () {
    if (S.ctx) { if (S.ctx.state === 'suspended') S.ctx.resume(); return; }
    try {
      const C = S.ctx = new (window.AudioContext || window.webkitAudioContext)();
      S.master = C.createGain(); S.master.gain.value = A.save.muted ? 0 : .9; S.master.connect(C.destination);
      S.sfx = C.createGain(); S.sfx.gain.value = .8; S.sfx.connect(S.master);
      S.mus = C.createGain(); S.mus.gain.value = .2; S.mus.connect(S.master);
      const b = C.createBuffer(1, C.sampleRate * 2, C.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      S.nb = b;
      S.wind = noiseSrc(C, 0, 'bandpass', 400, .6);
      S.carve = noiseSrc(C, 0, 'highpass', 2200, .5);
      S.rumble = noiseSrc(C, 0, 'lowpass', 110, 1);
      S.dl = C.createDelay(); S.dl.delayTime.value = .535;
      const fb = C.createGain(); fb.gain.value = .33; const dlf = C.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2200;
      S.dl.connect(dlf); dlf.connect(fb); fb.connect(S.dl); dlf.connect(S.mus);
      S.next = C.currentTime + .2; S.step = 0;
    } catch (e) { S.ctx = null; }
  };
  S.setMute = m => { if (S.master) S.master.gain.setTargetAtTime(m ? 0 : .9, S.ctx.currentTime, .05); };

  const STEP = 60 / 84 / 4;
  const CH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]];
  const BASS = [45, 41, 48, 43];
  const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
  function tone(t, f, dur, type, vol, dest, att) {
    const C = S.ctx, o = C.createOscillator(), g = C.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (att || .005));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || S.sfx); o.start(t); o.stop(t + dur + .05); return o;
  }
  function pad(t, notes, dur) {
    const C = S.ctx, lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = C.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .8); g.gain.linearRampToValueAtTime(0, t + dur);
    lp.connect(g); g.connect(S.mus);
    notes.forEach(m => [-7, 7].forEach(dt => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mf(m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + .1); }));
  }
  function playStep(t, s) {
    const bar = Math.floor(s / 16) % 4, k = s % 16, ch = CH[bar];
    if (k === 0) pad(t, ch, STEP * 16 + .3);
    if (k === 0 || k === 8 || (k === 11 && bar % 2)) tone(t, mf(BASS[bar] - 12), .5, 'sine', .32, S.mus, .01);
    if (k % 2 === 0) {
      const o = tone(t, mf(ch[ARP[(k / 2) % 8]] + 12), .45, 'triangle', .09, S.mus);
      const g = S.ctx.createGain(); g.gain.value = .5; o.connect(g); g.connect(S.dl);
    }
    if (k === 0 || k === 8) { const o = S.ctx.createOscillator(), g = S.ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g); g.connect(S.mus); o.start(t); o.stop(t + .3); }
    if (k % 4 === 2) burst(t, .04, 'highpass', 7000, .05, S.mus);
  }
  function burst(t, dur, type, f, vol, dest, f2) {
    const C = S.ctx, n = C.createBufferSource(); n.buffer = S.nb;
    const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = C.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    n.connect(fl); fl.connect(g); g.connect(dest || S.sfx); n.start(t, Math.random()); n.stop(t + dur + .05);
  }
  S.tick = function (sp, ground, typ, aval) {
    if (!S.ctx) return;
    const t = S.ctx.currentTime, v = Math.min(1, sp / 1100);
    S.wind.g.gain.setTargetAtTime(.03 + v * v * .45, t, .15);
    S.wind.f.frequency.setTargetAtTime(220 + v * 1300, t, .15);
    S.carve.g.gain.setTargetAtTime(ground ? (typ === 2 ? .16 : typ === 1 ? .2 : .08) * (.3 + v) : 0, t, .05);
    S.carve.f.frequency.setTargetAtTime(typ === 2 ? 800 : typ === 1 ? 3800 : 2200, t, .1);
    S.rumble.g.gain.setTargetAtTime(aval * 1.4, t, .25);
    if (S.next < t) S.next = t + .05;
    while (S.next < t + .5) { playStep(S.next, S.step++); S.next += STEP; }
  };
  S.thud = v => { if (!S.ctx) return; const t = S.ctx.currentTime, k = Math.min(1, v / 900); const o = tone(t, 150, .3, 'sine', .2 + .5 * k); o.frequency.exponentialRampToValueAtTime(40, t + .25); burst(t, .25, 'lowpass', 900, .25 + .4 * k, null, 200); };
  S.pop = () => { if (!S.ctx) return; const t = S.ctx.currentTime; burst(t, .18, 'bandpass', 1200, .25, null, 4000); };
  S.swish = () => { if (!S.ctx) return; burst(S.ctx.currentTime, .3, 'bandpass', 600, .2, null, 3000); };
  S.whoosh = () => { if (!S.ctx) return; const t = S.ctx.currentTime; burst(t, .35, 'bandpass', 2400, .22, null, 300); };
  S.coin = () => { if (!S.ctx) return; const t = S.ctx.currentTime; tone(t, 1318, .12, 'square', .04); tone(t + .06, 1976, .2, 'square', .04); };
  S.chime = n => { if (!S.ctx) return; const t = S.ctx.currentTime, sc = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]; for (let i = 0; i < Math.min(n + 2, 7); i++) tone(t + i * .07, mf(sc[i + Math.min(n, 3)]), .6, 'triangle', .12); };
  S.crash = () => { if (!S.ctx) return; const t = S.ctx.currentTime; burst(t, .9, 'lowpass', 1600, .7, null, 150); const o = tone(t, 90, .5, 'sine', .6); o.frequency.exponentialRampToValueAtTime(30, t + .4); };
})(window.App);
