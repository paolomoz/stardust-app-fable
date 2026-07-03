/**
 * quick — quick-actions link rail.
 * Section schema: stardust/eds-schema/home.json#quick-actions
 *
 * Authoring: a leading label cell (no link), then one row per link
 * (or all links flattened into one cell — both handled).
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

export default function decorate(block) {
  const nodes = collectNodes(block);
  const links = [];
  let label = 'Quick Links';

  nodes.forEach((n) => {
    if (n.matches && n.matches('a')) links.push(n);
    else {
      n.querySelectorAll?.('a').forEach((a) => links.push(a));
      if (!n.querySelector?.('a') && n.textContent.trim() && !links.length) {
        label = n.textContent.trim();
      }
    }
  });

  const wrap = document.createElement('div');
  wrap.className = 'quick__wrap';
  const lbl = document.createElement('span');
  lbl.className = 'quick__label';
  lbl.textContent = label;
  wrap.append(lbl);
  links.forEach((a) => wrap.append(a));

  block.replaceChildren(wrap);
  block.setAttribute('aria-label', 'Quick actions');
}
