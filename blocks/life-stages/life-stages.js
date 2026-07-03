/**
 * life-stages — build trust, 3-card grid (index-C-cinematic .life-wrap).
 * Schema: section head (eyebrow + h2) + 3 repeat cards {chip, h3, body, link}.
 * Section head authored as default content, reabsorbed into .life-head.
 *
 * Card fields (per row): chip via leading <strong>, h3, body <p>, plain <a>
 * (rendered as .link-more text link, not a button). Reconstructive (#52).
 */

function absorbHead(block) {
  const wrapper = block.closest('.block-content')?.previousElementSibling;
  if (wrapper && (wrapper.classList.contains('default-content') || wrapper.classList.contains('default-content-wrapper'))) {
    const head = document.createElement('div');
    head.className = 'life-head';
    [...wrapper.children].forEach((c) => {
      if (c.matches('p') && !c.querySelector('a') && c === wrapper.firstElementChild) c.classList.add('eyebrow');
      head.append(c);
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
    if (el.matches('h3, h4') || el.querySelector('h3, h4')) { cur = []; groups.push(cur); }
    if (cur) cur.push(el);
    else { cur = [el]; groups.push(cur); } // leading chip before first heading
  });
  return groups.filter((g) => g.some((n) => n.matches('h3, h4') || n.querySelector('h3, h4')));
}

export default async function decorate(block) {
  block.closest('.section')?.classList.add('life-stages-section');
  const head = absorbHead(block);
  const groups = segmentCards(block);

  const grid = document.createElement('div');
  grid.className = 'life-grid';

  groups.forEach((nodes) => {
    const card = document.createElement('article');
    card.className = 'life-card';
    nodes.forEach((n) => {
      if (n.matches('h3, h4') || n.querySelector('h3, h4')) {
        const src = n.matches('h3, h4') ? n : n.querySelector('h3, h4');
        const h3 = document.createElement('h3');
        h3.append(...src.childNodes);
        card.append(h3);
      } else if (n.querySelector('strong') || n.matches('strong')) {
        const strong = n.matches('strong') ? n : n.querySelector('strong');
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = strong.textContent.trim();
        card.append(chip);
      } else if (n.matches('a') || n.querySelector('a')) {
        const a = n.matches('a') ? n : n.querySelector('a');
        a.classList.add('link-more');
        card.append(a);
      } else if (n.textContent.trim()) {
        const p = n.matches('p') ? n : document.createElement('p');
        if (!n.matches('p')) p.textContent = n.textContent.trim();
        card.append(p);
      }
    });
    grid.append(card);
  });

  const parts = [];
  if (head) parts.push(head);
  parts.push(grid);
  block.replaceChildren(...parts);
}
