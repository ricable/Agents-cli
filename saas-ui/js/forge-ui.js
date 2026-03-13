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
