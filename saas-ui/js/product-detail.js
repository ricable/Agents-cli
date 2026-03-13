/**
 * Product Detail view — full-screen panel with product info,
 * reviews, versions, install action.
 */

import { PRODUCT_TYPE_ICONS, PRODUCT_TYPE_COLORS, formatPrice, formatType, escapeHtml } from './marketplace.js';


export function initProductDetail(api, store, auth) {
  const panel = document.getElementById('productDetailPanel');
  const overlay = document.getElementById('productDetailOverlay');
  if (!panel) return {};

  function show(productId) {
    const product = api.getProduct(productId);
    if (!product) return;
    store.set('currentProduct', product);
    renderDetail(product);
    panel.classList.add('active');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    panel.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
    store.set('currentProduct', null);
  }

  function renderDetail(p) {
    const icon = PRODUCT_TYPE_ICONS[p.productType] || '\u{1F4E6}';
    const typeColor = PRODUCT_TYPE_COLORS[p.productType] || 'var(--text-secondary)';
    const price = formatPrice(p.pricing);
    const quality = p.quality || 0;
    const installed = store.isInstalled(p.id);
    const rating = p.stats?.rating || 0;
    const downloads = p.stats?.downloads || 0;
    const reviewCount = p.stats?.reviews || 0;
    const commands = p.commands || 0;
    const contents = p.contents || [];
    const version = p.version || '1.0.0';

    panel.innerHTML = `
      <div class="detail-header">
        <button class="detail-close" id="detailCloseBtn">&times;</button>
        <div class="detail-hero">
          <div class="detail-icon" style="border-color:${typeColor}40;background:${typeColor}15;font-size:32px">
            ${icon}
          </div>
          <div class="detail-title-group">
            <h2>${escapeHtml(p.name || p.id)}</h2>
            <div class="detail-meta-row">
              <span class="badge" style="background:${typeColor}20;color:${typeColor}">${formatType(p.productType)}</span>
              <span class="detail-version">v${escapeHtml(version)}</span>
              <span class="detail-author">by ${escapeHtml(p.app || p.author || 'community')}</span>
            </div>
          </div>
          <div class="detail-price-block">
            <span class="detail-price ${price === 'Free' ? 'free' : ''}">${price}</span>
            ${price !== 'Free' ? '<span class="detail-split">80% to creator</span>' : ''}
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-stats-row">
          <div class="detail-stat">
            <span class="detail-stat-value">${rating > 0 ? rating.toFixed(1) : '--'}</span>
            <span class="detail-stat-label">Rating</span>
          </div>
          <div class="detail-stat">
            <span class="detail-stat-value">${downloads > 0 ? formatNum(downloads) : '--'}</span>
            <span class="detail-stat-label">Downloads</span>
          </div>
          <div class="detail-stat">
            <span class="detail-stat-value">${commands}</span>
            <span class="detail-stat-label">Commands</span>
          </div>
          <div class="detail-stat">
            <span class="detail-stat-value">${reviewCount}</span>
            <span class="detail-stat-label">Reviews</span>
          </div>
          <div class="detail-stat">
            <span class="detail-stat-value" style="color:${qualityColor(quality)}">${quality.toFixed(1)}</span>
            <span class="detail-stat-label">Quality</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Description</h3>
          <p>${escapeHtml(p.description || 'No description available')}</p>
        </div>

        ${p.category ? `
        <div class="detail-section">
          <h3>Category</h3>
          <span class="badge" style="background:var(--surface-color);border:1px solid var(--surface-border)">${escapeHtml(p.category)}</span>
        </div>` : ''}

        ${contents.length > 0 ? `
        <div class="detail-section">
          <h3>Contents</h3>
          <div class="detail-contents-list">
            ${contents.map(f => `<div class="detail-file">\u{1F4C4} ${escapeHtml(f)}</div>`).join('')}
          </div>
        </div>` : ''}

        ${price !== 'Free' ? `
        <div class="detail-section">
          <h3>Revenue Split</h3>
          <div class="revenue-split-bar">
            <div class="split-creator" style="width:80%">
              <span>Creator 80%</span>
            </div>
            <div class="split-platform" style="width:20%">
              <span>20%</span>
            </div>
          </div>
        </div>` : ''}

        <div class="detail-actions">
          <button class="btn btn-primary btn-lg ${installed ? 'shine' : ''}" id="detailInstallBtn" data-id="${escapeAttr(p.id)}">
            ${installed ? '\u2713 Installed' : 'Install'}
          </button>
          <button class="btn btn-secondary btn-lg" id="detailForgeBtn">
            Forge Similar
          </button>
        </div>
      </div>`;

    // Event listeners
    panel.querySelector('#detailCloseBtn')?.addEventListener('click', hide);
    panel.querySelector('#detailInstallBtn')?.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (store.isInstalled(id)) {
        store.uninstall(id);
        e.target.textContent = 'Install';
        e.target.classList.remove('shine');
      } else {
        store.install(id);
        e.target.textContent = '\u2713 Installed';
        e.target.classList.add('shine');
        showToast(`${p.name || p.id} installed successfully`);
      }
    });
    panel.querySelector('#detailForgeBtn')?.addEventListener('click', () => {
      hide();
      // Switch to forge pane and pre-fill domain
      const forgeSidebar = document.querySelector('[data-pane="forge"]');
      if (forgeSidebar) forgeSidebar.click();
    });
  }

  // Close on overlay click
  overlay?.addEventListener('click', hide);

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('active')) hide();
  });

  return { show, hide };
}

function qualityColor(score) {
  if (score >= 8) return 'var(--accent-green)';
  if (score >= 5) return 'var(--accent-orange)';
  return 'var(--accent-pink)';
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export { showToast };
