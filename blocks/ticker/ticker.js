/**
 * ticker — live operational-state header (live-systems register signature).
 * Section schema: stardust/eds-schema/home.json#live-ticker
 *
 * Authoring (reconstructive-simple): one row per stat, each cell a short line
 * leading with the figure in <strong> (survives DA), e.g.
 *   <strong>3,100</strong> Rental units ready
 * The block reads the badge label from the FIRST cell if it has no digits and
 * the section head default-content, else uses a default "Live Yard" badge.
 * Builds a marquee track (duplicated for a seamless -50% loop).
 */

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const items = [];
  let badge = 'Live Yard';

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const txt = cell.textContent.trim();
    if (!txt) return;
    // A badge row is a short label with no digits (optional).
    if (!/\d/.test(txt) && items.length === 0 && rows.length > 1) {
      badge = txt;
      return;
    }
    const strong = cell.querySelector('strong, b');
    let figure = '';
    let label = txt;
    if (strong) {
      figure = strong.textContent.trim();
      label = txt.replace(figure, '').trim();
    } else {
      const m = txt.match(/^([\d,/]+(?:\+|\/7)?)\s+(.*)$/);
      if (m) { [, figure, label] = m; }
    }
    items.push({ figure, label });
  });

  const itemHTML = (it) => `<span class="ticker__item">${it.figure ? `<b>${it.figure}</b> ` : ''}${it.label}</span>`;
  const track = items.map(itemHTML).join('')
    + items.map((it) => `<span class="ticker__item" aria-hidden="true">${it.figure ? `<b>${it.figure}</b> ` : ''}${it.label}</span>`).join('');

  const wrap = document.createElement('div');
  wrap.className = 'ticker__inner';
  wrap.innerHTML = `
    <span class="ticker__badge"><span class="pulse pulse--live pulse--green"></span>${badge}</span>
    <div class="ticker__viewport">
      <div class="ticker__track" aria-hidden="false">${track}</div>
    </div>`;
  block.replaceChildren(wrap);
  block.setAttribute('aria-label', 'Live operational status');
}
