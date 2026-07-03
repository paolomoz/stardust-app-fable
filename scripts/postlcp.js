/*
 * postlcp.js — AuthorKit post-LCP runtime (project override for hirslanden-ch).
 *
 * Injects the STATIC header/footer fragments after first paint. For this
 * project every content path lives under the /hirslanden-ch/ prefix, so the
 * fragments are served from /hirslanden-ch/fragments/{header,footer}.html on
 * the code origin (not the boilerplate root /fragments/).
 *
 * Edit (#21): set el.className = name BEFORE innerHTML so the fragment's own
 * root selectors (header.header / footer.footer) match and root box styles
 * (background/padding/border) apply.
 */

const FRAGMENT_BASE = '/hirslanden-ch/fragments';

function getMetadata(name) {
  const meta = document.head.querySelector(`meta[name="${name}"]`);
  return meta ? meta.content : '';
}

async function loadStaticFragment(el, name) {
  if (!el) return;
  // Per-page opt-out via metadata (header: off / footer: off).
  if (getMetadata(name) === 'off') { el.remove(); return; }
  try {
    const resp = await fetch(`${FRAGMENT_BASE}/${name}.html`);
    if (!resp.ok) return;
    const html = await resp.text();
    el.className = name;          // so header.header / footer.footer match
    el.innerHTML = html;
  } catch (e) {
    // fragment fetch is non-fatal; leave the reserved (empty) chrome element
  }
}

export default async function postLCP() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  await Promise.all([
    loadStaticFragment(header, 'header'),
    loadStaticFragment(footer, 'footer'),
  ]);
}
