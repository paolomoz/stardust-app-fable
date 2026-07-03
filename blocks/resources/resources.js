/**
 * resources — 3-up image card grid.
 * Section schema: stardust/eds-schema/home.json#resources
 *
 * Section head authored as DEFAULT CONTENT (reabsorbed).
 * Card rows: one row per resource — <img> + <h3> title, wrapped in <a href>.
 * Foot CTA: a lone link row.
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
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = reabsorbHead(block, "res-head");

  const cardRows = [];
  let footCta = null;
  rows.forEach((row) => {
    const media = row.querySelector('picture, img');
    const link = row.querySelector('a');
    const hasHeading = row.querySelector('h1, h2, h3, h4');
    if (!media && !hasHeading && link && [...row.querySelectorAll('a')].length === 1
        && row.textContent.trim().length < 40) {
      footCta = link;
    } else if (media || hasHeading) {
      cardRows.push(row);
    }
  });

  const grid = document.createElement('div');
  grid.className = 'resources__grid';
  cardRows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const link = cell.querySelector('a') || row.querySelector('a');
    const media = cell.querySelector('picture, img');
    const h = cell.querySelector('h1, h2, h3, h4');

    const card = document.createElement('a');
    card.className = 'resource';
    card.setAttribute('data-tile-anim', '');
    card.href = link ? link.href : '#';
    const fig = document.createElement('span');
    fig.className = 'resource__fig';
    if (media) fig.append(media.closest('picture') || media);
    const body = document.createElement('span');
    body.className = 'resource__body';
    if (h) { const h3 = document.createElement('h3'); h3.append(...h.childNodes); body.append(h3); }
    const more = document.createElement('span');
    more.className = 'resource__more';
    more.textContent = (link && link.textContent.trim()) || 'Read More';
    body.append(more);
    card.append(fig, body);
    grid.append(card);
  });

  const wrap = document.createElement('div');
  wrap.className = 'resources__wrap';
  if (head) wrap.append(head);
  wrap.append(grid);
  if (footCta) {
    const foot = document.createElement('div');
    foot.className = 'resources__foot';
    footCta.classList.add('btn', 'btn-secondary');
    foot.append(footCta);
    wrap.append(foot);
  }
  block.replaceChildren(wrap);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cards = [...grid.querySelectorAll('[data-tile-anim]')];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = cards.indexOf(e.target);
        e.target.style.transitionDelay = `${(i % 8) * 100}ms`;
        e.target.classList.add('tile-in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.01 });
    cards.forEach((c) => obs.observe(c));
    window.addEventListener('load', () => {
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) c.classList.add('tile-in');
      });
    }, { once: true });
  }
}
