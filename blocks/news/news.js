/**
 * news — build trust, 4-card grid (index-C-cinematic .section[news]).
 * Schema: section head (h2 + "all" link) + 4 repeat cards {tag, date, headline+href, clinic}.
 * Section head authored as default content, reabsorbed into .section-head.
 *
 * Per-card row fields (flat siblings): meta <p> ("Tag · Date"), headline <h3><a>,
 * clinic <p>. Reconstructive (#52); segments on the per-card h3.
 */

function absorbHead(block) {
  const wrapper = block.closest('.block-content')?.previousElementSibling;
  if (wrapper && (wrapper.classList.contains('default-content') || wrapper.classList.contains('default-content-wrapper'))) {
    const head = document.createElement('div');
    head.className = 'section-head';
    [...wrapper.children].forEach((c) => {
      if (c.matches('p') && c.querySelector('a')) c.querySelector('a').classList.add('link-more');
      head.append(c.matches('p') && c.querySelector('a') ? c.querySelector('a') : c);
    });
    wrapper.remove();
    return head;
  }
  return null;
}

function segmentCards(block) {
  const rows = [...block.children];
  const cardRows = rows.filter((r) => r.querySelector('h3, h4'));
  if (cardRows.length >= 2) {
    return cardRows.map((r) => [...(r.firstElementChild ? r.firstElementChild.children : r.children)]);
  }
  const cell = block.querySelector(':scope > div > div') || block;
  const flat = [...cell.children];
  const groups = [];
  let cur = null;
  flat.forEach((el) => {
    if (el.matches('h3, h4') || el.querySelector('h3, h4')) {
      // start new card; buffer preceding meta line
      if (!cur || cur.hasHeading) { cur = { nodes: [], hasHeading: false }; groups.push(cur); }
    }
    if (!cur) { cur = { nodes: [], hasHeading: false }; groups.push(cur); }
    cur.nodes.push(el);
    if (el.matches('h3, h4') || el.querySelector('h3, h4')) cur.hasHeading = true;
  });
  return groups.map((g) => g.nodes);
}

export default async function decorate(block) {
  const head = absorbHead(block);
  const groups = segmentCards(block);

  const grid = document.createElement('div');
  grid.className = 'news-grid';

  groups.forEach((nodes) => {
    const card = document.createElement('article');
    card.className = 'news-card';
    nodes.forEach((n) => {
      if (n.matches('h3, h4') || n.querySelector('h3, h4')) {
        const src = n.matches('h3, h4') ? n : n.querySelector('h3, h4');
        const h3 = document.createElement('h3');
        const a = src.querySelector('a');
        if (a) { a.classList.add('stretched'); h3.append(a); }
        else h3.append(...src.childNodes);
        card.append(h3);
      } else if (n.matches('p') || n.textContent.trim()) {
        const raw = n.textContent.trim();
        // meta line "Tag · Date" → split into tag + date spans
        if (raw.includes('·') && !card.querySelector('.news-meta')) {
          const [tag, ...rest] = raw.split('·').map((s) => s.trim());
          const meta = document.createElement('div');
          meta.className = 'news-meta';
          const t = document.createElement('span'); t.className = 'news-tag'; t.textContent = tag;
          const d = document.createElement('span'); d.textContent = rest.join(' · ');
          meta.append(t, d);
          card.append(meta);
        } else {
          const c = document.createElement('span');
          c.className = 'news-clinic';
          c.textContent = raw;
          card.append(c);
        }
      }
    });
    grid.append(card);
  });

  const parts = [];
  if (head) parts.push(head);
  parts.push(grid);
  block.replaceChildren(...parts);
}
