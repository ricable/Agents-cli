/**
 * Admin panel bootstrap — auth gate, hash routing, API keys, settings, dashboard/economy init.
 */

import { AgentsApi } from './api.js';
import { AppStore } from './store.js';
import { AuthManager } from './auth.js';
import { initDashboard } from './dashboard.js';
import { initEconomy } from './economy.js';
import { escapeHtml, showToast } from './utils.js';

/** Escape a string for safe use inside HTML attribute values. */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const api = new AgentsApi();
  const store = new AppStore();
  const auth = new AuthManager(api, store);

  // ── Auth gate — redirect to main site if not logged in ──────

  await auth._ready;
  if (!auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  // ── Initialize sub-modules ──────────────────────────────────

  initDashboard(api, store, auth);
  initEconomy(api, store, auth);

  // ── Top bar user info ───────────────────────────────────────

  const updateTopBar = (user) => {
    const avatar = document.getElementById('adminAvatar');
    const nameEl = document.getElementById('adminUserName');
    if (user) {
      const name = user.name || user.email || 'User';
      if (avatar) avatar.textContent = name[0].toUpperCase();
      if (nameEl) nameEl.textContent = name;
    }
  };

  updateTopBar(auth.getUser());
  auth.onAuthChange((user) => {
    if (!user) {
      window.location.href = '/';
      return;
    }
    updateTopBar(user);
  });

  // ── Logout ──────────────────────────────────────────────────

  document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    auth.signOut();
  });

  // ── Server health ──────────────────────────────────────────

  const serverDot = document.getElementById('serverDot');
  const serverLabel = document.getElementById('serverLabel');
  const settingsStatus = document.getElementById('serverStatus');

  async function checkHealth() {
    try {
      const res = await fetch(api.baseUrl + '/api/health');
      const ok = res.ok;
      if (serverDot) serverDot.className = `status-dot ${ok ? 'online' : 'offline'}`;
      if (serverLabel) serverLabel.textContent = ok ? 'Online' : 'Offline';
      if (settingsStatus) {
        settingsStatus.textContent = ok ? 'Connected' : 'Offline';
        settingsStatus.style.color = ok ? 'var(--admin-green)' : 'var(--admin-orange)';
      }
    } catch {
      if (serverDot) serverDot.className = 'status-dot offline';
      if (serverLabel) serverLabel.textContent = 'Offline';
      if (settingsStatus) {
        settingsStatus.textContent = 'Offline (standalone mode)';
        settingsStatus.style.color = 'var(--admin-orange)';
      }
    }
  }

  checkHealth();

  // ── Hash-based pane routing ─────────────────────────────────

  const navItems = document.querySelectorAll('.admin-sidebar .nav-item');
  const panes = document.querySelectorAll('.admin-pane');

  function activatePane(paneId) {
    navItems.forEach(n => n.classList.toggle('active', n.dataset.pane === paneId));
    panes.forEach(p => p.classList.toggle('active', p.id === `pane-${paneId}`));
  }

  function routeFromHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    activatePane(hash);
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pane = item.dataset.pane;
      window.location.hash = pane;
      activatePane(pane);
    });
  });

  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();

  // ── API Keys (create / revoke) ──────────────────────────────

  const createKeyBtn = document.getElementById('createKeyBtn');
  const keysList = document.getElementById('agentKeysList');
  let agentKeys = store.get('agentKeys') || [];

  function renderKeys() {
    if (!keysList) return;
    if (agentKeys.length === 0) {
      keysList.innerHTML = `
        <div class="admin-empty">
          <div class="empty-icon">&#x1F511;</div>
          <p>No API keys yet. Create one to get started.</p>
        </div>`;
      return;
    }
    keysList.innerHTML = agentKeys.map(k => `
      <div class="key-card">
        <div>
          <div class="key-id">${escapeHtml(k.id)}</div>
          <div class="key-scopes">${escapeHtml((k.scopes || ['read', 'execute']).join(', '))}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="key-date">${new Date(k.createdAt).toLocaleDateString()}</span>
          <button class="admin-btn danger revoke-key-btn" data-key-id="${escapeAttr(k.id)}">Revoke</button>
        </div>
      </div>
    `).join('');

    keysList.querySelectorAll('.revoke-key-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const keyId = btn.dataset.keyId;
        try {
          await api.revokeAgentKey(keyId);
        } catch { /* offline */ }
        agentKeys = agentKeys.filter(k => k.id !== keyId);
        store.set('agentKeys', agentKeys);
        renderKeys();
        showToast('Key revoked');
      });
    });
  }

  if (createKeyBtn) {
    createKeyBtn.addEventListener('click', async () => {
      try {
        const res = await api.createAgentKey();
        const key = res?.data || res;
        if (key?.id) {
          agentKeys.push(key);
          store.set('agentKeys', agentKeys);
          renderKeys();
          showToast(`Key created: ${key.id}`);
        } else {
          throw new Error('no key');
        }
      } catch {
        // Mock key for offline mode
        const mockKey = {
          id: 'ak_' + Math.random().toString(36).slice(2, 14),
          secret: 'sk_' + Math.random().toString(36).slice(2, 30),
          scopes: ['read', 'execute'],
          createdAt: new Date().toISOString(),
        };
        agentKeys.push(mockKey);
        store.set('agentKeys', agentKeys);
        renderKeys();
        showToast(`Key created: ${mockKey.id}`);
      }
    });
  }

  renderKeys();

  // ── Settings ────────────────────────────────────────────────

  // Populate settings fields
  const user = store.get('user');
  const tier = store.get('tier') || 'free';
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileTier = document.getElementById('profileTier');
  const companionUrl = document.getElementById('companionUrl');
  const githubToken = document.getElementById('githubToken');

  if (profileName) profileName.value = user?.name || '';
  if (profileEmail) profileEmail.value = user?.email || '';
  if (profileTier) profileTier.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  if (companionUrl) companionUrl.value = localStorage.getItem('companion_url') || 'http://127.0.0.1:3100';
  if (githubToken) githubToken.value = localStorage.getItem('github_token') || '';

  // Save settings
  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    const name = profileName?.value?.trim();
    const ghToken = githubToken?.value?.trim();
    const serverUrl = companionUrl?.value?.trim();

    if (ghToken) localStorage.setItem('github_token', ghToken);
    if (serverUrl) localStorage.setItem('companion_url', serverUrl);
    if (name) {
      const currentUser = store.get('user') || {};
      store.set('user', { ...currentUser, name });
    }

    const btn = document.getElementById('saveSettingsBtn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Saved';
      btn.style.background = 'var(--admin-green)';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
      }, 1500);
    }

    showToast('Settings saved');
  });
});
