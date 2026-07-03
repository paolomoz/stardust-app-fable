/**
 * partners — brand-name tile grid.
 * Section schema: stardust/eds-schema/home.json#partners
 *
 * Section head authored as DEFAULT CONTENT (reabsorbed).
 * Partner rows: one link per brand (or all links in one flattened cell).
 */

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
  paras.slice(1).forEach((p) => head.append(p));
  if (wrapped) dc.remove();
  return head;
}

export default function decorate(block) {
  const head = reabsorbHead(block, "partners-head");
  const links = [...block.querySelectorAll(':scope > div a')];

  const grid = document.createElement('div');
  grid.className = 'partners__grid';
  links.forEach((a) => {
    a.classList.add('partner');
    a.setAttribute('data-tile-anim', '');
    grid.append(a);
  });

  const wrap = document.createElement('div');
  wrap.className = 'partners__wrap';
  if (head) wrap.append(head);
  wrap.append(grid);
  block.replaceChildren(wrap);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const tiles = [...grid.querySelectorAll('[data-tile-anim]')];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = tiles.indexOf(e.target);
        e.target.style.transitionDelay = `${(i % 8) * 100}ms`;
        e.target.classList.add('tile-in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.01 });
    tiles.forEach((t) => obs.observe(t));
    window.addEventListener('load', () => {
      tiles.forEach((t) => {
        const r = t.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) t.classList.add('tile-in');
      });
    }, { once: true });
  }
}
