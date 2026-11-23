// Removes the flat studio background from a product photo so the products can sit
// on a designed scene. Runs in the browser: flood-fills from the image border
// and feathers the edge. Usage: <img data-cutout data-tol="26" src="...">
function cutout(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, w, h), d = id.data;

  // background colour = average of the four corner patches
  let r = 0, g = 0, b = 0, n = 0;
  for (const [cx, cy] of [[0, 0], [w - 8, 0], [0, h - 8], [w - 8, h - 8]])
    for (let y = cy; y < cy + 8; y++) for (let x = cx; x < cx + 8; x++) {
      const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
  r /= n; g /= n; b /= n;
  const T = Number(img.dataset.tol || 26);
  const dist = i => Math.hypot(d[i] - r, d[i + 1] - g, d[i + 2] - b);

  const gone = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (gone[p] || dist(p * 4) > T) return;
    gone[p] = 1; stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  // transparent where removed; soft edge on pixels touching the removed area
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, i = p * 4;
    if (gone[p]) { d[i + 3] = 0; continue; }
    const touches = (x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (y > 0 && gone[p - w]) || (y < h - 1 && gone[p + w]);
    if (touches) {
      const k = Math.min(1, Math.max(0, (dist(i) - T * 0.4) / (T * 1.6)));
      d[i + 3] = Math.round(255 * k);
    }
  }
  ctx.putImageData(id, 0, 0);
  c.className = img.className;
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', img.alt || '');
  img.replaceWith(c);
}

document.querySelectorAll('img[data-cutout]').forEach(img => {
  const run = () => cutout(img);
  img.complete && img.naturalWidth ? run() : img.addEventListener('load', run, { once: true });
});
