/**
 * blog-strip — build trust, contained prose band (index-C-cinematic .blog-strip).
 * Schema: prose column {eyebrow, h2, body} + outline CTA.
 * Template-slotted: query the prose parts + the link, rebuild the 2-col grid.
 * The CTA is authored <em><a> → decorated a.btn.btn-secondary (outline).
 */

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const kids = [...cell.children];
    if (kids.length) out.push(...kids);
    else if (cell.textContent.trim()) {
      const p = document.createElement('p'); p.textContent = cell.textContent.trim(); out.push(p);
    }
  });
  return out.length ? out : [...block.children];
}

export default async function decorate(block) {
  const nodes = collectNodes(block);
  const heading = nodes.find((n) => n.matches('h2, h3') || n.querySelector('h2, h3'));
  const linkNode = nodes.find((n) => n.matches('a') || n.querySelector('a'));
  const paras = nodes.filter((n) => n.matches('p') && n !== linkNode && !n.querySelector('a'));
  const eyebrow = paras[0];
  const body = paras[1] || paras.find((p) => p !== eyebrow);

  const prose = document.createElement('div');
  prose.className = 'blog-prose';
  if (eyebrow) { eyebrow.classList.add('eyebrow'); prose.append(eyebrow); }
  if (heading) {
    const src = heading.matches('h2, h3') ? heading : heading.querySelector('h2, h3');
    const h2 = document.createElement('h2');
    h2.append(...src.childNodes);
    prose.append(h2);
  }
  if (body) prose.append(body);

  block.replaceChildren(prose);

  if (linkNode) {
    const a = linkNode.matches('a') ? linkNode : linkNode.querySelector('a');
    a.classList.add('blog-cta');
    block.append(a);
  }
}
