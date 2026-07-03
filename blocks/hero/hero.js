/**
 * hero — full-bleed image hero + live operational strip (template-slotted).
 * Section schema: stardust/eds-schema/home.json#hero
 *
 * Authoring rows:
 *   1. <picture>/<img>  background image (editorial)
 *   2. eyebrow           short link-free line (before the heading)
 *   3. <h1>              the page's single <h1> (accent word in <em>)
 *   4. sub paragraph     link-free sentence
 *   5. CTAs              one <p> of links; primary in <strong>, secondary in <em>
 *   6. strip head        a short line (becomes "The Yard, Live") — optional
 *   7..N metric rows     <strong>3,100</strong> Rental Units Ready <code>86%</code>
 *                        (the trailing <code>NN%</code> = availability-bar fill)
 *
 * Owns: Lenis smooth-scroll boot (live-systems register signature),
 * count-up + bar-fill for its own live-strip.
 */

function fmt(n) { return Number(n).toLocaleString('en-US'); }

export default function decorate(block) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pic = block.querySelector('picture, img');
  const heading = block.querySelector('h1, h2, h3');
  const links = [...block.querySelectorAll('a')];

  // Walk the block's rows in AUTHORED ORDER, classifying head text cells.
  // eyebrow = the short link-free text cell BEFORE the heading (canonical lead
  // order: eyebrow → heading → lede); sub = the sentence-length cell AFTER it.
  const rowCells = [...block.querySelectorAll(':scope > div')].map((row) => row.querySelector(':scope > div') || row);
  let eyebrow = null;
  let sub = null;
  let seenHeading = false;
  rowCells.forEach((cell) => {
    if (cell.querySelector('a, picture, img, code, strong, b')) return; // CTA / media / metric cells
    if (cell.querySelector('h1, h2, h3') || (heading && cell.contains(heading))) { seenHeading = true; return; }
    const t = cell.textContent.trim();
    if (!t) return;
    if (!seenHeading && !eyebrow && t.length < 60 && !/\bthe yard\b/i.test(t)) eyebrow = cell;
    else if (seenHeading && !sub && t.length >= 40) sub = cell;
  });

  // Collect metric rows: a metric cell leads with a figure in <strong>/<code>
  // or a leading number, then a label. (Eyebrows like "…Since 1957" have a
  // trailing digit but no leading figure — excluded.)
  const metricRows = [...block.querySelectorAll(':scope > div')].filter((row) => {
    if (row.querySelector('a, picture, img, h1, h2, h3')) return false;
    const cell = row.querySelector(':scope > div') || row;
    const t = cell.textContent.trim();
    if (t.length >= 60) return false;
    const strong = cell.querySelector('strong, b, code');
    if (strong && /\d/.test(strong.textContent)) return true;
    return /^[\d,]+(?:\+|\/7)?\s+\D/.test(t);
  });

  // strip head = a short link-free/digit-free text cell that is NOT eyebrow/sub
  // (e.g. "The Yard, Live"). Falls back to a default.
  let stripHead = 'The Yard, Live';
  const headCandidate = rowCells.find((cell) => cell !== eyebrow && cell !== sub
    && !cell.querySelector('a, picture, img, h1, h2, h3, strong, b, code')
    && cell.textContent.trim() && !/\d/.test(cell.textContent) && cell.textContent.trim().length < 40);
  if (headCandidate) stripHead = headCandidate.textContent.trim();

  // ---- build media
  const media = document.createElement('div');
  media.className = 'hero__media';
  if (pic) media.append(pic.closest('picture') || pic);

  // ---- build inner
  const inner = document.createElement('div');
  inner.className = 'hero__inner';
  if (eyebrow) {
    const p = document.createElement('p');
    p.className = 'eyebrow';
    p.append(...eyebrow.childNodes);
    inner.append(p);
  }
  if (heading) {
    const h1 = document.createElement('h1');
    const src = heading.querySelector('h1, h2, h3') || heading;
    h1.append(...src.childNodes);
    inner.append(h1);
  }
  if (sub) {
    const p = document.createElement('p');
    p.className = 'hero__sub';
    p.append(...sub.childNodes);
    inner.append(p);
  }
  // CTA cell: the cell/paragraph that holds the links (DA may deliver it as a
  // bare <div> cell, not a <p>). Find the nearest container holding all links.
  let ctaHost = block.querySelector('.btn-group') || block.querySelector('p:has(a)');
  if (!ctaHost) {
    const firstLink = links[0];
    if (firstLink) ctaHost = firstLink.closest(':scope > div > div') || firstLink.parentElement;
  }
  if (ctaHost) {
    const group = document.createElement('p');
    group.className = 'btn-group';
    links.forEach((a) => group.append(a));
    inner.append(group);
  }

  // ---- build live strip
  const aside = document.createElement('aside');
  aside.className = 'live-strip live-sweep';
  aside.setAttribute('aria-label', 'Live operational readiness');
  let gridHTML = '';
  metricRows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const strong = cell.querySelector('strong, b');
    const code = cell.querySelector('code');
    const fill = code ? parseInt(code.textContent, 10) : null;
    let figure = '';
    let label = cell.textContent.trim();
    if (strong) { figure = strong.textContent.trim(); label = label.replace(figure, ''); }
    if (code) label = label.replace(code.textContent, '');
    label = label.trim();
    const numRaw = figure.replace(/[^\d]/g, '');
    gridHTML += `<div class="live-strip__metric">
      <div class="num" data-countup="${numRaw}">0</div>
      <span class="lbl">${label}</span>
      ${fill != null ? `<span class="live-strip__bar" style="--fill-target:${fill}%"><i data-fill="${fill}"></i></span>` : ''}
    </div>`;
  });
  aside.innerHTML = `
    <div class="live-strip__head">
      <span class="pulse pulse--green"></span> ${stripHead}
      <span class="status">Updated just now</span>
    </div>
    <div class="live-strip__grid">${gridHTML}</div>`;

  const wrap = document.createElement('div');
  wrap.className = 'hero__wrap';
  wrap.append(inner, aside);

  block.replaceChildren(media, wrap);

  // ---- motion: count-up + bar fill (IO-driven) ----
  if (prefersReduced) {
    block.querySelectorAll('[data-countup]').forEach((el) => { el.textContent = fmt(el.dataset.countup); });
    block.querySelectorAll('[data-fill]').forEach((el) => { el.style.width = `${el.dataset.fill}%`; });
  } else {
    const easeOut3 = (t) => 1 - (1 - t) ** 3;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const countSeen = new WeakSet();
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || countSeen.has(e.target)) return;
        countSeen.add(e.target);
        const target = +e.target.dataset.countup;
        const duration = target > 20 ? 1400 : target > 5 ? 900 : 600;
        const start = performance.now();
        const step = (now) => {
          const t = clamp((now - start) / duration, 0, 1);
          e.target.textContent = fmt(Math.round(easeOut3(t) * target));
          if (t < 1) requestAnimationFrame(step); else e.target.textContent = fmt(target);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    block.querySelectorAll('[data-countup]').forEach((el) => countObs.observe(el));

    const fillObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || e.target.dataset.filled === '1') return;
        e.target.dataset.filled = '1';
        const pct = +e.target.dataset.fill;
        setTimeout(() => { e.target.style.width = `${pct}%`; }, 120);
      });
    }, { threshold: 0.4 });
    block.querySelectorAll('[data-fill]').forEach((el) => fillObs.observe(el));

    // refresh sweep — single shared interval across all .live-sweep on the page
    if (!window.__wcSweep) {
      window.__wcSweep = true;
      const sweepEls = () => document.querySelectorAll('.live-sweep');
      setInterval(() => {
        sweepEls().forEach((el) => {
          el.classList.add('sweep');
          setTimeout(() => el.classList.remove('sweep'), 1700);
        });
      }, 5400);
    }

    // Lenis smooth-scroll boot (live-systems register signature).
    // Vendored under /scripts/lenis.min.{js,css}; loaded lazily so it never
    // blocks LCP and never boots under reduced motion / no-JS.
    if (!window.__lenis) {
      const bootLenis = () => {
        if (window.__lenis || typeof window.Lenis !== 'function') return;
        const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
        window.__lenis = lenis;
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      };
      if (typeof window.Lenis === 'function') {
        bootLenis();
      } else if (!document.querySelector('script[data-lenis]')) {
        if (!document.querySelector('link[data-lenis]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/scripts/lenis.min.css';
          link.setAttribute('data-lenis', '');
          document.head.append(link);
        }
        const s = document.createElement('script');
        s.src = '/scripts/lenis.min.js';
        s.setAttribute('data-lenis', '');
        s.onload = bootLenis;
        document.head.append(s);
      }
    }
  }
}
