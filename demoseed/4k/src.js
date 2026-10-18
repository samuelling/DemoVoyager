// Demoseed 4K: one seed -> one demo (song + visuals), all computed locally.
// Readable source. build.sh minifies (terser) and packs (deflate + DecompressionStream loader).
let {sin: S, cos: C, exp: E, hypot: Y, atan2: A, abs: B, tanh: N} = Math;
let x = c.getContext('2d'), im = x.createImageData(320, 200), px = new Uint32Array(im.data.buffer);
let seed = parseInt(location.hash.slice(1), 16) || Date.now() % 1e9;
let ac, src, t0, st, kick, pal, name, text, R, on;

// a ship: 5 vertices, 6 faces; drawn flat-shaded as canvas paths, painter-sorted
let SV = [[0, 0, 2], [-2, 0, -1], [2, 0, -1], [0, .7, -.8], [0, -.4, -.8]], SF = [[0, 1, 3], [0, 3, 2], [0, 2, 4], [0, 4, 1], [1, 4, 2], [1, 2, 3]];
let ships = L => {
  let T = [];
  for (let [ox, oy, oz, yw, rl] of L) {
    let P = SV.map(([a, b, c]) => { let X = a * C(rl) - b * S(rl); return [X * C(yw) + c * S(yw) + ox, a * S(rl) + b * C(rl) + oy, c * C(yw) - X * S(yw) + oz] });
    for (let f of SF) {
      let [p, q, r] = f.map(i => P[i]), u = q.map((v, i) => v - p[i]), v = r.map((v, i) => v - p[i]),
        n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      T.push([p[2] + q[2] + r[2], B(n[0] - n[1] + n[2]) / Y(...n) / 1.8, p, q, r]);
    }
  }
  T.sort((a, b) => b[0] - a[0]);
  for (let [z, l, ...V] of T) {
    x.beginPath();
    for (let [a, b, c] of V) x.lineTo(160 + a / c * 200, 100 - b / c * 200);
    x.fillStyle = `hsl(${pal[0] * 60},50%,${8 + l * 70}%)`;
    x.fill();
  }
};

let go = () => {
  let s = seed | 1, i, j, k, o, d, r, key, sc, h, prog, sn, ha, ba, mot, deg, P, W, hex, mk;
  location.hash = hex = (s >>> 0).toString(16);
  R = () => (s ^= s << 13, s ^= s >>> 17, s ^= s << 5, (s >>> 0) / 2 ** 32);
  P = a => a[R() * a.length | 0];
  W = () => (P('ne xe vo ky zy ra ha mo sy te lu cy ze or dra tri ka vi'.split(' ')) + P('ne vo zy ra mo te cy or ka'.split(' ')) + P('tron rix lon zar nox dyne vex lux gon tek rax ion plex'.split(' '))).toUpperCase();
  name = W();
  text = name + ' PRESENTS ' + W() + ' * SEED ' + hex + ' * GREETINGS TO ' + W() + ' ' + W() + ' ' + W() + ' * ';

  // music: random key, tempo, progression; templated drums; seeded bass and two motifs
  ac = ac || new AudioContext;
  r = ac.sampleRate; key = R() * 12 | 0; sc = [0, 2, 3, 5, 7, 8, 10];
  st = r * 15 / (116 + R() * 36) | 0;
  d = (src = ac.createBufferSource()).buffer = ac.createBuffer(1, 650 * st, r);
  d = d.getChannelData(0);
  h = n => 55 * 2 ** ((sc[(n += 70) % 7] + 12 * (n / 7 | 0) + key + mk - 120) / 12);
  prog = [0, 2 + R() * 5 | 0, 3 + R() * 4 | 0, 2 + R() * 5 | 0];
  kick = P([4369, 1089, 1281, 4385]); sn = P([4112, 4112, 256]); ha = P([21845, 17476, 65535]);
  ba = R() * 65536 | 257;
  mot = [0, 1].map(_ => [R() * 65536 & R() * 65536 | R() * 65536 & 4369 | 1, [...Array(16)].map(_ => P([-2, -1, -1, 0, 1, 1, 2]))]);
  let add = (n, f) => { for (j = 0; j < n; j++) d[o + j] += f(j / r) };
  for (k = 0; k < 640; k++) {
    let q = k >> 6, m = [16, 25, 63, 63, 24, 63, 63, 31, 63, 17][q], i = k & 15, b = k >> 4 & 3, ch = prog[b + (q == 5 | q == 6) * 2 & 3], mo = mot[b >> 1 & b];
    mk = (q > 7) * 2;
    o = k * st;
    m & 1 && kick >> i & 1 && add(r / 3, t => S(6.28 * (50 * t + 8 - 8 * E(-t * 25))) * E(-t * 7));
    m & 2 && sn >> i & 1 && add(r / 4, t => (R() - .5) * E(-t * 18));
    m & 4 && ha >> i & 1 && add(r / 9, t => (R() - .5) * E(-t * 90) * .4);
    m & 8 && ba >> i & 1 && add(st * 2, t => (t * h(ch) % 1 - .5) * E(-t * 6) * .6);
    m & 16 && add(st, t => (t * h(ch + [0, 2, 4, 7][i & 3]) * 4 % 1 < .5 ? .1 : -.1) * E(-t * 9));
    i || (deg = ch);
    if (mo[0] >> i & 1) {
      deg += mo[1][i];
      i & 3 || (deg -= deg - ch & 1);
      let f = h(deg + 7) * 4;
      m & 32 && add(st * 3, t => (B(t * f * (1 + .006 * S(t * 35)) % 1 * 4 - 2) - 1) * E(-t * 3) * .25);
    }
  }
  for (i = 3 * st; i < d.length; i++) d[i] += d[i - 3 * st] * .35;
  for (i = d.length; i--;) d[i] = (N(d[i]) * 127 | 0) / 127;

  // visuals: palette phases, band frequency, effect permutation (7 is prime, so any step 1-6 visits all), fleet size
  pal = [R() * 6, R() * 6, R() * 6, 2 + R() * 4, 1 + R() * 6 | 0, R() * 7 | 0, 3 + R() * 7 | 0];
  if (on) on.stop();
  (on = src).connect(ac.destination); src.start();
  t0 = ac.currentTime;
};

c.onclick = () => { if (R) seed = R() * 2 ** 32; go() };

let F = () => {
  requestAnimationFrame(F);
  x.fillStyle = '#fff'; x.font = '9px monospace';
  if (!R) return x.fillText('TAP', 152, 100);
  let t = ac.currentTime - t0, k = t * ac.sampleRate / st, q = k >> 6, e = q ? q > 8 ? 0 : (q * pal[4] + pal[5]) % 7 : 5,
    j, i, u, v, l, a, w, g = S(t), z, cs = C(t * .4), sn = S(t * .4), f = 5 + 3 * g, col = (w, b) => 255 << 24 | (128 + 127 * C(w + pal[2])) * b << 16 | (128 + 127 * C(w + pal[1])) * b << 8 | (128 + 127 * C(w + pal[0])) * b;
  if (q > 9) return c.onclick();
  let bt = .72 + (kick >> (k & 15) & 1) * E(-k % 1 * 3) * .28;
  if (e < 5) for (j = 64e3; j--;) {
    u = (j % 320 - 160) / 100; v = (j / 320 - 100) / 100; l = Y(u, v); a = A(v, u);
    z = f * (u * cs - v * sn) & 1 ^ f * (u * sn + v * cs) & 1;
    w = q > 8 ? S(l * 9 - t * 3) + S(a * 3 + t)
      : e < 1 ? S(u * 5 + t) + S(v * 7 - t) + S(u * 4 + v * 4 + t) + S(l * 9 - t * 2)
      : e < 2 ? ((32 / l + t * 60 ^ a * 41 + t * 9) & 63) / 9 * (l > .5 || l * 2)
      : e < 3 ? z * 2 + l
      : e < 4 ? (Y(u - g, v) * 30 ^ Y(u + S(t * .7), v - C(t * .5)) * 30) & 1 ? 3 + l : l
      : .1 / ((u - g) ** 2 + v * v) + .1 / ((u + S(t * .8)) ** 2 + (v - C(t)) ** 2) + .1 / (u * u + (v + S(t * 1.3)) ** 2) | 0;
    px[j] = col(w * pal[3] + t, bt);
  }
  else if (e < 6) {
    // space: streaming starfield
    px.fill(255 << 24);
    for (i = 600; i--;) {
      z = 1 - (t * .15 + i / 600) % 1; u = 160 + (S(i * 7.3) * 99 % 1) / z * 160 | 0; v = 100 + (C(i * 3.1) * 99 % 1) / z * 100 | 0;
      u >= 0 && u < 320 && v >= 0 && v < 200 && (px[v * 320 + u] = col(0, 1 - z));
    }
  } else {
    // voxel flight over sine terrain: one ray per column, front to back, fogged to the sky colour
    let H = (a, b) => 40 * (S(a * .021) + C(b * .017) + S((a + b) * .009)) + 12 * S(a * .07) * C(b * .08),
      hd = t * .15 + S(t * .3) * .6, cx = S(hd) * t * 40, cz = C(hd) * t * 40 + t * 20, ch = Math.max(H(cx, cz), 0) + 70, sky = col(2, 1);
    px.fill(sky);
    for (i = 320; i--;) {
      let an = hd + (i - 160) / 280, dx = S(an), dz = C(an), yb = 200, D, hh, sy;
      for (D = 3; D < 400; D += 1 + D * .02) {
        hh = H(cx + dx * D, cz + dz * D);
        sy = 60 + (ch - hh) / D * 120 | 0;
        if (sy < yb) {
          w = col(hh / 30 + 1, (.6 + hh / 400) * (1 - D / 400));
          for (j = Math.max(sy, 0); j < yb; j++) px[j * 320 + i] = w;
          yb = sy;
        }
      }
    }
  }
  // lens: a magnifying glass bouncing over every other plasma-family scene
  if (e < 5 && (q + pal[5]) % 2 && q < 9 && q) {
    let T2 = px.slice(), lx = 160 + 110 * S(t * .9) | 0, ly = 150 - 100 * B(S(t * 1.8)) | 0;
    for (j = -48; j < 48; j++) for (i = -48; i < 48; i++) if ((l = i * i + j * j) < 2304) {
      w = 1 - Math.sqrt(1 - l / 2304) * .55;
      px[(ly + j) * 320 + lx + i] = T2[(ly + j * w | 0) * 320 + (lx + i * w | 0)];
    }
  }
  x.putImageData(im, 0, 0);
  if (e == 5) {
    // planet + fleet sweeping around the camera
    let g2 = x.createRadialGradient(90, 60, 5, 110, 80, 70);
    g2.addColorStop(0, `hsl(${pal[1] * 60},60%,60%)`); g2.addColorStop(1, '#000');
    x.fillStyle = g2; x.beginPath(); x.arc(110, 80, 70, 0, 7); x.fill();
    let ph = t * .35, L = [];
    for (i = pal[6]; i--;) {
      let bx = (i % 3 - 1) * 4 + S(t + i) * .5, by = (i / 3 | 0) * 1.6 - 2 + C(t * .7 + i) * .3, bz = (i / 3 | 0) * 4 - 4;
      L.push([bx * C(ph) + bz * S(ph), by, bz * C(ph) - bx * S(ph) + 18, ph + S(t * .5) * .3, S(t * .6) * .4]);
    }
    ships(L);
  }
  if (e == 6) ships([[S(t * .7) * 1.5, -1.5 + S(t) * .3, 9, S(t * .5) * .3, -S(t * .7) * .5]]);
  x.fillStyle = '#fff';
  q || x.fillText(name, 160 - name.length * 2.7, 104);
  x.fillText(text, 320 - t * 50 % (text.length * 5.4 + 320), 190 + S(t * 5) * 3);
};
F();
