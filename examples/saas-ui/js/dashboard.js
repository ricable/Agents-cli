/**
 * Dashboard module — user dashboard, usage meter, billing, installed products.
 */

import { PRODUCT_TYPE_ICONS, formatType, escapeHtml, showToast } from './utils.js';

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

      <!-- Revenue Tracker -->
      <div class="dash-section">
        <h3>Revenue Tracker</h3>
        <div class="revenue-stats-row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Earned</div>
            <div class="revenue-big" id="dashEarned">$0.00</div>
          </div>
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Pending</div>
            <div class="revenue-big" id="dashPending">$0.00</div>
          </div>
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Next Payout</div>
            <div style="font-size:16px;font-weight:700" id="dashNextPayout">--</div>
          </div>
        </div>
        <!-- Revenue split bar -->
        <div class="glass-card" style="padding:16px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Revenue Split</div>
          <div style="display:flex;height:8px;border-radius:4px;overflow:hidden">
            <div style="width:80%;background:var(--accent-green);transition:width 1s ease"></div>
            <div style="width:10%;background:var(--accent-blue)"></div>
            <div style="width:10%;background:var(--surface-border)"></div>
          </div>
          <div style="display:flex;gap:16px;margin-top:8px;font-size:11px;color:var(--text-secondary)">
            <span style="color:var(--accent-green)">&#9632; Creator 80%</span>
            <span style="color:var(--accent-blue)">&#9632; Infra 10%</span>
            <span>&#9632; Platform 10%</span>
          </div>
        </div>
        <!-- Per-skill table with sparklines -->
        <div id="dashSkillsRevenue" style="margin-top:12px"></div>
      </div>

      <!-- Agent Wallet -->
      <div class="dash-section">
        <h3>Agent Wallet</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
          <div class="glass-card" style="padding:16px">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Active Agent</div>
            <div style="font-weight:600;font-size:14px" id="dashActiveAgent">None</div>
          </div>
          <div class="glass-card" style="padding:16px;text-align:center">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">Token Budget</div>
            <!-- SVG arc gauge -->
            <svg viewBox="0 0 80 50" style="width:80px">
              <path d="M 10 45 A 30 30 0 0 1 70 45" fill="none" stroke="var(--surface-border)" stroke-width="5" stroke-linecap="round"/>
              <path d="M 10 45 A 30 30 0 0 1 70 45" fill="none" stroke="var(--accent-blue)" stroke-width="5" stroke-linecap="round" stroke-dasharray="94" stroke-dashoffset="47" id="dashTokenArc"/>
              <text x="40" y="42" text-anchor="middle" font-size="11" fill="var(--text-primary)" id="dashTokenPct">50%</text>
            </svg>
          </div>
          <div class="glass-card" style="padding:16px">
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Spend Rate</div>
            <div style="font-weight:600;font-size:18px" id="dashSpendRate">$0.00/hr</div>
          </div>
        </div>
        <!-- 24h heatmap -->
        <div class="glass-card" style="padding:16px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">24h Invocation Heatmap</div>
          <div class="heatmap-grid" id="dashHeatmap">
            ${Array.from({length:24}, (_, i) => `<div class="heatmap-cell" title="Hour ${i}:00"></div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Agent API Keys -->
      <div class="dash-section">
        <h3>Agent API Keys</h3>
        <div class="glass-card" style="padding:16px">
          <div id="dashKeysList">
            <p style="color:var(--text-muted);font-size:13px">No API keys. <a href="#" id="dashGoToKeys" style="color:var(--accent-blue)">Manage keys</a></p>
          </div>
          <button class="btn btn-secondary btn-sm" style="margin-top:12px" id="dashCreateKeyBtn">+ Create Key</button>
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

    pane.querySelector('#dashGoToKeys')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/admin#keys';
    });

    pane.querySelector('#dashCreateKeyBtn')?.addEventListener('click', () => {
      window.location.href = '/admin#keys';
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
