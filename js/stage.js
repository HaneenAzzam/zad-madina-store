// Hero scene: cuts each product out of the store's group photos (b1, b2) so we can
// re-arrange them inside a wooden crate. Runs in the browser; if anything fails the
// original group photo stays visible as a fallback.
(() => {
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;
  const T = 24; // background tolerance

  const load = src => new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
  });

  // crop rect [x0, y0, x1, y1] from the source photo, then remove the flat background
  function cut(img, [x0, y0, x1, y1]) {
    const W = img.naturalWidth, H = img.naturalHeight;
    const src = document.createElement('canvas'); src.width = W; src.height = H;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    const bgd = sctx.getImageData(0, 0, 8, 8).data; // top-left corner = studio background
    let r = 0, g = 0, b = 0; const n = bgd.length / 4;
    for (let i = 0; i < bgd.length; i += 4) { r += bgd[i]; g += bgd[i + 1]; b += bgd[i + 2]; }
    r /= n; g /= n; b /= n;

    const w = x1 - x0, h = y1 - y0;
    const id = sctx.getImageData(x0, y0, w, h), d = id.data;
    const dist = i => Math.hypot(d[i] - r, d[i + 1] - g, d[i + 2] - b);

    const gone = new Uint8Array(w * h), st = [];
    const push = (x, y) => { const p = y * w + x; if (gone[p] || dist(p * 4) > T) return; gone[p] = 1; st.push(p); };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (st.length) {
      const p = st.pop(), x = p % w, y = (p / w) | 0;
      if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
    }

    let minx = w, miny = h, maxx = 0, maxy = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x, i = p * 4;
      if (gone[p]) { d[i + 3] = 0; continue; }
      const edge = (x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (y > 0 && gone[p - w]) || (y < h - 1 && gone[p + w]);
      if (edge) d[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (dist(i) - T * 0.4) / (T * 1.6))));
      if (d[i + 3] > 20) {
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    }
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    tmp.getContext('2d').putImageData(id, 0, 0);
    const cw = maxx - minx + 1, ch = maxy - miny + 1;
    const out = document.createElement('canvas'); out.width = cw; out.height = ch;
    out.getContext('2d').drawImage(tmp, minx, miny, cw, ch, 0, 0, cw, ch);
    return out;
  }

  Promise.all([load('assets/banners/b1.webp'), load('assets/banners/b2.webp')]).then(([a, b]) => {
    const items = {
      jam:    cut(a, [60, 380, 340, 900]),
      honey:  cut(a, [340, 380, 563, 900]),
      milk:   cut(a, [563, 0, 800, 900]),
      yogurt: cut(a, [800, 470, 1300, 900]),
      hib:    cut(b, [250, 0, 561, 900]),
      lemon:  cut(b, [561, 0, 787, 900]),
      orange: cut(b, [787, 0, 1100, 900]),
    };
    Object.entries(items).forEach(([name, cv]) => {
      cv.className = 'it it--' + name;
      cv.setAttribute('role', 'img');
      stage.appendChild(cv);
    });
    stage.classList.add('is-ready');
  }).catch(err => console.warn('hero scene fallback:', err));
})();
