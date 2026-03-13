/**
 * Skill Forge UI — interactive form wired to /api/generate and /api/analyze.
 */

import { showToast } from './product-detail.js';

const DOMAINS = [
  'ai-ml', 'api', 'auth', 'backend', 'blockchain', 'browser', 'ci-cd', 'cli',
  'cloud', 'cms', 'code-quality', 'compiler', 'container', 'crypto', 'data',
  'database', 'desktop', 'devops', 'docs', 'editor', 'email', 'frontend',
  'game', 'git', 'graphics', 'iot', 'mobile', 'monitoring', 'networking',
  'os', 'package-manager', 'search', 'security', 'shell', 'testing', 'web',
];

export function initForgeUi(api, store, auth) {
  const pane = document.getElementById('pane-forge');
  if (!pane) return;

  const toolInput = pane.querySelector('#forgeToolInput');
  const domainSelect = pane.querySelector('#forgeDomainSelect');
  const descInput = pane.querySelector('#forgeDescription');
  const generateBtn = pane.querySelector('#forgeGenerateBtn');
  const analyzeIndicator = pane.querySelector('#forgeAnalyzeResult');
  const progressContainer = pane.querySelector('#forgeProgress');
  const progressBar = pane.querySelector('#forgeProgressBar');
  const progressStage = pane.querySelector('#forgeProgressStage');
  const terminalOutput = pane.querySelector('#forgeTerminal');
  const downloadBtn = pane.querySelector('#forgeDownloadBtn');

  if (!generateBtn) return;

  // Populate domains
  if (domainSelect) {
    domainSelect.innerHTML = `<option value="">Auto-detect</option>` +
      DOMAINS.map(d => `<option value="${d}">${d}</option>`).join('');
  }

  // ── Cost estimator ───────────────────────────────────────────────

  function estimateCost(tool, desc) {
    const tokens = Math.ceil((tool.length + desc.length) * 1.3 + 800);
    const cost = (tokens / 1000000 * 3).toFixed(4);
    return { tokens, cost };
  }

  // ── Quality preview (client-side trigger score) ──────────────────

  function quickScoreTrigger(text) {
    let score = 0;
    if (/use when/i.test(text)) score += 0.3;
    if (/do not use for/i.test(text)) score += 0.2;
    const verbs = ['analyze', 'generate', 'build', 'run', 'execute', 'search', 'convert', 'check', 'create', 'manage'];
    const matchedVerbs = verbs.filter(v => new RegExp(v, 'i').test(text));
    score += Math.min(matchedVerbs.length * 0.12, 0.36);
    if (/[A-Z][a-z]+[A-Z]|[A-Z]{2,}/.test(text)) score += 0.1; // TechNames
    if ((text.match(/,/g) || []).length >= 2) score += 0.1;
    return Math.min(score, 1.0);
  }

  if (descInput) {
    descInput.addEventListener('input', () => {
      const score = quickScoreTrigger(descInput.value);
      const fill = pane.querySelector('#qualityPreviewFill');
      const scoreEl = pane.querySelector('#qualityPreviewScore');
      if (fill) fill.style.width = `${Math.round(score * 100)}%`;
      if (scoreEl) scoreEl.textContent = `${Math.round(score * 100)}%`;
    });
  }

  // ── Persona selector ─────────────────────────────────────────────

  const personaSelector = pane.querySelector('#personaSelector');
  if (personaSelector) {
    personaSelector.querySelectorAll('.persona-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        personaSelector.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        store.set('forgePersona', btn.dataset.persona);
      });
    });
  }

  // ── Generation history ───────────────────────────────────────────

  const HISTORY_KEY = 'forge-history';

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }

  function saveHistory(entry) {
    const history = loadHistory();
    history.unshift({ ...entry, ts: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    renderHistory();
  }

  function renderHistory() {
    const list = pane.querySelector('#genHistoryList');
    if (!list) return;
    const items = loadHistory();
    if (items.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:12px">No history yet</p>';
      return;
    }
    list.innerHTML = items.map(item => `
      <div class="history-item" data-tool="${item.tool || ''}" data-desc="${item.desc || ''}"
           style="padding:6px 8px;border-radius:6px;background:var(--surface-color);margin-bottom:4px;cursor:pointer;font-size:12px;border:1px solid var(--surface-border)">
        <span style="color:var(--text-primary)">${item.tool || item.desc || 'Untitled'}</span>
        <span style="color:var(--text-muted);float:right">${new Date(item.ts).toLocaleDateString()}</span>
      </div>
    `).join('');
    list.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        if (toolInput && item.dataset.tool) toolInput.value = item.dataset.tool;
        if (descInput && item.dataset.desc) descInput.value = item.dataset.desc;
      });
    });
  }

  renderHistory();

  // ── Batch CSV drag-and-drop ──────────────────────────────────────

  const dropZone = pane.querySelector('#batchDropZone');
  const batchFileInput = pane.querySelector('#batchFileInput');

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processBatchCsv(file);
    });
  }

  if (batchFileInput) {
    batchFileInput.addEventListener('change', () => {
      const file = batchFileInput.files[0];
      if (file) processBatchCsv(file);
    });
  }

  function processBatchCsv(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split('\n').filter(l => l.trim());
      const tools = lines.map(l => l.split(',')[0].trim()).filter(Boolean);
      store.set('batchQueue', tools);
      appendTerminal(`\u2192 Batch loaded: ${tools.length} tools from CSV`);
      if (dropZone) dropZone.querySelector('span').textContent = `${tools.length} tools loaded from ${file.name}`;
    };
    reader.readAsText(file);
  }

  // ── Analyze on blur ─────────────────────────────────────────────

  if (toolInput) {
    toolInput.addEventListener('blur', async () => {
      const val = toolInput.value.trim();
      if (!val || !analyzeIndicator) return;
      analyzeIndicator.textContent = 'Analyzing...';
      analyzeIndicator.style.color = 'var(--accent-blue)';
      try {
        const res = await api.analyze(val);
        const profile = res.data || res;
        const techs = profile.techs?.map(t => t.name || t).join(', ') || 'unknown';
        analyzeIndicator.textContent = `Detected: ${techs}`;
        analyzeIndicator.style.color = 'var(--accent-green)';
      } catch {
        analyzeIndicator.textContent = 'Analysis unavailable (server offline)';
        analyzeIndicator.style.color = 'var(--text-muted)';
      }

      // Cost estimator
      const costRow = pane.querySelector('#costEstimatorRow');
      const costEl = pane.querySelector('#costEstimate');
      if (costEl && costRow) {
        const { tokens, cost } = estimateCost(toolInput.value.trim(), descInput?.value.trim() || '');
        costEl.textContent = `~$${cost} / ~${tokens} tokens`;
        costRow.style.display = '';
      }
    });
  }

  // ── Generate ────────────────────────────────────────────────────

  generateBtn.addEventListener('click', async () => {
    const tool = toolInput?.value.trim() || '';
    const domain = domainSelect?.value || '';
    const desc = descInput?.value.trim() || tool;

    if (!desc) {
      showToast('Please enter a tool URI or description');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    if (progressContainer) progressContainer.style.display = 'block';
    if (terminalOutput) terminalOutput.innerHTML = '';
    if (downloadBtn) downloadBtn.style.display = 'none';

    const description = domain ? `[${domain}] ${desc}` : desc;

    try {
      const res = await api.generate(description);
      const jobId = res?.data?.jobId || res?.jobId;
      if (!jobId) throw new Error('No job ID returned');

      appendTerminal(`\u2192 Job created: ${jobId}`);
      appendTerminal(`\u2192 Polling for status...`);

      // Poll for status
      await pollJob(jobId);
    } catch (err) {
      appendTerminal(`\u2718 Error: ${err.message}`, 'error');
      // Fallback: show simulated progress
      await simulateForge(desc);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate';
    }
  });

  async function pollJob(jobId) {
    let attempts = 0;
    const maxAttempts = 120; // 4 min max

    while (attempts < maxAttempts) {
      await sleep(2000);
      attempts++;

      try {
        const res = await api.jobStatus(jobId);
        const data = res.data || res;
        const status = data.status;
        const stage = data.stage || '';
        const progress = data.progress || 0;

        updateProgress(progress, stage);
        appendTerminal(`\u2192 [${progress}%] ${stage}`);

        if (status === 'completed') {
          appendTerminal('\u2714 Generation complete!', 'success');
          if (data.report) {
            appendTerminal(`Quality: ${data.report.quality || 'N/A'}`);
          }
          if (downloadBtn) {
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.onclick = () => downloadBundle(jobId);
          }
          saveHistory({ tool: toolInput?.value.trim(), desc: descInput?.value.trim() });
          return;
        }

        if (status === 'failed') {
          appendTerminal(`\u2718 Failed: ${data.error || 'Unknown error'}`, 'error');
          return;
        }
      } catch {
        appendTerminal('\u2192 Waiting for server...', 'info');
      }
    }
    appendTerminal('\u2718 Timed out', 'error');
  }

  async function simulateForge(desc) {
    const steps = [
      { stage: 'Resolving', pct: 10, msg: `\u2192 Resolving ${desc}...` },
      { stage: 'Downloading', pct: 25, msg: '\u2192 Downloading source...' },
      { stage: 'Analyzing', pct: 40, msg: '\u2192 Probing CLI schema (depth 3)...' },
      { stage: 'Extracting', pct: 55, msg: '\u2714 Found 12 command entrypoints' },
      { stage: 'Generating', pct: 70, msg: '\u2192 Generating SKILL.md...' },
      { stage: 'Hooks', pct: 85, msg: '\u2192 Generating hooks...' },
      { stage: 'Complete', pct: 100, msg: '\u2714 Skill forged successfully (demo mode)' },
    ];

    for (const step of steps) {
      await sleep(600);
      updateProgress(step.pct, step.stage);
      appendTerminal(step.msg, step.pct === 100 ? 'success' : undefined);
    }
  }

  async function downloadBundle(jobId) {
    try {
      const blob = await api.download(jobId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skill-bundle-${jobId.slice(0, 8)}.tar.gz`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Download failed');
    }
  }

  function updateProgress(pct, stage) {
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressStage) progressStage.textContent = stage;
  }

  function appendTerminal(msg, type) {
    if (!terminalOutput) return;
    const p = document.createElement('p');
    if (type) p.className = type;
    p.textContent = msg;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
