/**
 * marketplace-page.js — Bootstrap script for the dedicated /marketplace page.
 * ESM module. Wires hero animations, workflow grid, browse catalog,
 * search/filter/sort, CLI simulator, checkout, and scroll effects.
 */

import { AgentsApi } from './api.js';
import { AppStore } from './store.js';
import { AuthManager } from './auth.js';
import { PRODUCT_TYPE_ICONS, PRODUCT_TYPE_COLORS, formatType, escapeHtml, escapeAttr, showToast } from './utils.js';
import { initProductDetail } from './product-detail.js';

// ── Shared Utilities ────────────────────────────────────────────────

const QUALITY_COLOR = (q) => {
  if (q >= 8) return 'var(--mp-green, #10b981)';
  if (q >= 5) return 'var(--mp-amber, #f59e0b)';
  return 'var(--mp-pink, #f43f5e)';
};

function debounce(fn, ms) {
  let timer = null;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function buildCatalogFromRegistry(data) {
  if (!data) return [];
  return [
    ...(data.github || []),
    ...(data.npm || []),
    ...(data.pypi || []),
    ...(data.crates || []),
    ...(data.agent_defs || []).map((d) => ({ ...d, productType: 'agent-def' })),
    ...(data.harnesses || []).map((d) => ({ ...d, productType: 'harness' })),
    ...(data.cli_anything || []).map((d) => ({ ...d, productType: 'harness' })),
    ...(data.generated_skills || []).map((d) => ({ ...d, productType: 'skill' })),
    ...(data.workflows || []).map((d) => ({ ...d, productType: 'workflow' })),
  ];
}

// ── Stat Counter Animation ──────────────────────────────────────────

function animateStats() {
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
  const els = document.querySelectorAll('.mp-stat-number, .mp-proof-number');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) continue;
      const hasPlus = el.hasAttribute('data-has-plus');
      const duration = 2000;
      const start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(easeOutQuart(progress) * target).toLocaleString() + (hasPlus && progress >= 1 ? '+' : '');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.3 });
  els.forEach((el) => observer.observe(el));
}

// ── Terminal Typing Animation ───────────────────────────────────────

function typeTerminal(containerId, lines, speed = 30) {
  const container = document.getElementById(containerId);
  if (!container) return Promise.resolve();
  return new Promise((resolve) => {
    let lineIdx = 0;
    function nextLine() {
      if (lineIdx >= lines.length) { resolve(); return; }
      const line = lines[lineIdx++];
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'mp-term-line';
        if (line.className) div.classList.add(line.className);
        container.appendChild(div);
        if (!line.text) { nextLine(); return; }
        const textNode = document.createTextNode('');
        const cursor = document.createElement('span');
        cursor.className = 'mp-term-cursor';
        cursor.textContent = '\u2588';
        div.appendChild(textNode);
        div.appendChild(cursor);
        let charIdx = 0;
        function typeChar() {
          if (charIdx >= line.text.length) { cursor.remove(); nextLine(); return; }
          textNode.nodeValue = line.text.slice(0, ++charIdx);
          setTimeout(typeChar, speed);
        }
        typeChar();
      }, line.delay || 0);
    }
    nextLine();
  });
}

function initHeroTerminal() {
  typeTerminal('heroTerminal', [
    { text: '  \u279C Searching 7 registries...', className: 'mp-term-info', delay: 800 },
    { text: '  \u2713 Found 23 matching tools across PyPI, npm, GitHub', className: 'mp-term-success', delay: 400 },
    { text: '', delay: 200 },
    { text: '  NAME              SOURCE    QUALITY  DOMAIN', className: 'mp-term-info', delay: 100 },
    { text: '  langchain         pypi:     9.2/10   ai-ml/llm', delay: 150 },
    { text: '  autogen           pypi:     8.8/10   ai-ml/agent', delay: 150 },
    { text: '  crew-ai           pypi:     8.5/10   ai-ml/agent', delay: 150 },
    { text: '  n8n               npm:      9.0/10   automation', delay: 150 },
    { text: '  windmill          github    8.7/10   automation', delay: 150 },
    { text: '', delay: 300 },
    { text: '  \uD83C\uDFAF 23 results in 1.2s \u2014 install with: agents-cli add <name>', className: 'mp-term-highlight' },
  ]);
}

// ── Workflow Grid ───────────────────────────────────────────────────

const SHOWCASE_WORKFLOWS = [
  { id: 'wf-content-creation', name: 'Content Creation Pipeline', description: 'Scout trending topics, ghostwrite articles, generate images, and publish to CMS.', workflowSteps: [{ name: 'scout', skill: 'web-scout', command: 'scout --trending --limit 10' }, { name: 'ghostwrite', skill: 'ghostwriter', command: 'ghostwrite --tone professional' }, { name: 'image-gen', skill: 'dalle-cli', command: 'generate --style editorial' }, { name: 'publish', skill: 'cms-push', command: 'publish --platform wordpress' }], estimatedDuration: '~8min', quality: 8.7 },
  { id: 'wf-python-cicd', name: 'Python CI/CD Pipeline', description: 'Lint, format, test, security scan, and deploy Python applications.', workflowSteps: [{ name: 'lint', skill: 'ruff', command: 'ruff check .' }, { name: 'format', skill: 'black', command: 'black --check .' }, { name: 'test', skill: 'pytest', command: 'pytest --cov' }, { name: 'security', skill: 'bandit', command: 'bandit -r src/' }, { name: 'deploy', skill: 'fly-cli', command: 'fly deploy' }], estimatedDuration: '~12min', quality: 9.1 },
  { id: 'wf-rag-pipeline-full', name: 'RAG Pipeline', description: 'Ingest documents, embed with vectors, index in database, query with LLM, and evaluate responses.', workflowSteps: [{ name: 'ingest', skill: 'doc-loader', command: 'ingest --dir ./docs' }, { name: 'embed', skill: 'ollama', command: 'embed --model nomic-embed' }, { name: 'index', skill: 'chromadb', command: 'index --collection docs' }, { name: 'query', skill: 'langchain', command: 'query --retriever chroma' }, { name: 'evaluate', skill: 'ragas', command: 'evaluate --metrics all' }], estimatedDuration: '~15min', quality: 8.9 },
  { id: 'wf-media-production', name: 'Media Production Pipeline', description: 'Generate scripts, voiceover, music, edit video, and upload to platform.', workflowSteps: [{ name: 'script', skill: 'ghostwriter', command: 'write --format screenplay' }, { name: 'voiceover', skill: 'elevenlabs', command: 'tts --voice professional' }, { name: 'music', skill: 'suno-cli', command: 'generate --mood upbeat' }, { name: 'video-edit', skill: 'ffmpeg-cli', command: 'compose --timeline auto' }, { name: 'upload', skill: 'youtube-cli', command: 'upload --privacy unlisted' }], estimatedDuration: '~20min', quality: 8.3 },
];

function loadWorkflowGrid(registryData) {
  const grid = document.getElementById('workflowGrid');
  if (!grid) return;
  const workflows = registryData?.workflows ? registryData.workflows.map((w) => ({ ...w, productType: 'workflow' })) : [];
  const existingIds = new Set(workflows.map((w) => w.id));
  for (const wf of SHOWCASE_WORKFLOWS) { if (!existingIds.has(wf.id)) workflows.push(wf); }
  grid.innerHTML = workflows.map(renderWfCard).join('') + `<div class="mp-wf-card" style="border-left-color:var(--mp-amber,#f59e0b);border-style:dashed"><div class="mp-wf-card-header"><span class="mp-wf-card-name">Build Your Own</span><div class="mp-wf-card-meta"><span>\uD83D\uDEE0 Custom</span></div></div><div class="mp-wf-card-desc">Describe any pipeline in natural language and let the agentic composer build it for you.</div><div class="mp-wf-mini-dag"><code style="font-size:0.78rem;color:var(--mp-amber,#f59e0b)">agents-cli compose "your pipeline idea"</code></div></div>`;
}

function renderWfCard(wf) {
  const steps = wf.workflowSteps || [];
  const miniDag = steps.map((s, i) => `<span class="mp-wf-mini-node">${escapeHtml(s.name)}</span>${i < steps.length - 1 ? '<span class="mp-wf-mini-arrow">\u2192</span>' : ''}`).join('');
  return `<div class="mp-wf-card" data-id="${escapeAttr(wf.id)}"><div class="mp-wf-card-header"><span class="mp-wf-card-name">${escapeHtml(wf.name)}</span><div class="mp-wf-card-meta"><span>\u26A1 ${steps.length} steps</span><span>\u23F1 ${escapeHtml(wf.estimatedDuration || 'N/A')}</span></div></div><div class="mp-wf-card-desc">${escapeHtml(wf.description || '')}</div><div class="mp-wf-mini-dag">${miniDag}</div></div>`;
}

// ── Browse Grid — reuses api.searchProducts() ───────────────────────

const browseState = { catalog: [], els: {}, lastResultIds: null };

function cacheBrowseEls() {
  for (const [key, id] of Object.entries({ search: 'mpSearchInput', sort: 'mpSortSelect', tabs: 'mpTypeTabs', grid: 'mpProductGrid', count: 'mpResultCount' })) {
    browseState.els[key] = document.getElementById(id);
  }
}

function loadBrowseGrid(api, catalog) {
  api.catalog = catalog;
  browseState.catalog = catalog;
  cacheBrowseEls();
  renderFilteredProducts(api);
}

function renderFilteredProducts(api) {
  const { search, sort, tabs, grid, count } = browseState.els;
  if (!grid) return;
  const activeTab = tabs?.querySelector('.mp-tab.active');
  const results = api.searchProducts(
    (search?.value || '').trim(),
    { productType: activeTab?.getAttribute('data-type') || 'all', sort: sort?.value || 'quality' }
  );
  const resultIds = results.map((p) => p.id).join(',');
  if (resultIds === browseState.lastResultIds) return;
  browseState.lastResultIds = resultIds;
  if (count) count.textContent = `${results.length} product${results.length !== 1 ? 's' : ''}`;
  if (!results.length) { grid.innerHTML = '<div class="mp-no-results" style="grid-column:1/-1;text-align:center;padding:3rem;opacity:0.6">No products match your search.</div>'; return; }
  grid.innerHTML = results.map(renderProductCard).join('');
}

function renderProductCard(product) {
  const icon = PRODUCT_TYPE_ICONS[product.productType] || '\uD83D\uDCE6';
  const color = PRODUCT_TYPE_COLORS[product.productType] || 'var(--text-secondary,#8b949e)';
  const q = typeof product.quality === 'number' ? product.quality : 0;
  return `<div class="mp-product-card" data-id="${escapeAttr(product.id || product.name || '')}"><div class="mp-product-card-type" style="color:${color}">${icon} ${formatType(product.productType)}</div><div class="mp-product-card-name">${escapeHtml(product.name || '')}</div><div class="mp-product-card-desc">${escapeHtml(product.description || '')}</div><div class="mp-product-card-meta"><span class="mp-product-card-quality" style="color:${QUALITY_COLOR(q)}">${q.toFixed(1)}</span><span class="mp-product-card-domain">${escapeHtml(product.domain || product.category || '')}</span></div></div>`;
}

// ── Filter Wiring ───────────────────────────────────────────────────

function wireFilters(api) {
  const { search, sort, tabs } = browseState.els;
  const rerender = () => renderFilteredProducts(api);
  if (search) search.addEventListener('input', debounce(rerender, 300));
  if (tabs) tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.mp-tab');
    if (!btn) return;
    tabs.querySelectorAll('.mp-tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    rerender();
  });
  if (sort) sort.addEventListener('change', rerender);
}

// ── Checkout — uses api.billingCheckout() with auth ─────────────────

function wireCheckout(api) {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-price-id]');
    if (!btn) return;
    const priceId = btn.getAttribute('data-price-id');
    if (!priceId) return;
    e.preventDefault();
    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = 'Redirecting...';
    try {
      const data = await api.billingCheckout(priceId);
      const url = data?.data?.url || data?.url;
      if (url) { window.location.href = url; } else { throw new Error('No checkout URL returned'); }
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
}

// ── Scroll Reveal ───────────────────────────────────────────────────

function initScrollReveal() {
  const els = document.querySelectorAll('.mp-source-card, .mp-mega-card, .mp-wf-arch-card, .mp-ptype, .mp-price-card');
  if (!els.length) return;
  els.forEach((el) => el.classList.add('mp-reveal-hidden'));
  const observer = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((entry, idx) => {
      observer.unobserve(entry.target);
      setTimeout(() => entry.target.classList.add('revealed'), idx * 100);
    });
  }, { threshold: 0.1 });
  els.forEach((el) => observer.observe(el));
}

// ── Nav Scroll ──────────────────────────────────────────────────────

function initNavScroll() {
  const nav = document.querySelector('.mp-nav');
  if (!nav) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { nav.classList.toggle('scrolled', window.scrollY > 20); ticking = false; });
  }, { passive: true });
}

// ── CLI Simulator ───────────────────────────────────────────────────

const CLI_COMMANDS = {
  'help': [
    { text: 'agents-cli \u2014 Package manager for AI agent tools', cls: 'info' },
    { text: '' }, { text: 'COMMANDS:', cls: 'highlight' },
    { text: '  add <source>        Install a tool from any registry' },
    { text: '  search <query>      Search across all registries' },
    { text: '  describe <tool>     Show tool details and commands' },
    { text: '  run <tool> -- args  Execute a tool' },
    { text: '  list                List installed tools' },
    { text: '  schema <tool>       Show tool schema' },
    { text: '  compose <prompt>    AI-compose a workflow' },
    { text: '  skills generate     Generate skills from tools' },
    { text: '  skills list         List installed skills' },
    { text: '  mcp start           Start MCP bridge server' },
    { text: '  mcp list            List MCP-exposed tools' },
    { text: '  crawl seed          Seed crawl queue' },
    { text: '  crawl start         Start crawl worker' },
    { text: '  plugin init         Initialize a new plugin' },
    { text: '  freeze              Generate lockfile' },
    { text: '  verify              Verify lockfile integrity' },
    { text: '  scan <dir>          Scan directory for tools' },
    { text: '  stats               Show system statistics' },
  ],
  'add pypi:ruff': [
    { text: '\u279C Resolving pypi:ruff...', cls: 'info' },
    { text: '  \u21B3 Registry: PyPI | Version: 0.8.6 | Language: Python', cls: 'info' },
    { text: '\u279C Installing into ~/.agents-cli/tools/ruff/...', cls: 'info' },
    { text: '  \u21B3 Created venv, installed via pip', cls: 'info' },
    { text: '\u279C Analyzing ruff --help...', cls: 'info' },
    { text: '  \u21B3 Deep probe: 47 commands, 12 global flags', cls: 'info' },
    { text: '\u279C Generating SKILL.md...', cls: 'info' },
    { text: '  \u21B3 Trigger: 1.00 | Quality: 9.2 | Content: 8.5', cls: 'success' },
    { text: '\u2713 ruff installed and skill generated', cls: 'success' },
  ],
  'search "AI workflow"': [
    { text: '\u279C Searching 7 registries...', cls: 'info' },
    { text: '' },
    { text: '  NAME              SOURCE    QUALITY  DOMAIN', cls: 'info' },
    { text: '  langchain         pypi:     9.2/10   ai-ml/llm' },
    { text: '  autogen           pypi:     8.8/10   ai-ml/agent' },
    { text: '  n8n               npm:      9.0/10   automation' },
    { text: '  windmill          github    8.7/10   automation' },
    { text: '  temporal          github    8.5/10   orchestration' },
    { text: '' },
    { text: '\uD83C\uDFAF 5 results in 0.8s', cls: 'highlight' },
  ],
  'list': [
    { text: '  NAME              VERSION   SOURCE    DOMAIN', cls: 'info' },
    { text: '  ruff              0.8.6     pypi:     python/linting' },
    { text: '  eslint            9.18.0    npm:      javascript/linting' },
    { text: '  ripgrep           14.1.1    crates:   search/grep' },
    { text: '  claude-code       1.0.0     github    ai-ml/agent' },
    { text: '  httpie            3.2.4     pypi:     http/client' },
    { text: '' },
    { text: '\uD83D\uDCE6 559 tools installed', cls: 'highlight' },
  ],
  'compose "content pipeline"': [
    { text: '\u279C Discovering skills across 7 registries...', cls: 'info' },
    { text: '  \u21B3 Found 12 compatible skills', cls: 'info' },
    { text: '\u279C Proposing workflow with TieredLLMClient...', cls: 'info' },
    { text: '\u2713 Iteration 1/5 \u2014 quality: 0.72', cls: 'success' },
    { text: '\u2713 Iteration 2/5 \u2014 quality: 0.81', cls: 'success' },
    { text: '\u2713 Iteration 3/5 \u2014 quality: 0.89 \u2714\uFE0F', cls: 'success' },
    { text: '\u279C Generated: SKILL.md, run.sh, setup.sh, workflow.md', cls: 'info' },
    { text: '\uD83C\uDF89 Workflow "content-pipeline" ready!', cls: 'highlight' },
  ],
  'stats': [
    { text: '  SYSTEM STATISTICS', cls: 'highlight' },
    { text: '  \u2500'.repeat(16), cls: 'info' },
    { text: '  Tools installed:     559' }, { text: '  Skills generated:    393' },
    { text: '  MCP tools:           534' }, { text: '  Domain plugins:      52' },
    { text: '  Source registries:    7' },
    { text: '  Avg trigger score:   1.000', cls: 'success' },
    { text: '  Avg quality score:   9.0/10', cls: 'success' },
    { text: '  DB size:             48.2 MB' },
  ],
  'mcp start': [
    { text: '\u279C Starting MCP bridge server...', cls: 'info' },
    { text: '  \u21B3 Loading 534 tool definitions...', cls: 'info' },
    { text: '\u2713 MCP server running on stdio', cls: 'success' },
    { text: '  \u21B3 534 tools available for Claude Code', cls: 'highlight' },
  ],
  'mcp list': [
    { text: '  MCP TOOLS (5 of 534)', cls: 'info' },
    { text: '  ruff_check          Check Python code for errors' },
    { text: '  ruff_format         Format Python code' },
    { text: '  eslint_lint         Lint JavaScript/TypeScript' },
    { text: '  ripgrep_search      Search files with regex' },
    { text: '  httpie_request      Make HTTP requests' },
    { text: '  ... and 529 more', cls: 'info' },
  ],
  'skills generate': [
    { text: '\u279C Generating skills for 559 installed tools...', cls: 'info' },
    { text: '  \u21B3 Trigger optimization: avg 1.000', cls: 'success' },
    { text: '  \u21B3 Quality gate: 393/393 passed', cls: 'success' },
    { text: '\u2713 393 skills generated in 47.3s', cls: 'success' },
  ],
  'skills list': [
    { text: '  INSTALLED SKILLS (5 of 393)', cls: 'info' },
    { text: '  NAME              TRIGGER  QUALITY  DOMAIN', cls: 'info' },
    { text: '  src-ruff          1.00     9.2      python/linting' },
    { text: '  src-eslint        1.00     8.8      javascript/linting' },
    { text: '  src-ripgrep       1.00     9.0      search/grep' },
    { text: '  src-httpie        1.00     8.5      http/client' },
    { text: '  src-claude-code   1.00     9.5      ai-ml/agent' },
  ],
  'schema ruff': [
    { text: '  SCHEMA: ruff (depth: 3)', cls: 'highlight' },
    { text: '  \u251C\u2500 check' },
    { text: '  \u2502  \u251C\u2500 --select <RULES>', cls: 'info' },
    { text: '  \u2502  \u251C\u2500 --ignore <RULES>', cls: 'info' },
    { text: '  \u2502  \u2514\u2500 --fix', cls: 'info' },
    { text: '  \u251C\u2500 format' },
    { text: '  \u2502  \u251C\u2500 --line-length <N>', cls: 'info' },
    { text: '  \u2502  \u2514\u2500 --check', cls: 'info' },
    { text: '  \u2514\u2500 45 more commands...', cls: 'info' },
  ],
  'crawl seed': [
    { text: '\u279C Seeding crawl queue...', cls: 'info' },
    { text: '  PyPI: 500 | npm: 500 | crates: 200 | GitHub: 300 | MCP: 50', cls: 'info' },
    { text: '\u2713 1,550 items seeded', cls: 'success' },
  ],
  'crawl start': [
    { text: '\u279C Starting crawl worker (auto concurrency)...', cls: 'info' },
    { text: '\u2713 pandas: trigger=1.00 quality=8.8', cls: 'success' },
    { text: '\u2713 zod: trigger=1.00 quality=9.1', cls: 'success' },
    { text: '  1,548 remaining...', cls: 'info' },
  ],
  'plugin init': [
    { text: '\u279C Initializing plugin scaffold...', cls: 'info' },
    { text: '  Created: .claude-plugin/plugin.json, skills/, agents/, commands/', cls: 'info' },
    { text: '\u2713 Plugin scaffold created', cls: 'success' },
  ],
  'freeze': [
    { text: '\u279C Generating lockfile...', cls: 'info' },
    { text: '\u2713 agents-cli.lock written (559 entries)', cls: 'success' },
  ],
  'verify': [
    { text: '\u279C Verifying lockfile integrity...', cls: 'info' },
    { text: '\u2713 All 559 entries verified \u2014 no drift', cls: 'success' },
  ],
  'scan .': [
    { text: '\u279C Scanning current directory...', cls: 'info' },
    { text: '  Found: agents-cli, skill-forge, agent-run', cls: 'info' },
    { text: '\u2713 3 tools detected', cls: 'success' },
  ],
};
const CLI_COMMAND_KEYS = Object.keys(CLI_COMMANDS);
const MAX_CLI_LINES = 200;

function initCliSimulator() {
  const input = document.getElementById('cliSimInput');
  const output = document.getElementById('cliSimOutput');
  if (!input || !output) return;

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const raw = input.value.trim();
    input.value = '';
    if (!raw) return;
    if (raw === 'clear' || raw === 'cls') { output.innerHTML = ''; return; }

    const cmd = raw.replace(/^agents-cli\s+/, '');

    // Prompt line
    const prompt = document.createElement('div');
    prompt.className = 'mp-cli-prompt-line';
    prompt.innerHTML = `<span class="mp-term-prompt">$</span> ${escapeHtml(raw)}`;
    output.appendChild(prompt);

    // Match command
    let matched = CLI_COMMANDS[cmd];
    if (!matched) {
      const key = CLI_COMMAND_KEYS.find((k) => cmd.startsWith(k) || k.startsWith(cmd));
      if (key) matched = CLI_COMMANDS[key];
    }

    // Output lines via DocumentFragment (single DOM write)
    const frag = document.createDocumentFragment();
    const lines = matched || [{ text: "Unknown command. Type 'help' for available commands.", cls: 'info' }];
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = 'mp-cli-output-line';
      if (line.cls) div.classList.add(`mp-term-${line.cls}`);
      div.textContent = line.text || '';
      frag.appendChild(div);
    }
    output.appendChild(frag);

    // Cap DOM, single scroll
    while (output.children.length > MAX_CLI_LINES) output.removeChild(output.firstChild);
    output.scrollTop = output.scrollHeight;
  });
}

// ── Source Adapter Picker ───────────────────────────────────────────

function initAdapterPicker() {
  const container = document.getElementById('adapterTabs');
  if (!container) return;
  const tabs = container.querySelectorAll('.mp-adapter-tab');
  const panes = document.querySelectorAll('.mp-adapter-pane');
  container.addEventListener('click', (e) => {
    const tab = e.target.closest('.mp-adapter-tab');
    if (!tab) return;
    const target = tab.getAttribute('data-source') || tab.getAttribute('data-adapter');
    tabs.forEach((t) => t.classList.remove('active'));
    panes.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.mp-adapter-pane[data-adapter="${target}"]`)?.classList.add('active');
  });
}

// ── Walkthrough ─────────────────────────────────────────────────────

function initWalkthrough() {
  const section = document.getElementById('how-it-works');
  if (!section) return;
  const steps = section.querySelectorAll('.mp-walk-step');
  if (!steps.length) return;
  steps.forEach((s) => s.classList.add('mp-walk-hidden'));
  let activated = false;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || activated) continue;
      activated = true;
      observer.disconnect();
      steps.forEach((step, idx) => {
        setTimeout(() => {
          for (let j = 0; j < idx; j++) { steps[j].classList.add('completed'); steps[j].classList.remove('active'); }
          step.classList.remove('mp-walk-hidden');
          step.classList.add('active');
        }, idx * 200);
      });
    }
  }, { threshold: 0.2 });
  observer.observe(section);
}

// ── Smooth Scroll + Checkout Result ─────────────────────────────────

function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
}

function handleCheckoutResult() {
  const status = new URLSearchParams(window.location.search).get('checkout');
  if (!status) return;
  if (status === 'success') showToast('Subscription activated! Welcome aboard.', 'success');
  const url = new URL(window.location.href);
  url.searchParams.delete('checkout');
  window.history.replaceState({}, '', url.pathname + url.hash);
}

// ── Boot ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const api = new AgentsApi();
  const store = new AppStore();
  const auth = new AuthManager(api, store);
  const productDetail = initProductDetail(api, store, auth);
  const showProductDetail = (id) => productDetail.show(id);

  // Fetch catalog + registry data concurrently
  let catalog = [];
  let registryData = null;
  try {
    const [catRes, regRes] = await Promise.allSettled([
      api.loadCatalog(),
      fetch('registry-data.json').then((r) => r.ok ? r.json() : null),
    ]);
    registryData = regRes.status === 'fulfilled' ? regRes.value : null;
    catalog = (catRes.status === 'fulfilled' && catRes.value?.length) ? catRes.value : buildCatalogFromRegistry(registryData);
  } catch (_) { console.warn('Failed to load catalog'); }

  // Render + wire
  loadWorkflowGrid(registryData);
  loadBrowseGrid(api, catalog);
  wireFilters(api);
  wireCheckout(api);

  // Animations
  animateStats();
  initHeroTerminal();
  initScrollReveal();
  initNavScroll();
  initSmoothScroll();
  initCliSimulator();
  initAdapterPicker();
  initWalkthrough();

  // Product card click delegation
  for (const [sel, cls] of [['mpProductGrid', '.mp-product-card'], ['workflowGrid', '.mp-wf-card']]) {
    document.getElementById(sel)?.addEventListener('click', (e) => {
      const card = e.target.closest(cls);
      if (card?.dataset.id) showProductDetail(card.dataset.id);
    });
  }

  // Get Started button
  document.getElementById('mpGetStarted')?.addEventListener('click', () => {
    auth.isLoggedIn() ? document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }) : auth.loginWithGoogle();
  });

  handleCheckoutResult();
});
