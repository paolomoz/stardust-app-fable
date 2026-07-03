/**
 * hero — emotional hook, split-media (index-C-cinematic .hero).
 * Schema: eyebrow → h1 (page's single <h1>) → lede → CTA group | editorial <img>.
 * Template-slotted: query content (never hard row index, #42), slot into the
 * prototype's DOM. Parallax/scrim motion is dropped in EDS (runtime absent) —
 * static end-state is legible (#14).
 *
 * Authored shape (DA usually flattens to one cell of flat siblings):
 *   <img>  (editorial hero photo)
 *   <p eyebrow>  <h1>  <p lede>  <p btn-group>(primary + secondary link)
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

export default async function decorate(block) {
  const nodes = collectNodes(block);

  const media = nodes.find((n) => n.matches('picture, img') || n.querySelector('picture, img'));
  const heading = nodes.find((n) => n.matches('h1, h2, h3') || n.querySelector('h1, h2, h3'));
  const paras = nodes.filter((n) => n.matches('p') && n !== heading);
  const ctaP = paras.find((p) => p.querySelector('a'));
  const textParas = paras.filter((p) => !p.querySelector('a'));
  // eyebrow = the short line BEFORE the heading; lede = the sentence after (#51)
  const eyebrow = textParas[0];
  const lede = textParas[1] || (textParas.length === 1 ? null : textParas.find((p) => p !== eyebrow));

  const wrap = document.createElement('div');
  wrap.className = 'wrap';

  const copy = document.createElement('div');
  copy.className = 'hero-copy';
  if (eyebrow) { eyebrow.classList.add('eyebrow'); copy.append(eyebrow); }
  if (heading) {
    const inner = heading.matches('h1, h2, h3') ? heading : heading.querySelector('h1, h2, h3');
    const h1 = document.createElement('h1');
    h1.append(...inner.childNodes);
    copy.append(h1);
  }
  if (lede) { lede.classList.add('hero-lede'); copy.append(lede); }
  if (ctaP) { ctaP.classList.add('hero-actions'); copy.append(ctaP); }

  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'hero-media';
  if (media) {
    const pic = media.matches('picture, img') ? media : media.querySelector('picture, img');
    mediaWrap.append(pic);
  }

  wrap.append(copy, mediaWrap);
  block.replaceChildren(wrap);
}
