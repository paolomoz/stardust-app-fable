/**
 * cross-promo — place-led footprint pre-footer (index-C-cinematic .cross).
 * Schema: left column {eyebrow, 3 stats (num + label)} + right column {copy, 2 links}.
 *
 * Interactive (#28): block JS RUNS in EDS, so the prototype's count-up survives —
 * an IntersectionObserver drives each stat number from 0 to its target on first
 * view. prefers-reduced-motion → the number renders at its target immediately.
 *
 * Authoring: the whole block is one table with two side cells.
 *   left cell:  <p eyebrow>, then one <p> per stat "16 · Privatkliniken" (a
 *               trailing "+" on the number → the +plus glyph)
 *   right cell: <p copy>, then plain <a> links (rendered as pill cross-links)
 */

function buildStat(raw) {
  // "16 · Privatkliniken" or "300+ · medizinische Zentren…"
  const [numRaw, ...rest] = raw.split('·').map((s) => s.trim());
  const label = rest.join(' · ');
  const stat = document.createElement('div');
  stat.className = 'stat';
  const num = document.createElement('span');
  num.className = 'num';
  const plus = numRaw.includes('+');
  const target = parseInt(numRaw.replace(/[^\d]/g, ''), 10) || 0;
  const val = document.createElement('span');
  val.setAttribute('data-countup', String(target));
  val.textContent = String(target);
  num.append(val);
  if (plus) {
    const p = document.createElement('span');
    p.className = 'plus';
    p.textContent = '+';
    num.append(p);
  }
  const lbl = document.createElement('span');
  lbl.className = 'lbl';
  lbl.textContent = label;
  stat.append(num, lbl);
  return stat;
}

function runCountUps(block) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = [...block.querySelectorAll('[data-countup]')];
  if (reduced) { els.forEach((e) => { e.textContent = e.getAttribute('data-countup'); }); return; }
  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-countup'), 10);
    const dur = 1400;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - (1 - p) ** 3;
      el.textContent = String(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  els.forEach((e) => io.observe(e));
}

export default async function decorate(block) {
  block.closest('.section')?.classList.add('cross-promo-section');
  const cells = [...block.querySelectorAll(':scope > div > div')];
  // Fall back: if flattened to one cell, split by role below.
  let leftNodes = [];
  let rightNodes = [];
  if (cells.length >= 2) {
    leftNodes = [...cells[0].children];
    rightNodes = [...cells[1].children];
  } else {
    const flat = [...(cells[0] || block).children];
    // links + copy paragraph go right; eyebrow + stat lines go left
    flat.forEach((n) => {
      if (n.matches('a') || n.querySelector('a')) rightNodes.push(n);
      else if (n.textContent.includes('·')) leftNodes.push(n);
      else if (leftNodes.length && !rightNodes.length && n.textContent.trim().length > 40) rightNodes.push(n);
      else leftNodes.push(n);
    });
  }

  const left = document.createElement('div');
  const stats = document.createElement('div');
  stats.className = 'footprint-stats';
  leftNodes.forEach((n) => {
    const raw = n.textContent.trim();
    if (raw.includes('·') && /\d/.test(raw)) {
      stats.append(buildStat(raw));
    } else if (raw) {
      const p = document.createElement('p');
      p.className = 'eyebrow footprint-eyebrow';
      p.textContent = raw;
      left.append(p);
    }
  });
  left.append(stats);

  const right = document.createElement('div');
  const links = document.createElement('div');
  links.className = 'cross-links';
  rightNodes.forEach((n) => {
    if (n.matches('a') || n.querySelector('a')) {
      const a = n.matches('a') ? n : n.querySelector('a');
      links.append(a);
    } else if (n.textContent.trim()) {
      const p = document.createElement('p');
      p.className = 'footprint-copy';
      p.textContent = n.textContent.trim();
      right.append(p);
    }
  });
  right.append(links);

  block.replaceChildren(left, right);
  runCountUps(block);
}
