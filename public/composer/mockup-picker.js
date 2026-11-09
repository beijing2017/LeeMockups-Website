// Online catalog navigation only. The mockup loader and rendering code live in app-v8.js.
(() => {
  const skuPattern = /^LM-VM-[A-Z]{3}-\d{3}$/;
  const requestedSku = new URLSearchParams(location.search).get('sku');
  const activeSku = skuPattern.test(requestedSku || '') ? requestedSku : 'LM-VM-MUG-002';
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const catalogUrl = local ? '/catalog/products.json' : 'https://downloads.leemockups.com/catalog/products.json';
  const imageBase = 'https://downloads.leemockups.com';

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './mockup-picker.css?v=20261109d';
  document.head.appendChild(stylesheet);
  document.body.classList.add('generator-library');

  const header = document.querySelector('body > header');
  const nav = document.createElement('nav');
  nav.className = 'generator-nav';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = '<a href="/mockups/">Mockup Library</a><a class="active" href="/composer/" aria-current="page">Mockup Generator</a><a href="/#how">How it works</a><a href="/#features">Features</a><a href="/help/">Help</a>';
  header.appendChild(nav);

  const intro = document.createElement('div');
  intro.className = 'generator-intro';
  intro.innerHTML = '<p class="generator-kicker">CREATE IN YOUR BROWSER</p><h1>Mockup <span>Generator</span></h1><p>Choose a mockup, add your design, and create a product video.</p>';
  header.after(intro);
  const previewTitle = document.querySelector('.preview-head h1');
  if (previewTitle) {
    const h2 = document.createElement('h2');
    h2.innerHTML = previewTitle.innerHTML;
    previewTitle.replaceWith(h2);
  }

  const main = document.querySelector('body > main');
  const sidebar = document.createElement('section');
  sidebar.className = 'generator-picker';
  sidebar.setAttribute('aria-label', 'Choose a mockup');
  sidebar.innerHTML = '<div class="generator-picker-head"><div><p class="generator-kicker">MOCKUP LIBRARY</p><h2>Choose a mockup</h2></div><span id="generatorCount"></span></div><div class="generator-tabs" role="group" aria-label="Mockup categories"></div><div class="generator-picker-list" aria-live="polite"><p class="generator-picker-message">Loading mockups…</p></div>';
  main.prepend(sidebar);

  const tabs = sidebar.querySelector('.generator-tabs');
  const list = sidebar.querySelector('.generator-picker-list');
  const count = sidebar.querySelector('#generatorCount');
  const categories = new Map();
  let products = [];
  let selectedCategory = 'all';

  function categoryOf(product) {
    const code = String(product.category || '').toUpperCase();
    if (code === 'SHI' || code === 'TSH') return { slug: 'apparel', label: 'Apparel' };
    if (code === 'MUG') return { slug: 'mugs', label: 'Mugs' };
    if (code === 'FRA') return { slug: 'frames', label: 'Frames' };
    const label = String(product.categoryName || code || 'Other').trim();
    const slug = label.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
    return { slug, label };
  }

  function isFree(product) {
    return product.isFree === true || Number(product.priceUsd) === 0;
  }

  function destination(product) {
    const sku = product.sku;
    if (isFree(product)) return `/composer/?sku=${encodeURIComponent(sku)}`;
    try {
      const saved = sessionStorage.getItem(`leemockups-render:${sku}`);
      if (saved && new URL(saved).origin === 'https://downloads.leemockups.com') {
        return `/composer/?sku=${encodeURIComponent(sku)}`;
      }
    } catch (_) { /* An unavailable session store still allows the detail page. */ }
    return `/mockup/${encodeURIComponent(sku)}/`;
  }

  function renderTabs() {
    tabs.replaceChildren();
    for (const [slug, label] of [['all', 'All'], ...categories]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = slug === selectedCategory ? 'selected' : '';
      button.setAttribute('aria-pressed', String(slug === selectedCategory));
      button.addEventListener('click', () => {
        selectedCategory = slug;
        renderTabs();
        renderProducts();
      });
      tabs.appendChild(button);
    }
  }

  function renderProducts() {
    const visible = products.filter(product => selectedCategory === 'all' || categoryOf(product).slug === selectedCategory);
    count.textContent = `${visible.length} mockups`;
    list.replaceChildren();
    for (const product of visible) {
      const card = document.createElement('a');
      card.className = 'generator-product' + (product.sku === activeSku ? ' selected' : '');
      card.href = destination(product);
      if (product.sku === activeSku) card.setAttribute('aria-current', 'true');
      if (product.sku === activeSku) card.addEventListener('click', event => event.preventDefault());
      card.setAttribute('aria-label', `${product.name}. ${isFree(product) ? 'Free' : 'Paid'}.`);

      const thumb = document.createElement('span');
      thumb.className = 'generator-product-thumb';
      const img = document.createElement('img');
      img.src = new URL(String(product.thumbnailPath).replace(/^\//, ''), imageBase + '/').href;
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
      const badge = document.createElement('span');
      badge.className = 'generator-price-badge ' + (isFree(product) ? 'free' : 'paid');
      badge.textContent = isFree(product) ? 'FREE' : 'PAID';
      thumb.appendChild(badge);
      card.appendChild(thumb);

      const name = document.createElement('span');
      name.className = 'generator-product-name';
      name.textContent = product.name;
      card.appendChild(name);
      list.appendChild(card);
    }
  }

  fetch(catalogUrl, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    })
    .then(data => {
      products = (Array.isArray(data) ? data : data.products || [])
        .filter(product => skuPattern.test(product.sku) && product.thumbnailPath && product.name)
        .sort((a, b) => Number(isFree(b)) - Number(isFree(a)) || a.sku.localeCompare(b.sku));
      for (const product of products) {
        const category = categoryOf(product);
        categories.set(category.slug, category.label);
      }
      const priority = { apparel: 0, mugs: 1, frames: 2 };
      const sorted = [...categories].sort((a, b) => (priority[a[0]] ?? 3) - (priority[b[0]] ?? 3) || a[1].localeCompare(b[1]));
      categories.clear();
      for (const [slug, label] of sorted) categories.set(slug, label);
      renderTabs();
      renderProducts();
      const active = list.querySelector('.generator-product.selected');
      active?.scrollIntoView({ block: 'nearest' });
    })
    .catch(() => {
      count.textContent = '';
      list.innerHTML = '<p class="generator-picker-message">Mockups could not load. The current creator is still available.</p><a class="generator-picker-fallback" href="/mockups/">Browse Mockup Library →</a>';
    });
})();
