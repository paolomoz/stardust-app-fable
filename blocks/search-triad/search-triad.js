/**
 * search-triad — primary-action routing plate (index-C-cinematic .plate).
 * Schema: section head (h2 + lede) + 3 repeat cards {h3, body, cta}.
 * The section head is authored as default content and reabsorbed into
 * .band-head. Icons are decorative inline SVG applied per card by index.
 *
 * Reconstructive decode: segment on the per-card heading (h3), tolerant of the
 * DA-flattened single-cell shape and the one-row-per-card shape (#52).
 */

const ICONS = [
  // search (Ärztesuche)
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>',
  // building (Kliniksuche)
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V7l7-4 7 4v14"/><path d="M17 21V11l4 2v8"/><line x1="10" y1="9" x2="10" y2="9.01"/><line x1="10" y1="13" x2="10" y2="13.01"/><line x1="10" y1="17" x2="10" y2="17.01"/></svg>',
  // heart-plus (Fachgebiete)
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>',
];

function absorbSectionHead(block) {
  const wrapper = block.closest('.block-content')?.previousElementSibling;
  if (wrapper && (wrapper.classList.contains('default-content') || wrapper.classList.contains('default-content-wrapper'))) {
    const head = document.createElement('div');
    head.className = 'band-head';
    head.append(...wrapper.childNodes);
    wrapper.remove();
    return head;
  }
  return null;
}

function segmentCards(block) {
  const rows = [...block.children];
  // one-row-per-card
  const cardRows = rows.filter((r) => r.querySelector('h3, h4'));
  if (cardRows.length >= 2) {
    return cardRows.map((r) => [...(r.firstElementChild ? r.firstElementChild.children : r.children)]);
  }
  // flattened single cell: segment on h3 boundaries
  const cell = block.querySelector(':scope > div > div') || block;
  const flat = [...cell.children];
  const groups = [];
  let cur = null;
  flat.forEach((el) => {
    const isHead = el.matches('h3, h4') || el.querySelector('h3, h4');
    if (isHead) { cur = []; groups.push(cur); }
    if (cur) cur.push(el);
  });
  return groups;
}

export default async function decorate(block) {
  block.closest('.section')?.classList.add('search-triad-section');
  const head = absorbSectionHead(block);
  // back-compat: leading no-card rows in the table are the head
  const groups = segmentCards(block);

  const triad = document.createElement('div');
  triad.className = 'triad';

  groups.forEach((nodes, i) => {
    const card = document.createElement('article');
    card.className = 'triad-card';

    const badge = document.createElement('span');
    badge.className = 'icon-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = ICONS[i % ICONS.length];
    card.append(badge);

    nodes.forEach((n) => {
      const el = n.firstElementChild && n.children.length === 1 && !n.matches('h3,h4,p,a') ? n.firstElementChild : n;
      if (el.matches('h3, h4') || el.querySelector('h3, h4')) {
        const src = el.matches('h3, h4') ? el : el.querySelector('h3, h4');
        const h3 = document.createElement('h3');
        h3.append(...src.childNodes);
        card.append(h3);
      } else if (el.matches('a') || (el.querySelector('a') && el.textContent.trim().length < 60)) {
        const a = el.matches('a') ? el : el.querySelector('a');
        a.classList.add('btn', i === 0 ? 'btn-primary' : 'btn-secondary');
        card.append(a);
      } else if (el.matches('p') || el.textContent.trim()) {
        const p = el.matches('p') ? el : document.createElement('p');
        if (!el.matches('p')) p.textContent = el.textContent.trim();
        card.append(p);
      }
    });
    triad.append(card);
  });

  const parts = [];
  if (head) parts.push(head);
  parts.push(triad);
  block.replaceChildren(...parts);
}
