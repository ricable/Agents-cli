/**
 * Product Detail view — full-screen panel with product info,
 * reviews, versions, install action.
 */

import { PRODUCT_TYPE_ICONS, PRODUCT_TYPE_COLORS, formatPrice, formatType, escapeHtml } from './marketplace.js';


export function initProductDetail(api, store, auth) {
  const panel = document.getElementById('productDetailPanel');
  const overlay = document.getElementById('productDetailOverlay');
  if (!panel) return {};

  let feedStream = null;

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
    feedStream?.stop();
    feedStream = null;
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

      <div class="detail-tabs" style="display:flex;gap:4px;padding:0 20px;border-bottom:1px solid var(--surface-border)">
        <button class="detail-tab active" data-tab="overview">Overview</button>
        <button class="detail-tab" data-tab="pricing">Pricing</button>
        <button class="detail-tab" data-tab="changelog">Changelog</button>
      </div>

      <div class="detail-body">
        <div class="detail-tab-content" id="detailTabOverview">
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

          <div class="detail-actions">
            <button class="btn btn-primary btn-lg ${installed ? 'shine' : ''}" id="detailInstallBtn" data-id="${escapeAttr(p.id)}">
              ${installed ? '\u2713 Installed' : 'Install'}
            </button>
            <button class="btn btn-secondary btn-lg" id="detailForgeBtn">
              Forge Similar
            </button>
          </div>

          <!-- Revenue split donut -->
          <div class="detail-section" id="detailRevenueSplit" style="${p.pricing?.model !== 'free' && p.pricing?.price ? '' : 'display:none'}">
            <h3>Revenue Split</h3>
            <svg viewBox="0 0 100 100" style="width:100px;display:block;margin:0 auto">
              <circle cx="50" cy="50" r="35" fill="none" stroke="var(--accent-green)" stroke-width="20" stroke-dasharray="175.9 43.98" stroke-dashoffset="0" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="var(--accent-blue)" stroke-width="20" stroke-dasharray="21.99 197.9" stroke-dashoffset="-175.9" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="var(--surface-border)" stroke-width="20" stroke-dasharray="21.99 197.9" stroke-dashoffset="-197.9" transform="rotate(-90 50 50)"/>
              <text x="50" y="54" text-anchor="middle" font-size="11" fill="var(--text-primary)">80%</text>
            </svg>
            <div style="display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:11px">
              <span style="color:var(--accent-green)">&#9632; Creator 80%</span>
              <span style="color:var(--accent-blue)">&#9632; Infra 10%</span>
              <span>&#9632; Platform 10%</span>
            </div>
          </div>

          <!-- Agent compat badges -->
          <div class="detail-section">
            <h3>Compatibility</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span class="badge-agent">Claude Sonnet 4.6</span>
              <span class="badge" style="background:var(--accent-blue)20;color:var(--accent-blue)">MCP v1.0</span>
              <span class="badge" style="background:var(--surface-color);border:1px solid var(--surface-border)">agents-cli</span>
            </div>
          </div>

          <!-- Deploy as MCP tool button -->
          <div class="detail-section">
            <button class="btn btn-secondary" id="deployMcpBtn">&#9889; Deploy as MCP Tool</button>
          </div>

          <!-- Live invocation feed -->
          <div class="detail-section">
            <h3>Live Invocations</h3>
            <div id="invocationFeed" style="height:120px;overflow-y:auto;background:var(--surface-color);border:1px solid var(--surface-border);border-radius:8px;padding:12px;font-size:12px;font-family:monospace">
              <p style="color:var(--text-muted)">Connecting to feed...</p>
            </div>
          </div>
        </div>

        <div class="detail-tab-content" id="detailTabPricing" style="display:none">
          <div style="padding:20px">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
              <!-- Free tier -->
              <div class="glass-card" style="padding:16px;text-align:center">
                <div style="font-weight:700;margin-bottom:8px">Free</div>
                <div style="font-size:24px;font-weight:800;color:var(--accent-green)">$0</div>
                <div style="font-size:11px;color:var(--text-muted);margin:8px 0">100 calls/mo</div>
                <button class="btn btn-secondary btn-sm">Select</button>
              </div>
              <!-- Metered tier -->
              <div class="glass-card" style="padding:16px;text-align:center;border-color:var(--accent-blue)40">
                <div style="font-weight:700;margin-bottom:8px">Metered</div>
                <div style="font-size:24px;font-weight:800;color:var(--accent-blue)" id="detailPerCall">$0.001<span style="font-size:12px">/call</span></div>
                <div style="font-size:11px;color:var(--text-muted);margin:8px 0">Pay as you go</div>
                <button class="btn btn-primary btn-sm">Select</button>
              </div>
              <!-- Monthly cap -->
              <div class="glass-card" style="padding:16px;text-align:center">
                <div style="font-weight:700;margin-bottom:8px">Monthly Cap</div>
                <div style="font-size:24px;font-weight:800;color:var(--accent-purple)">$9<span style="font-size:12px">/mo</span></div>
                <div style="font-size:11px;color:var(--text-muted);margin:8px 0">Unlimited calls</div>
                <button class="btn btn-secondary btn-sm">Select</button>
              </div>
              <!-- Enterprise -->
              <div class="glass-card" style="padding:16px;text-align:center">
                <div style="font-weight:700;margin-bottom:8px">Enterprise</div>
                <div style="font-size:24px;font-weight:800;color:var(--accent-orange)">Custom</div>
                <div style="font-size:11px;color:var(--text-muted);margin:8px 0">SLA + support</div>
                <button class="btn btn-secondary btn-sm">Contact</button>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-tab-content" id="detailTabChangelog" style="display:none">
          <div style="padding:20px">
            <div class="glass-card" style="padding:16px">
              <div style="font-weight:600;margin-bottom:4px">v${escapeHtml(version)} — Current</div>
              <div style="font-size:12px;color:var(--text-muted)">Latest release. Trigger score optimized, MCP v1.0 compatible.</div>
            </div>
          </div>
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

    panel.querySelector('#deployMcpBtn')?.addEventListener('click', () => {
      showToast('MCP deployment initiated — check your agents-cli MCP bridge');
    });

    panel.querySelectorAll('.detail-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        panel.querySelectorAll('.detail-tab-content').forEach(c => c.style.display = 'none');
        tab.classList.add('active');
        const content = panel.querySelector(`#detailTab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
        if (content) content.style.display = 'block';
      });
    });

    feedStream = simulateMockFeed();
  }

  // Close on overlay click
  overlay?.addEventListener('click', hide);

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('active')) hide();
  });

  return { show, hide };
}

function simulateMockFeed() {
  const feed = document.getElementById('invocationFeed');
  if (!feed) return;
  const agents = ['claude-3.5', 'gpt-4o', 'gemini-1.5', 'local-agent'];
  feed.innerHTML = '';
  let i = 0;
  const interval = setInterval(() => {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const ms = Math.floor(Math.random() * 800) + 100;
    const line = document.createElement('p');
    line.style.margin = '2px 0';
    line.style.color = 'var(--accent-green)';
    line.textContent = `[${new Date().toISOString().slice(11,19)}] ${agent} \u2192 ${ms}ms`;
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;
    if (++i > 100) clearInterval(interval);
  }, 2000 + Math.random() * 3000);
  return { stop: () => clearInterval(interval) };
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
