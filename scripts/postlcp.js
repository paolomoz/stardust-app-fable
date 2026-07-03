/*
 * postlcp.js — static header/footer fragment loader (AuthorKit runtime).
 *
 * PROJECT OVERRIDE for wheelercat-com: all content for this site lives under
 * the /wheelercat-com/ path prefix, so the header/footer fragments are served
 * from /wheelercat-com/fragments/{nav,footer}.html (NOT the runtime default
 * /fragments/…). The rest is the canonical loadStaticFragment behaviour,
 * including the mandatory #21 edit (set el.className = name BEFORE innerHTML
 * so the fragment's own root selector — header.header / footer.footer —
 * matches and its background/padding apply).
 */

const FRAGMENT_BASE = '/wheelercat-com/fragments';

function getMetadata(name) {
  const meta = document.head.querySelector(`meta[name="${name}"]`);
  return meta ? meta.content.trim().toLowerCase() : '';
}

async function loadStaticFragment(el, name, url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return;
    const html = await resp.text();
    el.className = name; // #21: so header.header / footer.footer match before paint
    el.innerHTML = html;
  } catch (e) {
    // fragment fetch failed — leave the reserved (styled) host element in place
  }
}

export default async function decorateStaticFragments() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const tasks = [];
  if (header && getMetadata('header') !== 'off') {
    tasks.push(loadStaticFragment(header, 'header', `${FRAGMENT_BASE}/nav.html`));
  }
  if (footer && getMetadata('footer') !== 'off') {
    tasks.push(loadStaticFragment(footer, 'footer', `${FRAGMENT_BASE}/footer.html`));
  }
  await Promise.all(tasks);
}
