/**
 * API Client — service layer wrapping all companion web-service endpoints.
 * Loads marketplace.json for catalog data (works standalone or connected).
 */

export class AgentsApi {
  constructor(baseUrl = 'http://127.0.0.1:3100') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
    this.catalog = [];
    this.catalogLoaded = false;
  }

  setToken(token) {
    this.token = token;
  }

  _headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async _fetch(path, opts = {}) {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...opts,
      headers: this._headers(opts.headers),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.data?.message || body?.message || res.statusText;
      throw new ApiError(res.status, msg);
    }
    return res.json();
  }

  // ── Health ──────────────────────────────────────────────────────

  async health() {
    return this._fetch('/api/health');
  }

  // ── Auth ────────────────────────────────────────────────────────

  async authInit(provider, redirectUri) {
    return this._fetch(`/api/auth/init?provider=${encodeURIComponent(provider)}&redirect_uri=${encodeURIComponent(redirectUri)}`);
  }

  async authCallback(provider, code, state, codeVerifier) {
    return this._fetch('/api/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ provider, code, state, codeVerifier }),
    });
  }

  async authMe() {
    return this._fetch('/api/auth/me');
  }

  // ── Analysis ────────────────────────────────────────────────────

  async analyze(description) {
    return this._fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async plan(description) {
    return this._fetch('/api/plan', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  // ── Generation (async jobs) ─────────────────────────────────────

  async generate(description) {
    return this._fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async generateCliAnything(appName, opts = {}) {
    return this._fetch('/api/cli-anything/generate', {
      method: 'POST',
      body: JSON.stringify({ appName, ...opts }),
    });
  }

  async jobStatus(jobId) {
    return this._fetch(`/api/status/${jobId}`);
  }

  async download(jobId) {
    const url = `${this.baseUrl}/api/download/${jobId}`;
    const res = await fetch(url, { headers: this._headers() });
    if (!res.ok) throw new ApiError(res.status, 'Download failed');
    return res.blob();
  }

  // ── Usage ───────────────────────────────────────────────────────

  async usage() {
    return this._fetch('/api/usage');
  }

  // ── Billing ─────────────────────────────────────────────────────

  async billingCheckout(priceId) {
    return this._fetch('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

  async billingPortal() {
    return this._fetch('/api/billing/portal');
  }

  async billingInvoices() {
    return this._fetch('/api/billing/invoices');
  }

  // ── Catalog (marketplace.json) ──────────────────────────────────

  async loadCatalog() {
    if (this.catalogLoaded) return this.catalog;
    try {
      // Try server endpoint first
      const res = await this._fetch('/api/catalog');
      this.catalog = res?.data?.products || res?.data || [];
    } catch {
      // Fallback: load static marketplace.json
      try {
        const res = await fetch('marketplace.json');
        if (res.ok) {
          const data = await res.json();
          this.catalog = data?.products || [];
        }
      } catch {
        this.catalog = [];
      }
    }
    this.catalogLoaded = true;
    return this.catalog;
  }

  searchProducts(query, filters = {}) {
    let results = [...this.catalog];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.app?.toLowerCase().includes(q)
      );
    }
    if (filters.productType && filters.productType !== 'all') {
      results = results.filter(p => p.productType === filters.productType);
    }
    if (filters.pricingModel === 'free') {
      const getPrice = p => p.pricing?.price ?? p.pricing?.basePrice ?? 0;
      results = results.filter(p => getPrice(p) === 0 || p.pricing?.model === 'free');
    } else if (filters.pricingModel === 'paid') {
      const getPrice = p => p.pricing?.price ?? p.pricing?.basePrice ?? 0;
      results = results.filter(p => getPrice(p) > 0 && p.pricing?.model !== 'free');
    }
    if (filters.minRating > 0) {
      results = results.filter(p => (p.stats?.rating || 0) >= filters.minRating);
    }
    if (filters.minQuality > 0) {
      results = results.filter(p => (p.quality || 0) >= filters.minQuality);
    }
    // Sort
    switch (filters.sort) {
      case 'rating':
        results.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0));
        break;
      case 'downloads':
        results.sort((a, b) => (b.stats?.downloads || 0) - (a.stats?.downloads || 0));
        break;
      case 'newest':
        results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'quality':
        results.sort((a, b) => (b.quality || 0) - (a.quality || 0));
        break;
      default:
        // relevance — already filtered
        break;
    }
    return results;
  }

  getProduct(id) {
    return this.catalog.find(p => p.id === id) || null;
  }

  listProducts({ productType, limit = 50, offset = 0 } = {}) {
    let results = this.catalog;
    if (productType) results = results.filter(p => p.productType === productType);
    return results.slice(offset, offset + limit);
  }

  // ── Streaming Invocations ──────────────────────────────────

  streamInvocations(skillName, onEvent, onError) {
    const url = `${this.baseUrl}/api/invocations/stream?skill=${encodeURIComponent(skillName)}`;
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const source = new EventSource(url);
    source.onmessage = (e) => {
      try { onEvent(JSON.parse(e.data)); } catch { onEvent(e.data); }
    };
    source.onerror = (e) => { onError?.(e); };
    return { stop() { source.close(); } };
  }

  // ── Earnings ────────────────────────────────────────────────

  async getEarnings(period = 'month') {
    return this._fetch(`/api/earnings?period=${encodeURIComponent(period)}`);
  }

  // ── Agent Metrics ────────────────────────────────────────────

  async getAgentMetrics(agentId) {
    return this._fetch(`/api/agents/${encodeURIComponent(agentId)}/metrics`);
  }

  async getInvocationHeatmap(agentId) {
    return this._fetch(`/api/agents/${encodeURIComponent(agentId)}/heatmap`);
  }

  // ── Agent API Keys ────────────────────────────────────────────

  async createAgentKey(scopes = []) {
    return this._fetch('/api/agent-keys', {
      method: 'POST',
      body: JSON.stringify({ scopes }),
    });
  }

  async revokeAgentKey(keyId) {
    return this._fetch(`/api/agent-keys/${encodeURIComponent(keyId)}`, {
      method: 'DELETE',
    });
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
