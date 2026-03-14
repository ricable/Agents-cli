/**
 * Marketplace module — product grid, search, filters, dynamic cards.
 * Renders products from catalog data into the Discover pane.
 */

import { PRODUCT_TYPE_ICONS, PRODUCT_TYPE_COLORS, formatType, escapeHtml, showToast } from './utils.js';

// ── Tier access model ───────────────────────────────────────────────

const TIER_LIMITS = { free: 3, starter: 50, pro: 500, enterprise: Infinity };
const TIER_RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 };
const ONESHOT_PRICES = { starter: 4.99, pro: 9.99 };

function getRequiredTier(product) {
  const q = product.quality || 0;
  const t = product.productType;
  if (t === 'agent-team') return 'enterprise';
  if (t === 'agent-def' || q >= 9) return 'pro';
  if (t === 'workflow') return 'starter';
  if (t === 'plugin' || t === 'hook-bundle' || q >= 7) return 'starter';
  return 'free';
}

function userHasAccess(userTier, requiredTier) {
  return (TIER_RANK[userTier] || 0) >= (TIER_RANK[requiredTier] || 0);
}

const QUALITY_COLOR = (score) => {
  if (score >= 8) return 'var(--accent-green)';
  if (score >= 5) return 'var(--accent-orange)';
  return 'var(--accent-pink)';
};

let debounceTimer = null;
let bulkMode = false;
const bulkSelected = new Set();

export function initMarketplace(api, store, showProductDetail, auth) {
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

    const userTier = store.get('tier') || 'free';
    grid.innerHTML = results.map(p => renderCard(p, { userTier })).join('');
    attachCardListeners(grid, showProductDetail, store, auth);
    updateInstallCounter(store);
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
  store.subscribe('tier', () => renderProducts());
  store.subscribe('monthlyInstalls', () => updateInstallCounter(store));

  // Re-render when registries inject agent-defs / generated-skills
  window.addEventListener('catalog-updated', () => renderProducts());

  // ── Initial load ────────────────────────────────────────────────

  loadAndRender();

  return { renderProducts, loadAndRender };
}

// ── Workflow mini pipeline ──────────────────────────────────────────

function renderWorkflowMiniPipeline(product) {
  if (product.productType !== 'workflow' || !product.workflowSteps?.length) return '';
  const maxVisible = 4;
  const steps = product.workflowSteps;
  const visible = steps.slice(0, maxVisible);
  const overflow = steps.length > maxVisible ? `<span class="wf-more">+${steps.length - maxVisible}</span>` : '';
  return `<div class="wf-mini-pipeline">
    ${visible.map((s, i) =>
      `<span class="wf-step">${escapeHtml(s.name)}</span>${i < visible.length - 1 ? '<span class="wf-arrow">\u2192</span>' : ''}`
    ).join('')}${overflow}
  </div>`;
}

// ── Card renderer ───────────────────────────────────────────────────

function renderCard(product, opts = {}) {
  const { userTier = 'free' } = opts;
  const icon = PRODUCT_TYPE_ICONS[product.productType] || '\u{1F4E6}';
  const typeColor = PRODUCT_TYPE_COLORS[product.productType] || 'var(--text-secondary)';
  const quality = product.quality || 0;
  const qColor = QUALITY_COLOR(quality);
  const rating = product.stats?.rating || 0;
  const downloads = product.stats?.downloads || 0;
  const commands = product.commands || 0;

  const requiredTier = getRequiredTier(product);
  const hasAccess = userHasAccess(userTier, requiredTier);
  const tierBadgeClass = `tier-badge-${requiredTier === 'free' ? 'free' : requiredTier}`;
  const tierLabel = requiredTier === 'free' ? 'FREE' : requiredTier === 'starter' && userHasAccess(userTier, 'starter') ? 'Included' : requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  const lockOverlay = !hasAccess ? `
      <div class="tier-lock-overlay">
        <div class="tier-lock-content">
          <span class="tier-lock-icon">\u{1F512}</span>
          <span class="tier-lock-label">Requires ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</span>
          <div class="tier-lock-actions">
            <a href="#pricing" class="btn btn-primary btn-sm">Upgrade</a>
            ${ONESHOT_PRICES[requiredTier] ? `<button class="btn btn-ghost btn-sm oneshot-buy-btn" data-id="${escapeAttr(product.id)}" data-tier="${requiredTier}">Buy $${ONESHOT_PRICES[requiredTier]}</button>` : ''}
          </div>
        </div>
      </div>` : '';

  return `
    <div class="plugin-card glass-card${!hasAccess ? ' tier-locked' : ''}" data-product-id="${escapeAttr(product.id)}">
      <div class="plugin-header">
        <div class="plugin-icon" style="border-color:${typeColor}30;background:${typeColor}10">
          ${icon}
        </div>
        <div class="plugin-title">
          <h4>${escapeHtml(product.name || product.id)}</h4>
          <span class="plugin-author">${escapeHtml(product.app || product.author || 'community')}</span>
        </div>
        <span class="tier-badge ${tierBadgeClass}">${tierLabel}</span>
      </div>
      <p class="plugin-desc">${escapeHtml(truncate(product.description || 'No description', 120))}</p>
      ${renderWorkflowMiniPipeline(product)}
      <div class="plugin-footer">
        <div class="plugin-meta">
          <span class="badge" style="background:${typeColor}20;color:${typeColor}">${formatType(product.productType)}</span>
          <span class="quality-badge" style="color:${qColor}" title="Quality score">${quality.toFixed(1)}</span>
          ${commands > 0 ? `<span class="meta-item" title="Commands">${commands} cmds</span>` : ''}
          ${rating > 0 ? `<span class="meta-item">${renderStars(rating)}</span>` : ''}
          ${downloads > 0 ? `<span class="meta-item">${formatNum(downloads)} dl</span>` : ''}
          ${product.workflowSteps ? `<span class="meta-item">${product.workflowSteps.length} steps</span>` : ''}
          ${product.estimatedDuration ? `<span class="meta-item">~${escapeHtml(product.estimatedDuration)}</span>` : ''}
          ${isAgentNative(product) ? '<span class="badge-agent">\u{1F916} Agent</span>' : ''}
          ${product.pricing?.perCall ? `<span class="cost-badge">$${product.pricing.perCall}/call</span>` : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-ghost btn-sm try-card-btn" data-id="${escapeAttr(product.id)}">&#x25B6; Try</button>
          <button class="btn btn-secondary btn-sm install-card-btn" data-id="${escapeAttr(product.id)}">
            View
          </button>
        </div>
      </div>
      ${lockOverlay}
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

function attachCardListeners(grid, showProductDetail, store, auth) {
  grid.querySelectorAll('.plugin-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.install-card-btn')) {
        const id = e.target.dataset.id;
        showProductDetail(id);
        return;
      }
      if (e.target.closest('.try-card-btn')) return;
      if (e.target.closest('.oneshot-buy-btn')) return;
      if (e.target.closest('.tier-lock-actions a')) return;
      const id = card.dataset.productId;
      if (id) showProductDetail(id);
    });
  });

  grid.querySelectorAll('.try-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const userTier = store.get('tier') || 'free';
      const limit = TIER_LIMITS[userTier] || 3;
      const used = store.getMonthlyInstallCount();

      if (used >= limit) {
        showToast(`Monthly install limit reached (${limit}). Upgrade for more.`, 'error');
        return;
      }

      store.incrementInstallCount();

      const forgeSidebar = document.querySelector('[data-pane="forge"]');
      if (forgeSidebar) forgeSidebar.click();
      const toolInput = document.getElementById('forgeToolInput');
      if (toolInput) {
        toolInput.value = id;
        toolInput.dispatchEvent(new Event('blur'));
      }
    });
  });

  grid.querySelectorAll('.oneshot-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tier = btn.dataset.tier;
      const price = ONESHOT_PRICES[tier];
      showToast(`One-shot purchase ($${price}) — coming soon!`);
    });
  });
}

function updateInstallCounter(store) {
  const banner = document.getElementById('tierUpsellBanner');
  if (!banner) return;
  const userTier = store.get('tier') || 'free';
  const limit = TIER_LIMITS[userTier] || 3;
  const used = store.getMonthlyInstallCount();
  const counterEl = banner.querySelector('.upsell-counter');
  if (counterEl) {
    counterEl.textContent = `${used} / ${limit} installs used this month`;
    const pct = Math.min((used / limit) * 100, 100);
    const bar = banner.querySelector('.upsell-progress-fill');
    if (bar) bar.style.width = pct + '%';
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatPrice(pricing) {
  if (!pricing || pricing.model === 'free') return 'Free';
  const price = pricing.price ?? pricing.basePrice ?? 0;
  if (!price || price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
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

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isAgentNative(product) {
  return product.productType === 'agent-def' ||
         product.productType === 'agent-team' ||
         product.tags?.includes('agent-native') ||
         product.agentNative === true;
}

export { PRODUCT_TYPE_ICONS, PRODUCT_TYPE_COLORS, formatType, escapeHtml, formatPrice, isAgentNative, getRequiredTier, userHasAccess, TIER_LIMITS };
