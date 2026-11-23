// Hero scene: cuts the store's product photos out of their backgrounds so they can be
// arranged side by side on the wooden table. Runs in the browser; if anything fails,
// the original group photo stays visible as a fallback.
(() => {
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;

  const load = src => new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const trim = (c) => { // crop a canvas to its visible pixels
    const w = c.width, h = c.height, d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const o = canvas(x1 - x0 + 1, y1 - y0 + 1);
    o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  };

  // Product on a flat light background: flood-fill the background away from the border.
  // `box` (optional, coords for a 1024px-wide image) also clips everything outside a rounded rectangle
  // (removes the soft floor shadow around jars).
  function flood(img, tol = 34, box = null, radius = 0) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = canvas(w, h), ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    r /= n; g /= n; b /= n;
    const dist = i => Math.hypot(d[i] - r, d[i + 1] - g, d[i + 2] - b);
    const gone = new Uint8Array(w * h), st = [];
    const push = (x, y) => { const p = y * w + x; if (gone[p] || dist(p * 4) > tol) return; gone[p] = 1; st.push(p); };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (st.length) {
      const p = st.pop(), x = p % w, y = (p / w) | 0;
      if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x, i = p * 4;
      if (gone[p]) { d[i + 3] = 0; continue; }
      const edge = (x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (y > 0 && gone[p - w]) || (y < h - 1 && gone[p + w]);
      if (edge) d[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (dist(i) - tol * 0.4) / (tol * 1.6))));
    }
    ctx.putImageData(id, 0, 0);
    if (!box) return trim(c);
    const s = w / 1024, [x0, y0, x1, y1] = box, out = canvas(w, h), octx = out.getContext('2d');
    octx.beginPath(); octx.roundRect(x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s, radius * s); octx.clip();
    octx.drawImage(c, 0, 0);
    return trim(out);
  }

  // Product inside a photographed scene: cut along a hand-drawn outline (coords for a 1024px image).
  function poly(img, pts) {
    const s = img.naturalWidth / 1024, c = canvas(img.naturalWidth, img.naturalHeight), ctx = c.getContext('2d');
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
    ctx.closePath(); ctx.clip();
    ctx.drawImage(img, 0, 0);
    return trim(c);
  }

  // Flat pack on a plain background: crop a rectangle (coords for a 1024px-wide image).
  function rect(img, [x0, y0, x1, y1], radius = 5) {
    const s = img.naturalWidth / 1024, w = (x1 - x0) * s, h = (y1 - y0) * s;
    const c = canvas(Math.round(w), Math.round(h)), ctx = c.getContext('2d');
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, radius * s); ctx.clip();
    ctx.drawImage(img, x0 * s, y0 * s, w, h, 0, 0, w, h);
    return c;
  }

  // outline of the almond-drink bottle (left side; the right side is mirrored around x = 367)
  const half = [[287, 146], [287, 192], [300, 198], [300, 240], [283, 268], [266, 300], [253, 340], [244, 385], [238, 420], [235, 500], [235, 840], [240, 866], [255, 878], [300, 882]];
  const bottle = [...half, ...half.slice().reverse().map(([x, y]) => [734 - x, y])];

  const P = 'assets/hero/';
  Promise.all(['coconut.png', 'honey-creamy.png', 'cranberry.png', 'almond.webp', 'honey-wild.png', 'chocolate.png'].map(f => load(P + f)))
    .then(([coconut, creamy, cran, almond, wild, choc]) => {
      const items = [
        ['coconut', flood(coconut, 62)],
        ['honey1', flood(creamy, 34, [282, 146, 726, 884], 60)],
        ['cran', flood(cran)],
        ['almond', poly(almond, bottle)],
        ['honey2', flood(wild, 34, [300, 128, 712, 876], 56)],
        ['bar', rect(choc, [259, 152, 491, 614])],
        ['choc', rect(choc, [532, 152, 766, 614])],
      ];
      items.forEach(([name, cv]) => {
        const wrap = document.createElement('div');
        wrap.className = 'it it--' + name;
        cv.setAttribute('role', 'img');
        wrap.appendChild(cv);
        stage.appendChild(wrap);
      });
      stage.classList.add('is-ready');
    }).catch(err => console.warn('hero scene fallback:', err));
})();
