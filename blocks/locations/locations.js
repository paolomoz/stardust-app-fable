/**
 * locations — split media + live location panel (template-slotted).
 * Section schema: stardust/eds-schema/home.json#locations
 *
 * Section head authored as DEFAULT CONTENT (reabsorbed).
 * Block rows (queried by content, not index):
 *   - media row      : <img> + a badge caption (leading <strong> or <code>)
 *   - big-number row : "18." — a lone number cell (becomes the display figure)
 *   - loc rows        : one row per open location — <strong>Name</strong> Status
 *                       (a row whose text ends "Open now" / short status)
 *   - address row    : an <address> or a row with a maps link + tel link
 *   - CTA row        : the link-bearing p (primary <strong>, secondary <em>)
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
  const head = reabsorbHead(block, "loc-head");

  let img = null;
  let badge = '';
  let bigNum = '';
  let bigKicker = '';
  const locRows = [];
  let addr = null;
  let ctaP = null;

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const media = cell.querySelector('picture, img');
    const link = cell.querySelector('a');
    const address = cell.querySelector('address');
    const txt = cell.textContent.trim();
    if (media) {
      img = media.matches('picture, img') ? media : media;
      const cap = cell.querySelector('strong, code');
      if (cap) badge = cap.textContent.trim();
      else badge = txt.replace(img.getAttribute?.('alt') || '', '').trim();
      return;
    }
    if (address) { addr = address; return; }
    if (cell.querySelectorAll('a').length >= 2 || (link && /^tel:|maps|contact/i.test(link.href))) { ctaP = cell; return; }
    if (link && [...cell.querySelectorAll('a')].length === 1 && /find|locat|contact/i.test(txt)) { ctaP = cell; return; }
    // big number: a short cell that is just a number/"18."
    if (!bigNum && /^\d+[.\s]*$/.test(txt) && txt.length < 6) { bigNum = txt.replace(/[^\d]/g, ''); return; }
    // a kicker line right after the big number
    if (bigNum && !bigKicker && !/\bopen\b/i.test(txt) && txt.length < 60 && !link && !/\d{2,}/.test(txt)) { bigKicker = txt; return; }
    // location row: has a status-ish tail
    if (/\bopen\b|now|closed/i.test(txt) && txt.length < 60) {
      const strong = cell.querySelector('strong, b');
      const name = strong ? strong.textContent.trim() : txt.replace(/open now|open|closed.*/i, '').trim();
      const state = txt.replace(name, '').trim() || 'Open now';
      locRows.push({ name, state });
    }
  });

  // ---- build
  const grid = document.createElement('div');
  grid.className = 'locations__grid';

  const mapDiv = document.createElement('div');
  mapDiv.className = 'locations__map';
  if (img) mapDiv.append(img.closest('picture') || img);
  if (badge) {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = badge;
    mapDiv.append(b);
  }

  const panel = document.createElement('div');
  panel.className = 'locations__panel';
  if (bigNum) {
    const big = document.createElement('p');
    big.className = 'big';
    big.innerHTML = `${bigNum}<span>.</span>`;
    panel.append(big);
  }
  if (bigKicker) {
    const k = document.createElement('p');
    k.className = 'kicker';
    k.textContent = bigKicker;
    panel.append(k);
  }
  if (locRows.length) {
    const ul = document.createElement('ul');
    ul.className = 'loc-live';
    ul.setAttribute('aria-label', 'Live location status');
    locRows.forEach((l) => {
      const li = document.createElement('li');
      li.className = 'loc-row';
      li.innerHTML = `<span class="pulse pulse--green"></span><span class="loc-name">${l.name}</span><span class="loc-state">${l.state}</span>`;
      ul.append(li);
    });
    panel.append(ul);
  }
  if (addr) { addr.className = 'locations__addr'; panel.append(addr); }
  if (ctaP) {
    ctaP.className = 'locations__cta';
    const links = [...ctaP.querySelectorAll('a')];
    links.forEach((a, i) => a.classList.add('btn', i === 0 ? 'btn-primary' : 'btn-secondary'));
    panel.append(ctaP);
  }

  grid.append(mapDiv, panel);

  const wrap = document.createElement('div');
  wrap.className = 'locations__wrap';
  if (head) wrap.append(head);
  wrap.append(grid);
  block.replaceChildren(wrap);
}
