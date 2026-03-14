/**
 * Agent Economy module — publisher revenue, skill analytics, agent leaderboard.
 */

import { escapeHtml } from './utils.js';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'claude-opus-team', calls: 12450, earned: 124.50 },
  { rank: 2, name: 'ruff-automation-agent', calls: 9871, earned: 98.71 },
  { rank: 3, name: 'git-workflow-bot', calls: 7234, earned: 72.34 },
  { rank: 4, name: 'pypi-scout', calls: 5102, earned: 51.02 },
  { rank: 5, name: 'mcp-bridge-crew', calls: 3890, earned: 38.90 },
];

export function initEconomy(api, store, auth) {
  const pane = document.getElementById('pane-economy');
  if (!pane) return;

  async function fetchAndRender() {
    let earnings = store.get('earnings');
    const user = store.get('user');

    if (user?.token && !earnings) {
      try {
        const res = await api.getEarnings('month');
        earnings = res?.data || res;
        store.set('earnings', earnings);
      } catch { /* server offline — use defaults */ }
    }

    renderEconomy(earnings);
  }

  function renderEconomy(earnings) {
    // Stats cards
    const totalEl = document.getElementById('econTotalEarned');
    const pendingEl = document.getElementById('econPendingPayout');
    const nextEl = document.getElementById('econNextPayout');
    const countEl = document.getElementById('econSkillCount');

    if (totalEl) totalEl.textContent = `$${(earnings?.totalEarned || 0).toFixed(2)}`;
    if (pendingEl) pendingEl.textContent = `$${(earnings?.pendingPayout || 0).toFixed(2)}`;
    if (nextEl) nextEl.textContent = earnings?.nextPayoutDate || '--';
    if (countEl) countEl.textContent = String(earnings?.skills?.length || 0);

    // Skills table
    renderSkillsTable(earnings?.skills || []);

    // Leaderboard
    renderLeaderboard();
  }

  function renderSkillsTable(skills) {
    const tbody = document.getElementById('econSkillsBody');
    if (!tbody) return;
    if (skills.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">No published skills yet</td></tr>';
      return;
    }
    tbody.innerHTML = skills.map(skill => `
      <tr>
        <td>${escapeHtml(skill.name || skill.id)}</td>
        <td>${skill.calls || 0}</td>
        <td style="color:var(--accent-green)">$${(skill.earned || 0).toFixed(4)}</td>
        <td>${renderSparkline(skill.trend || [])}</td>
      </tr>
    `).join('');
  }

  function renderSparkline(data) {
    if (!data.length) return '<span style="color:var(--text-muted)">--</span>';
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 50},${10 - (v / max) * 10}`).join(' ');
    return `<svg viewBox="0 0 50 12" style="width:50px;height:12px"><polyline points="${pts}" fill="none" stroke="var(--accent-green)" stroke-width="1.5"/></svg>`;
  }

  function renderLeaderboard() {
    const container = document.getElementById('econLeaderboard');
    if (!container) return;
    container.innerHTML = MOCK_LEADERBOARD.map(item => `
      <div class="leaderboard-row">
        <span class="rank">#${item.rank}</span>
        <span style="flex:1;font-weight:500">${escapeHtml(item.name)}</span>
        <span style="color:var(--text-muted);font-size:12px">${item.calls.toLocaleString()} calls</span>
        <span style="color:var(--accent-green);font-weight:600;min-width:60px;text-align:right">$${item.earned.toFixed(2)}</span>
      </div>
    `).join('');
  }

  // Subscribe to updates
  store.subscribe('user', () => fetchAndRender());
  store.subscribe('earnings', (earnings) => renderEconomy(earnings));

  // Initial render
  fetchAndRender();

  return { refresh: fetchAndRender };
}

