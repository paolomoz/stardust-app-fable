/**
 * services — service card grid.
 * Section schema: stardust/eds-schema/home.json#services
 *
 * Section head (eyebrow / heading / lede) is authored as DEFAULT CONTENT before
 * the block; this block reabsorbs it into `.section-head`. Back-compat: leading
 * non-card rows in the table are also read as the head.
 *
 * Card rows: one row per service. Cell holds <h3> title, a <p> description, and
 * a trailing link — the whole card is wrapped in the authored <a href>.
 */

/**
 * Reabsorb a section head authored as DEFAULT CONTENT before the block.
 * Robust to BOTH shapes: (a) real EDS — a `.default-content(-wrapper)` sibling
 * of the block's `.block-content`; (b) loose preceding siblings of the block
 * (the round-trip harness authors default content unwrapped). Builds the same
 * `.section-head` either way and removes the consumed nodes (0 leftover DC).
 */
function reabsorbHead(block, headingId) {
  const bc = block.closest('.block-content') || block;
  let sources = [];
  const dc = bc.previousElementSibling;
  if (dc && dc.matches?.('.default-content, .default-content-wrapper')) {
    sources = [...dc.children];
  } else {
    // loose preceding siblings of the block (harness shape)
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
  if (dc && dc.matches?.('.default-content, .default-content-wrapper')) dc.remove();
  return head;
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = reabsorbHead(block, 'services-head');

  // separate the foot CTA row (a lone link, no heading) from card rows
  const cardRows = [];
  let footCta = null;
  rows.forEach((row) => {
    const hasHeading = row.querySelector('h1, h2, h3, h4');
    const link = row.querySelector('a');
    if (!hasHeading && link && [...row.querySelectorAll('a')].length === 1
        && !row.querySelector('picture, img') && row.textContent.trim().length < 40) {
      footCta = link;
    } else if (hasHeading || (link && row.querySelector('picture, img, p'))) {
      cardRows.push(row);
    }
  });

  const grid = document.createElement('div');
  grid.className = 'services__grid';

  cardRows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const h = cell.querySelector('h1, h2, h3, h4');
    const allLinks = [...cell.querySelectorAll('a')];
    // action link = a link whose text is NOT the heading (the "Learn More" CTA);
    // href for the whole card comes from the action link (else the first link).
    const actionLink = allLinks.find((a) => !a.contains(h) && (!h || a.textContent.trim() !== h.textContent.trim()))
      || allLinks[allLinks.length - 1] || allLinks[0];
    const desc = [...cell.querySelectorAll('p')].find((p) => !p.querySelector('a'));
    const goText = (actionLink && actionLink.textContent.trim()) || 'Learn More';

    const card = document.createElement('a');
    card.className = 'service';
    card.setAttribute('data-tile-anim', '');
    card.href = actionLink ? actionLink.href : '#';
    const body = document.createElement('span');
    body.className = 'service__body';
    // whitespace text nodes between children keep the anchor's concatenated
    // textContent word-separated (matches the prototype's source-formatted DOM).
    if (h) { const h3 = document.createElement('h3'); h3.append(...h.childNodes); body.append(h3, ' '); }
    if (desc) { const p = document.createElement('p'); p.append(...desc.childNodes); body.append(p, ' '); }
    const go = document.createElement('span');
    go.className = 'service__go';
    go.textContent = goText;
    body.append(go);
    card.append(body);
    grid.append(card);
  });

  const wrap = document.createElement('div');
  wrap.className = 'services__wrap';
  if (head) wrap.append(head);
  wrap.append(grid);
  if (footCta) {
    const foot = document.createElement('div');
    foot.className = 'services__foot';
    footCta.classList.add('btn', 'btn-secondary');
    foot.append(footCta);
    wrap.append(foot);
  }

  block.replaceChildren(wrap);

  // tile-cascade reveal (IO-driven; reduced-motion neutralized by CSS)
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
    // safety net: reveal any already-in-viewport tile
    window.addEventListener('load', () => {
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) c.classList.add('tile-in');
      });
    }, { once: true });
  }
}
