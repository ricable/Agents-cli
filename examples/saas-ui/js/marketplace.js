/**
 * Marketplace module — product grid, search, filters, dynamic cards.
 * Renders products from catalog data into the Discover pane.
 */

const PRODUCT_TYPE_ICONS = {
  skill: '\u{1F4DC}',        // scroll
  plugin: '\u{1F9E9}',       // puzzle
  'hook-bundle': '\u{1F6E1}', // shield
  'agent-def': '\u{1F916}',  // robot
  'agent-team': '\u{1F465}', // people
  harness: '\u{1F4BB}',      // terminal
};

const PRODUCT_TYPE_COLORS = {
  skill: 'var(--accent-blue)',
  plugin: 'var(--accent-purple)',
  'hook-bundle': 'var(--accent-orange)',
  'agent-def': 'var(--accent-green)',
  'agent-team': 'var(--accent-pink)',
  harness: 'var(--text-secondary)',
};

const QUALITY_COLOR = (score) => {
  if (score >= 8) return 'var(--accent-green)';
  if (score >= 5) return 'var(--accent-orange)';
  return 'var(--accent-pink)';
};

let debounceTimer = null;
let bulkMode = false;
const bulkSelected = new Set();

export function initMarketplace(api, store, showProductDetail) {
  const grid = document.getElementById('productGrid');
  const searchInput = document.getElementById('marketplaceSearch');
  const resultCount = document.getElementById('resultCount');
  const filterTabs = document.querySelectorAll('.product-type-tab');
  const sortSelect = document.getElementById('sortSelect');
  const priceFilter = document.getElementById('priceFilter');

  if (!grid) return;

  // ── Load catalog ────────────────────────────────────────────────

  async function loadAndRender() {
    grid.innerHTML = renderSkeletons(6);
    try {
      await api.loadCatalog();
      store.set('catalog', api.catalog);
    } catch { /* use whatever we have */ }
    renderProducts();
  }

  // ── Render products ─────────────────────────────────────────────

  function renderProducts() {
    const filters = store.get('searchFilters');
    const query = store.get('searchQuery');
    let results = api.searchProducts(query, filters);

    // Special post-filter for agent-native tab
    if (filters.productType === 'agent-native') {
      results = results.filter(p => isAgentNative(p));
    }

    if (resultCount) {
      resultCount.textContent = `${results.length} product${results.length !== 1 ? 's' : ''}`;
    }

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">\u{1F50D}</div>
          <h3>No products found</h3>
          <p style="color:var(--text-secondary)">Try adjusting your search or filters</p>
        </div>`;
      return;
    }

    grid.innerHTML = results.map(p => renderCard(p)).join('');
    attachCardListeners(grid, showProductDetail, store);
  }

  // ── Search ──────────────────────────────────────────────────────

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        store.set('searchQuery', searchInput.value.trim());
        renderProducts();
      }, 300);
    });
  }

  // ── Filter tabs ─────────────────────────────────────────────────

  if (filterTabs.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        store.update('searchFilters', f => ({ ...f, productType: tab.dataset.type || 'all' }));
        renderProducts();
      });
    });
  }

  // ── Sort ────────────────────────────────────────────────────────

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      store.update('searchFilters', f => ({ ...f, sort: sortSelect.value }));
      renderProducts();
    });
  }

  // ── Price filter ────────────────────────────────────────────────

  if (priceFilter) {
    priceFilter.addEventListener('change', () => {
      store.update('searchFilters', f => ({ ...f, pricingModel: priceFilter.value }));
      renderProducts();
    });
  }

  // ── Bulk select ─────────────────────────────────────────────────

  const bulkToggle = document.getElementById('bulkToggle');
  const bulkInstallBtn = document.getElementById('bulkInstallBtn');
  const bulkCount = document.getElementById('bulkCount');

  if (bulkToggle) {
    bulkToggle.addEventListener('change', () => {
      bulkMode = bulkToggle.checked;
      bulkSelected.clear();
      if (bulkInstallBtn) bulkInstallBtn.style.display = bulkMode ? 'inline-flex' : 'none';
      if (bulkCount) bulkCount.textContent = '0';
      renderProducts();
    });
  }

  // ── Subscribe to store changes ──────────────────────────────────

  store.subscribe('catalog', () => renderProducts());
  store.subscribe('installed', () => renderProducts());

  // ── Initial load ────────────────────────────────────────────────

  loadAndRender();

  return { renderProducts, loadAndRender };
}

// ── Card renderer ───────────────────────────────────────────────────

function renderCard(product) {
  const icon = PRODUCT_TYPE_ICONS[product.productType] || '\u{1F4E6}';
  const typeColor = PRODUCT_TYPE_COLORS[product.productType] || 'var(--text-secondary)';
  const price = formatPrice(product.pricing);
  const quality = product.quality || 0;
  const qColor = QUALITY_COLOR(quality);
  const rating = product.stats?.rating || 0;
  const downloads = product.stats?.downloads || 0;
  const commands = product.commands || 0;

  return `
    <div class="plugin-card glass-card" data-product-id="${escapeAttr(product.id)}">
      <div class="plugin-header">
        <div class="plugin-icon" style="border-color:${typeColor}30;background:${typeColor}10">
          ${icon}
        </div>
        <div class="plugin-title">
          <h4>${escapeHtml(product.name || product.id)}</h4>
          <span class="plugin-author">${escapeHtml(product.app || product.author || 'community')}</span>
        </div>
        <span class="plugin-price ${price === 'Free' ? 'free' : ''}">${price}</span>
      </div>
      <p class="plugin-desc">${escapeHtml(truncate(product.description || 'No description', 120))}</p>
      <div class="plugin-footer">
        <div class="plugin-meta">
          <span class="badge" style="background:${typeColor}20;color:${typeColor}">${formatType(product.productType)}</span>
          <span class="quality-badge" style="color:${qColor}" title="Quality score">${quality.toFixed(1)}</span>
          ${commands > 0 ? `<span class="meta-item" title="Commands">${commands} cmds</span>` : ''}
          ${rating > 0 ? `<span class="meta-item">${renderStars(rating)}</span>` : ''}
          ${downloads > 0 ? `<span class="meta-item">${formatNum(downloads)} dl</span>` : ''}
          ${isAgentNative(product) ? '<span class="badge-agent">🤖 Agent</span>' : ''}
          ${product.pricing?.perCall ? `<span class="cost-badge">$${product.pricing.perCall}/call</span>` : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-ghost btn-sm try-card-btn" data-id="${escapeAttr(product.id)}">▶ Try</button>
          <button class="btn btn-secondary btn-sm install-card-btn" data-id="${escapeAttr(product.id)}">
            View
          </button>
        </div>
      </div>
    </div>`;
}

function renderSkeletons(count) {
  return Array.from({ length: count }, () => `
    <div class="plugin-card glass-card skeleton-card">
      <div class="skeleton-line" style="width:60%;height:20px;margin-bottom:12px"></div>
      <div class="skeleton-line" style="width:80%;height:14px;margin-bottom:8px"></div>
      <div class="skeleton-line" style="width:40%;height:14px"></div>
    </div>
  `).join('');
}

function attachCardListeners(grid, showProductDetail, store) {
  grid.querySelectorAll('.plugin-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger on button click
      if (e.target.closest('.install-card-btn')) {
        const id = e.target.dataset.id;
        showProductDetail(id);
        return;
      }
      if (e.target.closest('.try-card-btn')) return;
      const id = card.dataset.productId;
      if (id) showProductDetail(id);
    });
  });

  grid.querySelectorAll('.try-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      // Switch to forge pane with tool pre-filled
      const forgeSidebar = document.querySelector('[data-pane="forge"]');
      if (forgeSidebar) forgeSidebar.click();
      const toolInput = document.getElementById('forgeToolInput');
      if (toolInput) {
        toolInput.value = id;
        toolInput.dispatchEvent(new Event('blur'));
      }
    });
  });
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatPrice(pricing) {
  if (!pricing || pricing.model === 'free') return 'Free';
  const price = pricing.price ?? pricing.basePrice ?? 0;
  if (!price || price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}

function formatType(type) {
  if (!type) return 'Unknown';
  return type.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty);
}

function truncate(str, len) {
  if (str.length <= len) return str;
  return str.slice(0, len) + '\u2026';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isAgentNative(product) {
  return product.productType === 'agent-def' ||
         product.productType === 'agent-team' ||
         product.tags?.includes('agent-native') ||
         product.agentNative === true;
}

export { PRODUCT_TYPE_ICONS, PRODUCT_TYPE_COLORS, formatPrice, formatType, escapeHtml, isAgentNative };
