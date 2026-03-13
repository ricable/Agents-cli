/**
 * Dashboard module — user dashboard, usage meter, billing, installed products.
 */

import { PRODUCT_TYPE_ICONS, formatType, escapeHtml } from './marketplace.js';
import { showToast } from './product-detail.js';

const TIER_FEATURES = {
  free: { label: 'Free', color: 'var(--text-secondary)', maxTools: 5, dailyGens: 3, deep: false, ai: false },
  starter: { label: 'Starter', color: 'var(--accent-blue)', maxTools: 15, dailyGens: 20, deep: false, ai: false },
  pro: { label: 'Pro', color: 'var(--accent-purple)', maxTools: 50, dailyGens: 100, deep: true, ai: true },
  enterprise: { label: 'Enterprise', color: 'var(--accent-orange)', maxTools: 200, dailyGens: -1, deep: true, ai: true },
};

export function initDashboard(api, store, auth) {
  const pane = document.getElementById('pane-dashboard');
  if (!pane) return;

  async function render() {
    const user = store.get('user');
    const tier = store.get('tier') || 'free';
    const installed = store.get('installed') || [];
    const tierInfo = TIER_FEATURES[tier] || TIER_FEATURES.free;

    // Fetch usage if connected
    let usage = store.get('usage');
    if (user?.token && !usage) {
      try {
        const res = await api.usage();
        usage = res.data || res;
        store.set('usage', usage);
      } catch { /* server not available */ }
    }

    const used = usage?.used || 0;
    const dailyLimit = usage?.dailyLimit || tierInfo.dailyGens;
    const pct = dailyLimit > 0 ? Math.min(100, (used / dailyLimit) * 100) : 0;

    pane.innerHTML = `
      <div class="dashboard-grid">
        <!-- Overview Cards -->
        <div class="dash-card glass-card">
          <div class="dash-card-header">
            <span class="dash-card-icon">\u{1F3AF}</span>
            <span class="dash-card-title">Current Plan</span>
          </div>
          <div class="dash-tier-badge" style="color:${tierInfo.color}">
            ${tierInfo.label}
          </div>
          ${tier !== 'enterprise' ? `<button class="btn btn-secondary btn-sm upgrade-btn">Upgrade</button>` : ''}
        </div>

        <div class="dash-card glass-card">
          <div class="dash-card-header">
            <span class="dash-card-icon">\u{26A1}</span>
            <span class="dash-card-title">Usage Today</span>
          </div>
          <div class="usage-meter">
            <svg viewBox="0 0 100 100" class="usage-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-border)" stroke-width="6"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="${tierInfo.color}" stroke-width="6"
                stroke-dasharray="${2 * Math.PI * 42}" stroke-dashoffset="${2 * Math.PI * 42 * (1 - pct / 100)}"
                stroke-linecap="round" transform="rotate(-90 50 50)"/>
            </svg>
            <div class="usage-text">
              <span class="usage-count">${used}</span>
              <span class="usage-limit">/ ${dailyLimit < 0 ? '\u221E' : dailyLimit}</span>
            </div>
          </div>
        </div>

        <div class="dash-card glass-card">
          <div class="dash-card-header">
            <span class="dash-card-icon">\u{1F4E6}</span>
            <span class="dash-card-title">Installed</span>
          </div>
          <div class="dash-big-number">${installed.length}</div>
          <span class="text-sm" style="color:var(--text-muted)">products</span>
        </div>

        <div class="dash-card glass-card">
          <div class="dash-card-header">
            <span class="dash-card-icon">\u{1F50C}</span>
            <span class="dash-card-title">MCP Bridge</span>
          </div>
          <div class="dash-mcp-status" id="dashMcpStatus">Checking...</div>
        </div>
      </div>

      <!-- Installed Products -->
      <div class="dash-section">
        <h3>Installed Products</h3>
        ${installed.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">\u{1F4E6}</div>
            <p style="color:var(--text-secondary)">No products installed yet. Browse the marketplace to get started.</p>
          </div>
        ` : `
          <div class="installed-list">
            ${installed.map(id => renderInstalledItem(id, api, store)).join('')}
          </div>
        `}
      </div>

      <!-- Billing -->
      <div class="dash-section">
        <h3>Billing</h3>
        <div class="billing-info glass-card" style="padding:20px">
          <div class="billing-row">
            <span>Current Plan</span>
            <span style="color:${tierInfo.color};font-weight:600">${tierInfo.label}</span>
          </div>
          <div class="billing-row">
            <span>Tools Limit</span>
            <span>${tierInfo.maxTools}</span>
          </div>
          <div class="billing-row">
            <span>Daily Generations</span>
            <span>${tierInfo.dailyGens < 0 ? 'Unlimited' : tierInfo.dailyGens}</span>
          </div>
          <div class="billing-row">
            <span>Deep Analysis</span>
            <span>${tierInfo.deep ? '\u2705' : '\u274C'}</span>
          </div>
          <div class="billing-row">
            <span>AI Generation</span>
            <span>${tierInfo.ai ? '\u2705' : '\u274C'}</span>
          </div>
          <div class="billing-actions">
            <button class="btn btn-secondary btn-sm" id="manageBillingBtn">Manage Billing</button>
            <button class="btn btn-secondary btn-sm" id="viewInvoicesBtn">View Invoices</button>
          </div>
        </div>
      </div>

      <!-- Generation History -->
      <div class="dash-section">
        <h3>Recent Generations</h3>
        <div id="generationHistory" class="generation-list">
          <div class="empty-state">
            <div class="empty-icon">\u{1F527}</div>
            <p style="color:var(--text-secondary)">No generation jobs yet.</p>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    attachDashboardListeners(pane, api, store, auth);
    checkMcpStatus(api);
  }

  function attachDashboardListeners(pane, api, store, auth) {
    pane.querySelector('.upgrade-btn')?.addEventListener('click', () => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
    });

    pane.querySelector('#manageBillingBtn')?.addEventListener('click', async () => {
      try {
        const res = await api.billingPortal();
        const url = res?.data?.url;
        if (url) window.open(url, '_blank');
        else showToast('Billing portal not available in demo mode');
      } catch {
        showToast('Billing portal not available in demo mode');
      }
    });

    pane.querySelector('#viewInvoicesBtn')?.addEventListener('click', async () => {
      try {
        const res = await api.billingInvoices();
        const invoices = res?.data?.invoices || [];
        if (invoices.length === 0) {
          showToast('No invoices found');
        } else {
          showToast(`Found ${invoices.length} invoices`);
        }
      } catch {
        showToast('Invoices not available in demo mode');
      }
    });

    pane.querySelectorAll('.uninstall-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.uninstall(btn.dataset.id);
        render();
        showToast('Product uninstalled');
      });
    });
  }

  async function checkMcpStatus(api) {
    const el = document.getElementById('dashMcpStatus');
    if (!el) return;
    try {
      const res = await api.health();
      const data = res.data || res;
      el.innerHTML = `<span style="color:var(--accent-green)">\u25CF Connected</span>`;
    } catch {
      el.innerHTML = `<span style="color:var(--accent-pink)">\u25CF Offline</span>`;
    }
  }

  // Subscribe to auth changes
  store.subscribe('user', () => render());

  return { render };
}

function renderInstalledItem(id, api, store) {
  const product = api.getProduct(id);
  const name = product?.name || id;
  const icon = PRODUCT_TYPE_ICONS[product?.productType] || '\u{1F4E6}';
  const type = formatType(product?.productType || 'unknown');

  return `
    <div class="installed-item">
      <span class="installed-icon">${icon}</span>
      <div class="installed-info">
        <span class="installed-name">${escapeHtml(name)}</span>
        <span class="installed-type">${type}</span>
      </div>
      <button class="btn btn-ghost btn-sm uninstall-btn" data-id="${id}">Uninstall</button>
    </div>`;
}
