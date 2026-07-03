/**
 * events — build trust, list ledger (index-C-cinematic .section--surface[events]).
 * Schema: section head (h2 + "all" link) + 4 repeat rows {date(d/m), title+href, location}.
 * Section head authored as default content, reabsorbed into .section-head.
 *
 * Per-row fields (flat siblings): date <p> ("03 · Jul"), title <h3><a>,
 * location <p>. The "Anmelden →" CTA is generated (fixed label). Reconstructive.
 */

function absorbHead(block) {
  const wrapper = block.closest('.block-content')?.previousElementSibling;
  if (wrapper && (wrapper.classList.contains('default-content') || wrapper.classList.contains('default-content-wrapper'))) {
    const head = document.createElement('div');
    head.className = 'section-head';
    [...wrapper.children].forEach((c) => {
      if (c.matches('p') && c.querySelector('a')) { const a = c.querySelector('a'); a.classList.add('link-more'); head.append(a); }
      else head.append(c);
    });
    wrapper.remove();
    return head;
  }
  return null;
}

function segmentRows(block) {
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
    const isHead = el.matches('h3, h4') || el.querySelector('h3, h4');
    // date line precedes its heading → buffer: open a group on the date line
    if (!cur) { cur = []; groups.push(cur); }
    cur.push(el);
    if (isHead) cur = null; // next node starts a fresh group (unless it's location, handled below)
  });
  // merge trailing location paragraphs into the previous group
  const merged = [];
  groups.forEach((g) => {
    if (g.length === 1 && !g[0].querySelector('h3, h4') && !g[0].matches('h3, h4') && merged.length
        && !/^\d/.test(g[0].textContent.trim())) {
      merged[merged.length - 1].push(g[0]);
    } else {
      merged.push(g);
    }
  });
  return merged;
}

export default async function decorate(block) {
  block.closest('.section')?.classList.add('events-section');
  const head = absorbHead(block);
  const groups = segmentRows(block);

  const list = document.createElement('div');
  list.className = 'events-list';

  groups.forEach((nodes) => {
    if (!nodes.some((n) => n.matches('h3, h4') || n.querySelector('h3, h4'))) return;
    const row = document.createElement('div');
    row.className = 'event-row';

    const info = document.createElement('div');
    info.className = 'event-info';

    nodes.forEach((n) => {
      const raw = n.textContent.trim();
      if (n.matches('h3, h4') || n.querySelector('h3, h4')) {
        const src = n.matches('h3, h4') ? n : n.querySelector('h3, h4');
        const h3 = document.createElement('h3');
        const a = src.querySelector('a');
        if (a) { a.classList.add('stretched'); h3.append(a); } else h3.append(...src.childNodes);
        info.append(h3);
      } else if (/^\d{1,2}\s*·/.test(raw) || (/^\d{1,2}$/.test(raw)) || !row.querySelector('.event-date')) {
        // date line "03 · Jul"
        const [d, m] = raw.split('·').map((s) => s.trim());
        if (d && m) {
          const date = document.createElement('div');
          date.className = 'event-date';
          const dd = document.createElement('span'); dd.className = 'd'; dd.textContent = d;
          const mm = document.createElement('span'); mm.className = 'm'; mm.textContent = m;
          date.append(dd, mm);
          row.append(date);
          return;
        }
        const loc = document.createElement('span'); loc.className = 'loc'; loc.textContent = raw; info.append(loc);
      } else {
        const loc = document.createElement('span'); loc.className = 'loc'; loc.textContent = raw; info.append(loc);
      }
    });

    row.append(info);
    const cta = document.createElement('span');
    cta.className = 'ev-cta';
    cta.textContent = 'Anmelden →';
    row.append(cta);
    list.append(row);
  });

  const parts = [];
  if (head) parts.push(head);
  parts.push(list);
  block.replaceChildren(...parts);
}
