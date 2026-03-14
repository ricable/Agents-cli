/**
 * Shared utilities — extracted from marketplace.js and product-detail.js
 * for reuse across main site and admin panel.
 */

export const PRODUCT_TYPE_ICONS = {
  skill: '\u{1F4DC}',
  plugin: '\u{1F9E9}',
  'hook-bundle': '\u{1F6E1}',
  'agent-def': '\u{1F916}',
  'agent-team': '\u{1F465}',
  harness: '\u{1F4BB}',
  workflow: '\u26A1',
};

export const PRODUCT_TYPE_COLORS = {
  skill: 'var(--accent-blue)',
  plugin: 'var(--accent-purple)',
  'hook-bundle': 'var(--accent-orange)',
  'agent-def': 'var(--accent-green)',
  'agent-team': 'var(--accent-pink)',
  harness: 'var(--text-secondary)',
  workflow: 'var(--accent-cyan)',
};

export function formatType(type) {
  if (!type) return 'Unknown';
  return type.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

const ATTR_ESC = { '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' };
export const escapeAttr = (str) => String(str).replace(/[&"'<>]/g, c => ATTR_ESC[c]);

export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
