/**
 * proof — dark live stat grid (12 tiles; some carry an availability bar).
 * Section schema: stardust/eds-schema/home.json#proof-stats
 *
 * Section head (eyebrow / heading / lede) authored as DEFAULT CONTENT; the block
 * reabsorbs it and appends a live meta line. Optional meta line = a leading
 * head row whose text has no digits and mentions "live" — else a default.
 *
 * Stat rows: one row per stat. Cell = <strong>NUM</strong> Label, with an
 * optional trailing <code>NN%</code> = availability-bar fill (#90: only stats
 * 3/9/11 carried a bar in the proto).
 */

function fmt(n) { return Number(n).toLocaleString('en-US'); }

function reabsorbHead(block, headingId) {
  const bc = block.closest('.block-content') || block;
  let sources = [];
  const dc = bc.previousElementSibling;
  const wrapped = dc && dc.matches?.('.default-content, .default-content-wrapper');
  if (wrapped) {
    sources = [...dc.children];
  } else {
    const acc = [];
    let el = block.previousElementSibling;
    while (el) { acc.unshift(el); el = el.previousElementSibling; }
    sources = acc;
  }
  if (!sources.length) return null;
  const head = document.createElement('div');
  head.className = 'section-head';
  const paras = sources.filter((n) => n.tagName === 'P');
  const h = sources.find((n) => /^H[1-6]$/.test(n.tagName));
  if (paras[0]) { paras[0].className = 'eyebrow'; head.append(paras[0]); }
  if (h) { const h2 = document.createElement('h2'); h2.id = h.id || headingId; h2.append(...h.childNodes); head.append(h2); h.remove(); }
  // lede paragraph(s); a short "…live…" line becomes the live meta strip
  paras.slice(1).forEach((p) => {
    if (/\blive\b/i.test(p.textContent) && p.textContent.length < 80) {
      const meta = document.createElement('div');
      meta.className = 'proof__meta';
      meta.innerHTML = `<span class="pulse pulse--green"></span> ${p.textContent.trim()}`;
      head.append(meta);
    } else {
      head.append(p);
    }
  });
  if (wrapped) dc.remove();
  return head;
}

export default function decorate(block) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = reabsorbHead(block, 'proof-head');
  block.classList.add('live-sweep');

  const grid = document.createElement('div');
  grid.className = 'proof__grid';

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const txt = cell.textContent.trim();
    if (!txt || !/\d/.test(txt)) return;
    const strong = cell.querySelector('strong, b');
    const code = cell.querySelector('code');
    const fill = code ? parseInt(code.textContent, 10) : null;
    let figure = '';
    let label = txt;
    if (strong) { figure = strong.textContent.trim(); label = label.replace(figure, ''); }
    if (code) label = label.replace(code.textContent, '');
    label = label.trim();
    const num = figure.replace(/[^\d]/g, '') || label.match(/^[\d,]+/)?.[0].replace(/,/g, '') || '0';
    if (!figure) label = txt.replace(/^[\d,]+\s*/, '').replace(code ? code.textContent : '', '').trim();

    const stat = document.createElement('div');
    stat.className = 'stat';
    stat.setAttribute('data-tile-anim', '');
    stat.innerHTML = `<div class="num" data-countup="${num}">0</div><span class="lbl">${label}</span>${
      fill != null ? `<span class="stat__bar" style="--fill-target:${fill}%"><i data-fill="${fill}"></i></span>` : ''}`;
    grid.append(stat);
  });

  const wrap = document.createElement('div');
  wrap.className = 'proof__wrap';
  if (head) wrap.append(head);
  wrap.append(grid);
  block.replaceChildren(wrap);

  // count-up + fill + tile-cascade
  if (prefersReduced) {
    block.querySelectorAll('[data-countup]').forEach((el) => { el.textContent = fmt(el.dataset.countup); });
    block.querySelectorAll('[data-fill]').forEach((el) => { el.style.width = `${el.dataset.fill}%`; });
    block.querySelectorAll('[data-tile-anim]').forEach((el) => el.classList.add('tile-in'));
    return;
  }
  const easeOut3 = (t) => 1 - (1 - t) ** 3;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const seen = new WeakSet();
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || seen.has(e.target)) return;
      seen.add(e.target);
      const target = +e.target.dataset.countup;
      const duration = target > 20 ? 1400 : target > 5 ? 900 : 600;
      const start = performance.now();
      const step = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        e.target.textContent = fmt(Math.round(easeOut3(t) * target));
        if (t < 1) requestAnimationFrame(step); else e.target.textContent = fmt(target);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  block.querySelectorAll('[data-countup]').forEach((el) => countObs.observe(el));

  const fillObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || e.target.dataset.filled === '1') return;
      e.target.dataset.filled = '1';
      setTimeout(() => { e.target.style.width = `${+e.target.dataset.fill}%`; }, 120);
    });
  }, { threshold: 0.4 });
  block.querySelectorAll('[data-fill]').forEach((el) => fillObs.observe(el));

  const tiles = [...grid.querySelectorAll('[data-tile-anim]')];
  const tileObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = tiles.indexOf(e.target);
      e.target.style.transitionDelay = `${(i % 8) * 100}ms`;
      e.target.classList.add('tile-in');
      tileObs.unobserve(e.target);
    });
  }, { threshold: 0.01 });
  tiles.forEach((t) => tileObs.observe(t));
  window.addEventListener('load', () => {
    tiles.forEach((t) => {
      const r = t.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) t.classList.add('tile-in');
    });
  }, { once: true });

  // shared refresh sweep interval
  if (!window.__wcSweep) {
    window.__wcSweep = true;
    setInterval(() => {
      document.querySelectorAll('.live-sweep').forEach((el) => {
        el.classList.add('sweep');
        setTimeout(() => el.classList.remove('sweep'), 1700);
      });
    }, 5400);
  }
}
