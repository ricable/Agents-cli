/**
 * Profile & Settings module — user profile page, API keys, connection config.
 */

export function initProfile(api, store) {
  // Open settings when avatar/profile icon clicked
  document.addEventListener('click', (e) => {
    const profileBtn = e.target.closest('.user-avatar, .user-profile-btn, #openSettingsBtn');
    if (profileBtn) {
      openSettingsModal(api, store);
    }
    // Close on backdrop
    const modal = document.getElementById('settingsModal');
    if (modal && e.target === modal) {
      modal.classList.remove('active');
    }
    if (e.target.closest('#settingsCloseBtn')) {
      document.getElementById('settingsModal')?.classList.remove('active');
    }
    // Settings tab nav
    const tab = e.target.closest('.settings-tab-btn');
    if (tab && tab.closest('#settingsModal')) {
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.toggle('active', b === tab));
      document.querySelectorAll('.settings-tab-pane').forEach(p => p.classList.toggle('active', p.id === `stab-${tabId}`));
    }
    // Save settings
    if (e.target.closest('#saveSettingsBtn')) {
      saveSettings(store);
    }
  });

  // Ensure modal exists in DOM
  ensureSettingsModalMarkup();
}

function ensureSettingsModalMarkup() {
  if (document.getElementById('settingsModal')) return;
  const el = document.createElement('div');
  el.id = 'settingsModal';
  el.className = 'modal-overlay';
  el.innerHTML = getSettingsModalHTML();
  document.body.appendChild(el);
}

function openSettingsModal(api, store) {
  ensureSettingsModalMarkup();
  const modal = document.getElementById('settingsModal');
  if (!modal) return;

  // Populate fields from store/localStorage
  const ghToken = localStorage.getItem('github_token') || '';
  const serverUrl = localStorage.getItem('companion_url') || 'http://127.0.0.1:3100';
  const userName = store.get('user')?.name || 'Cedric';
  const userEmail = store.get('user')?.email || 'cedric@agents-cli.com';
  const tier = store.get('tier') || 'pro';

  const nameEl = modal.querySelector('#profileName');
  const emailEl = modal.querySelector('#profileEmail');
  const tierEl = modal.querySelector('#profileTier');
  const ghEl = modal.querySelector('#githubToken');
  const urlEl = modal.querySelector('#companionUrl');

  if (nameEl) nameEl.value = userName;
  if (emailEl) emailEl.value = userEmail;
  if (tierEl) tierEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  if (ghEl) ghEl.value = ghToken;
  if (urlEl) urlEl.value = serverUrl;

  // Update stats
  const catalog = store.get('catalog') || [];
  const installed = store.get('installed') || [];
  const agentDefs = catalog.filter(p => p.productType === 'agent-def').length;
  const skills = catalog.filter(p => p.productType === 'skill').length;

  const statsEl = modal.querySelector('#profileStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-chip"><span>${installed.length}</span><label>Installed</label></div>
      <div class="stat-chip"><span>${skills}</span><label>Skills</label></div>
      <div class="stat-chip"><span>${agentDefs}</span><label>Agent Defs</label></div>
      <div class="stat-chip"><span>${catalog.length}</span><label>Catalog</label></div>
    `;
  }

  // Test server connection
  const statusEl = modal.querySelector('#serverStatus');
  if (statusEl) {
    statusEl.textContent = 'Testing…';
    statusEl.style.color = 'var(--text-muted)';
    api.health()
      .then(() => {
        statusEl.textContent = '● Connected';
        statusEl.style.color = 'var(--accent-green)';
      })
      .catch(() => {
        statusEl.textContent = '● Offline (standalone mode)';
        statusEl.style.color = 'var(--accent-orange)';
      });
  }

  modal.classList.add('active');

  // Default to profile tab
  modal.querySelectorAll('.settings-tab-btn')[0]?.click();
}

function saveSettings(store) {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;

  const ghToken = modal.querySelector('#githubToken')?.value?.trim() || '';
  const serverUrl = modal.querySelector('#companionUrl')?.value?.trim() || '';
  const name = modal.querySelector('#profileName')?.value?.trim() || '';

  if (ghToken) localStorage.setItem('github_token', ghToken);
  if (serverUrl) localStorage.setItem('companion_url', serverUrl);
  if (name) {
    const user = store.get('user') || {};
    store.set('user', { ...user, name });
    // Update nav display
    document.querySelectorAll('.user-name').forEach(el => { el.textContent = name; });
    document.querySelectorAll('.user-avatar').forEach(el => { el.textContent = name.charAt(0).toUpperCase(); });
  }

  const saveBtn = modal.querySelector('#saveSettingsBtn');
  if (saveBtn) {
    const orig = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved';
    saveBtn.style.background = 'var(--accent-green)';
    setTimeout(() => {
      saveBtn.textContent = orig;
      saveBtn.style.background = '';
    }, 1500);
  }
}

function getSettingsModalHTML() {
  return `
  <div class="modal-content glass-card settings-modal">
    <div class="modal-header">
      <div class="settings-modal-title">
        <div class="user-avatar-lg">C</div>
        <div>
          <h3>Account &amp; Settings</h3>
          <p class="text-muted" style="font-size:0.85rem">Manage your profile and integrations</p>
        </div>
      </div>
      <button class="close-modal" id="settingsCloseBtn">&times;</button>
    </div>

    <div class="settings-layout">
      <!-- Tab Nav -->
      <nav class="settings-tabs">
        <button class="settings-tab-btn active" data-tab="profile">👤 Profile</button>
        <button class="settings-tab-btn" data-tab="connections">🔌 Connections</button>
        <button class="settings-tab-btn" data-tab="tokens">🔑 API Keys</button>
        <button class="settings-tab-btn" data-tab="preferences">⚙️ Preferences</button>
      </nav>

      <!-- Tab Panes -->
      <div class="settings-tab-content">

        <!-- Profile -->
        <div class="settings-tab-pane active" id="stab-profile">
          <div class="profile-section">
            <div class="profile-avatar-row">
              <div class="user-avatar-xl">C</div>
              <div>
                <div class="tier-badge-inline" id="profileTier" style="background:var(--accent-purple)20;color:var(--accent-purple);padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:600">Pro</div>
                <p class="text-muted" style="font-size:0.8rem;margin-top:4px">Local installation · agents-cli v2.0</p>
              </div>
            </div>
            <div class="stats-row" id="profileStats">
              <!-- populated by JS -->
            </div>
            <div class="form-group mt-3">
              <label>Display Name</label>
              <input type="text" class="form-control" id="profileName" placeholder="Your name" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" id="profileEmail" placeholder="you@example.com" />
            </div>
          </div>
        </div>

        <!-- Connections -->
        <div class="settings-tab-pane" id="stab-connections">
          <div class="form-group">
            <label>Companion Server URL</label>
            <input type="text" class="form-control" id="companionUrl" placeholder="http://127.0.0.1:3100" />
            <span class="form-hint" id="serverStatus">…</span>
          </div>
          <div class="form-group">
            <label>MCP Bridge Port</label>
            <input type="text" class="form-control" value="3100" placeholder="3100" />
          </div>
          <div class="registries-connect-list mt-3">
            <h4 style="margin-bottom:12px;font-size:0.9rem;color:var(--text-secondary)">Registry Auto-Connect</h4>
            ${['GitHub', 'npm', 'PyPI', 'crates.io'].map(r => `
            <div class="connect-row">
              <span>${r}</span>
              <label class="toggle-switch">
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>`).join('')}
          </div>
        </div>

        <!-- API Keys -->
        <div class="settings-tab-pane" id="stab-tokens">
          <div class="form-group">
            <label>GitHub Personal Access Token</label>
            <input type="password" class="form-control" id="githubToken" placeholder="ghp_..." autocomplete="off" />
            <span class="form-hint">For higher rate limits on GitHub registry. <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--accent-blue)">Create token ↗</a></span>
          </div>
          <div class="form-group">
            <label>Anthropic API Key</label>
            <input type="password" class="form-control" id="anthropicKey" placeholder="sk-ant-..." autocomplete="off" />
            <span class="form-hint">Used for AI skill generation in Skill Forge.</span>
          </div>
          <div class="form-group">
            <label>OpenAI API Key (optional)</label>
            <input type="password" class="form-control" id="openaiKey" placeholder="sk-..." autocomplete="off" />
          </div>
        </div>

        <!-- Preferences -->
        <div class="settings-tab-pane" id="stab-preferences">
          <div class="form-group">
            <label>Default Skill Domain</label>
            <select class="form-control">
              <option>Auto-detect</option>
              <option>ai-ml</option>
              <option>devops</option>
              <option>code-quality</option>
              <option>testing</option>
            </select>
          </div>
          <div class="connect-row mt-3">
            <span>Enable AI Generation</span>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="connect-row">
            <span>Auto-index on install</span>
            <label class="toggle-switch">
              <input type="checkbox" checked />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="connect-row">
            <span>Dark mode</span>
            <label class="toggle-switch">
              <input type="checkbox" checked disabled />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

      </div>
    </div>

    <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:12px;padding-top:16px;border-top:1px solid var(--surface-border)">
      <button class="btn btn-ghost close-modal" id="settingsCloseBtn2">Cancel</button>
      <button class="btn btn-primary shine" id="saveSettingsBtn">Save Changes</button>
    </div>
  </div>`;
}
