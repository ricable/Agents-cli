/**
 * workflow-dag.js — Pure CSS/HTML DAG renderer for workflow detail modal.
 * No external library dependencies.
 */

import { escapeHtml } from './utils.js';

const STEP_ICONS = {
  scout: '🔍', fetch: '🔍', search: '🔍', scrape: '🔍', ingest: '📥',
  ghostwriter: '✍️', write: '✍️', generate: '✨', create: '✨',
  image: '🖼️', img: '🖼️', visual: '🖼️', render: '🖼️',
  music: '🎵', audio: '🎵', sound: '🎵', voiceover: '🗣️', voice: '🗣️', tts: '🗣️',
  director: '🎬', video: '🎬', compose: '🎼', edit: '✏️',
  upload: '📤', publish: '📤', deploy: '🚀', push: '📤',
  lint: '🔍', format: '📐', test: '🧪', check: '✅', validate: '✅',
  scan: '🛡️', audit: '🛡️', security: '🛡️',
  train: '🧠', embed: '📊', index: '📇', query: '❓',
  preprocess: '⚙️', process: '⚙️', transform: '🔄', convert: '🔄',
  evaluate: '📊', review: '👁️', report: '📋',
};

function getStepIcon(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, icon] of Object.entries(STEP_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '⚙️';
}

/**
 * Render a linear DAG visualization for workflow steps.
 */
export function renderWorkflowDag(steps, dataFlow) {
  if (!steps?.length) return '<p style="color:var(--text-muted)">No pipeline steps defined.</p>';

  const maxVisible = 8;
  const visible = steps.slice(0, maxVisible);
  const hasOverflow = steps.length > maxVisible;

  const nodes = visible.map((step, i) => {
    const icon = getStepIcon(step.name);
    const artifact = findArtifact(step.name, i, visible, dataFlow);

    const nodeHtml = `
      <div class="wf-dag-node" title="${escapeHtml(step.command || '')}">
        <span class="wf-dag-node-icon">${icon}</span>
        <span class="wf-dag-node-label">${escapeHtml(step.name)}</span>
        <span class="wf-dag-node-tool">${escapeHtml(step.skill || step.tool || '')}</span>
        ${step.onFailure && step.onFailure !== 'stop' ? `<span class="wf-dag-node-fail">${step.onFailure}</span>` : ''}
      </div>`;

    if (i < visible.length - 1) {
      return nodeHtml + `
        <div class="wf-dag-connector">
          <div class="wf-dag-arrow">
            ${artifact ? `<span class="wf-dag-artifact">${escapeHtml(artifact)}</span>` : ''}
          </div>
        </div>`;
    }
    return nodeHtml;
  }).join('');

  const overflow = hasOverflow
    ? `<div class="wf-dag-connector"><div class="wf-dag-arrow"></div></div><div class="wf-dag-node wf-dag-overflow"><span class="wf-dag-node-icon">...</span><span class="wf-dag-node-label">+${steps.length - maxVisible} more</span></div>`
    : '';

  return `<div class="wf-dag-linear">${nodes}${overflow}</div>`;
}

/**
 * Render a step detail table.
 */
export function renderStepTable(steps) {
  if (!steps?.length) return '';

  const rows = steps.map(s => `
    <tr>
      <td>${getStepIcon(s.name)} ${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.skill || s.tool || '-')}</td>
      <td><code>${escapeHtml(s.command || '-')}</code></td>
      <td>${escapeHtml(s.onFailure || 'stop')}</td>
      <td>${escapeHtml(s.condition || 'always')}</td>
    </tr>`).join('');

  return `
    <table class="wf-step-table">
      <thead>
        <tr>
          <th>Step</th>
          <th>Tool</th>
          <th>Command</th>
          <th>On Failure</th>
          <th>Condition</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * Render an environment variables table.
 */
export function renderEnvVarsTable(envVars) {
  if (!envVars?.length) return '<p style="color:var(--text-muted)">No environment variables required.</p>';

  const rows = envVars.map(v => `
    <tr>
      <td><code>${escapeHtml(v.name)}</code></td>
      <td>${escapeHtml(v.description || '-')}</td>
      <td>${v.required ? '<span style="color:var(--accent-pink)">Required</span>' : '<span style="color:var(--text-muted)">Optional</span>'}</td>
      <td style="font-size:0.75rem;color:var(--text-muted)">${v.example ? escapeHtml(v.example) : '-'}</td>
    </tr>`).join('');

  return `
    <table class="wf-step-table">
      <thead>
        <tr>
          <th>Variable</th>
          <th>Description</th>
          <th>Required</th>
          <th>Example</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Helpers ──────────────────────────────────────────────────────────

function findArtifact(stepName, index, steps, dataFlow) {
  if (!dataFlow?.length || index >= steps.length - 1) return null;
  const nextStep = steps[index + 1];
  if (!nextStep) return null;
  const edge = dataFlow.find(e =>
    (e.from === stepName || stepName.includes(e.from)) &&
    (e.to === nextStep.name || nextStep.name.includes(e.to))
  );
  return edge?.artifact || null;
}
