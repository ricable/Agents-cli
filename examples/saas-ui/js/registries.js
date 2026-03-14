/**
 * Registries module — auto-connects GitHub, npm, PyPI, crates.io and cli-anything.
 * Loads from registry-data.json (generated from ~/.agents-cli/tools.json) standalone.
 */

import { escapeHtml, formatPrice } from './marketplace.js';

const REGISTRY_META = {
  github: { label: 'GitHub', icon: '🐙', badge: 'git', color: 'var(--accent-blue)', desc: 'Tools sourced directly from GitHub repositories.' },
  npm: { label: 'npm', icon: '📦', badge: 'npm', color: '#cc3534', desc: 'Node.js CLI tools, frameworks, and libraries.' },
  pypi: { label: 'PyPI', icon: '🐍', badge: 'pip', color: '#3572a5', desc: 'Python utilities, agents, and AI tools.' },
  crates: { label: 'crates.io', icon: '🦀', badge: 'rs', color: '#dea584', desc: 'High-performance Rust binaries and tools.' },
  'cli-anything': { label: 'CLI-Anything', icon: '🤖', badge: 'cli', color: 'var(--accent-purple)', desc: 'Skills wrapping any GUI/desktop app via AI-generated CLI bindings.' },
};

let registryData = null;

async function loadRegistryData() {
  if (registryData) return registryData;
  try {
    const res = await fetch('registry-data.json');
    if (res.ok) {
      registryData = await res.json();
    }
  } catch {
    registryData = { github: [], npm: [], pypi: [], crates: [], agent_defs: [], harnesses: [], cli_anything: [] };
  }
  return registryData;
}

export function initRegistries(api, store) {
  // Inject agent-defs, harnesses, and generated skills into catalog after load
  api.loadCatalog().then(() => {
    loadRegistryData().then(data => {
      const extras = [
        ...(data.agent_defs || []).map(t => ({ ...t, productType: 'agent-def' })),
        ...(data.harnesses || []).map(t => ({ ...t, productType: 'harness' })),
        ...(data.generated_skills || []).map(t => ({ ...t, productType: t.productType || 'skill' })),
        ...(data.workflows || []).map(t => ({ ...t, productType: 'workflow' })),
      ];
      // Merge into api.catalog without duplicates
      const existingIds = new Set(api.catalog.map(p => p.id));
      const newEntries = extras.filter(e => !existingIds.has(e.id));
      if (newEntries.length === 0) return;
      api.catalog = [...api.catalog, ...newEntries];
      store.set('catalog', api.catalog);
      // Notify marketplace to re-render with the new entries
      window.dispatchEvent(new CustomEvent('catalog-updated'));
    });
  });

  // Init each registry pane
  ['github', 'npm', 'pypi', 'crates', 'cli-anything'].forEach(reg => {
    const pane = document.getElementById(`pane-registry-${reg}`);
    if (pane) initRegistryPane(pane, reg, store);
  });
}

function initRegistryPane(pane, regKey, store) {
  const meta = REGISTRY_META[regKey] || { label: regKey, icon: '📦', color: 'var(--accent-blue)', desc: '' };

  pane.innerHTML = `
    <div class="registry-header">
      <div class="registry-title-row">
        <span class="registry-icon-lg">${meta.icon}</span>
        <div>
          <h3>${meta.label} Registry</h3>
          <p class="text-muted">${meta.desc}</p>
        </div>
        <span class="registry-status connected"><span class="status-dot green"></span> Connected</span>
      </div>
      <div class="registry-search-bar glass">
        <input type="text" class="reg-search-input" placeholder="Search ${meta.label} tools..." data-reg="${regKey}" />
        <span class="reg-count" id="reg-count-${regKey}">Loading…</span>
      </div>
    </div>
    <div class="plugin-grid mt-3" id="reg-grid-${regKey}">
      ${renderRegSkeletons(6)}
    </div>
  `;

  loadRegistryData().then(data => {
    const items = regKey === 'cli-anything' ? (data.cli_anything || []) : (data[regKey] || []);
    renderRegGrid(regKey, items, '');
    const countEl = document.getElementById(`reg-count-${regKey}`);
    if (countEl) countEl.textContent = `${items.length} tools`;

    const searchInput = pane.querySelector('.reg-search-input');
    if (searchInput) {
      let timer;
      searchInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => renderRegGrid(regKey, items, searchInput.value.trim()), 250);
      });
    }
  });
}

function renderRegGrid(regKey, items, query) {
  const grid = document.getElementById(`reg-grid-${regKey}`);
  if (!grid) return;

  let filtered = items;
  if (query) {
    const q = query.toLowerCase();
    filtered = items.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  const countEl = document.getElementById(`reg-count-${regKey}`);
  if (countEl) countEl.textContent = `${filtered.length} tools`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><p style="color:var(--text-secondary)">No results for "${escapeHtml(query)}"</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(t => renderRegCard(t, regKey)).join('');
}

function renderRegCard(tool, regKey) {
  const meta = REGISTRY_META[regKey] || {};
  const color = meta.color || 'var(--accent-blue)';
  const name = escapeHtml(tool.name || tool.id || 'Unknown');
  const desc = escapeHtml((tool.description || 'No description').slice(0, 110));
  const uri = tool.uri || tool.source || '';
  const cmds = tool.commands || 0;
  const tags = (tool.tags || []).slice(0, 3);
  const version = tool.version ? `v${tool.version}` : '';

  return `
    <div class="plugin-card glass-card registry-card" data-uri="${escapeHtml(uri)}">
      <div class="plugin-header">
        <div class="plugin-icon" style="border-color:${color}30;background:${color}10;font-size:1.4rem">
          ${meta.icon || '📦'}
        </div>
        <div class="plugin-title">
          <h4>${name}</h4>
          <span class="plugin-author">${escapeHtml(uri || regKey)}</span>
        </div>
        ${version ? `<span class="plugin-price free">${version}</span>` : ''}
      </div>
      <p class="plugin-desc">${desc}${(tool.description || '').length > 110 ? '…' : ''}</p>
      <div class="plugin-footer">
        <div class="plugin-meta">
          ${tags.map(t => `<span class="badge" style="background:${color}20;color:${color}">${escapeHtml(t)}</span>`).join('')}
          ${cmds > 0 ? `<span class="meta-item">${cmds} cmds</span>` : ''}
        </div>
        <button class="btn btn-secondary btn-sm reg-install-btn" data-name="${name}" data-uri="${escapeHtml(uri)}">
          Add
        </button>
      </div>
    </div>`;
}

function renderRegSkeletons(n) {
  return Array.from({ length: n }, () => `
    <div class="plugin-card glass-card skeleton-card">
      <div class="skeleton-line" style="width:60%;height:20px;margin-bottom:12px"></div>
      <div class="skeleton-line" style="width:80%;height:14px;margin-bottom:8px"></div>
      <div class="skeleton-line" style="width:40%;height:14px"></div>
    </div>`).join('');
}

export { loadRegistryData };
