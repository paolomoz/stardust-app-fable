export default function decorate(block) {
  const rows = [...block.children];

  const tablist = document.createElement('div');
  tablist.className = 'tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Explore the system');

  const indicator = document.createElement('span');
  indicator.className = 'tabs__indicator';
  indicator.setAttribute('aria-hidden', 'true');
  tablist.appendChild(indicator);

  const panelWrap = document.createElement('div');
  panelWrap.className = 'panels';

  const tabs = [];
  const panels = [];

  rows.forEach((row, i) => {
    const label = (row.children[0]?.textContent || `Tab ${i + 1}`).trim();
    const content = row.children[1];

    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.setAttribute('role', 'tab');
    tab.type = 'button';
    tab.textContent = label;
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.id = `explore-tab-${i}`;
    tablist.appendChild(tab);
    tabs.push(tab);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.setAttribute('data-active', i === 0 ? 'true' : 'false');
    // content cell has two inner divs: [text, photo]
    const inner = [...(content?.children || [])];
    inner.forEach((el, j) => {
      if (j === 1) el.classList.add('panel-photo');
      // mark the facts paragraph (contains multiple <strong>)
      panel.appendChild(el);
    });
    if (inner[0]) {
      inner[0].querySelectorAll('p').forEach((p) => {
        if (p.querySelectorAll('strong').length >= 2) p.classList.add('facts');
      });
    }
    panelWrap.appendChild(panel);
    panels.push(panel);

    tab.setAttribute('aria-controls', panel.id || (panel.id = `explore-panel-${i}`));
  });

  block.textContent = '';
  block.appendChild(tablist);
  block.appendChild(panelWrap);

  function moveIndicator(tab) {
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft - 6}px)`;
  }

  function selectTab(tab) {
    const idx = tabs.indexOf(tab);
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      panels[i].setAttribute('data-active', i === idx ? 'true' : 'false');
    });
    moveIndicator(tab);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      let ni = null;
      if (e.key === 'ArrowRight') ni = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') ni = (i - 1 + tabs.length) % tabs.length;
      if (ni !== null) { e.preventDefault(); tabs[ni].focus(); selectTab(tabs[ni]); }
    });
  });

  requestAnimationFrame(() => moveIndicator(tabs[0]));
  window.addEventListener('resize', () => {
    const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (active) moveIndicator(active);
  }, { passive: true });
}
