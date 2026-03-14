/**
 * AppStore — reactive state management with localStorage persistence.
 * Simple pub/sub pattern for UI updates.
 */

const STORAGE_KEY = 'agents-cli-store';

export class AppStore {
  constructor() {
    this.state = {
      user: null,
      tier: 'free',
      catalog: [],
      installed: [],
      searchQuery: '',
      searchFilters: { productType: 'all', pricingModel: 'all', sort: 'relevance', minRating: 0, minQuality: 0 },
      currentProduct: null,
      currentPane: 'discover',
      usage: null,
      serverStatus: null,
      jobs: [],
      earnings: null,
      agentKeys: [],
      activeAgent: null,
      invocationFeed: [],
      agentMetrics: {},
      monthlyInstalls: { count: 0, month: new Date().toISOString().slice(0, 7) },
    };
    this._listeners = new Map();
    this.restore();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const old = this.state[key];
    this.state[key] = value;
    this._notify(key, value, old);
    this._autoPersist(key);
  }

  update(key, fn) {
    this.set(key, fn(this.state[key]));
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key)?.delete(callback);
  }

  _notify(key, value, old) {
    const listeners = this._listeners.get(key);
    if (listeners) listeners.forEach(fn => fn(value, old));
    // Also notify wildcard listeners
    const wildcards = this._listeners.get('*');
    if (wildcards) wildcards.forEach(fn => fn(key, value, old));
  }

  // Persist only certain keys to localStorage
  _autoPersist(key) {
    // searchFilters intentionally excluded — session-only state, stale filters break the UI
    const persistKeys = ['user', 'tier', 'installed', 'earnings', 'agentKeys', 'monthlyInstalls'];
    if (persistKeys.includes(key)) this.persist();
  }

  persist() {
    try {
      const data = {
        user: this.state.user,
        tier: this.state.tier,
        installed: this.state.installed,
        searchFilters: this.state.searchFilters,
        earnings: this.state.earnings,
        agentKeys: this.state.agentKeys,
        monthlyInstalls: this.state.monthlyInstalls,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded or private browsing */ }
  }

  restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.user) this.state.user = data.user;
      if (data.tier) this.state.tier = data.tier;
      if (data.installed) this.state.installed = data.installed;
      if (data.searchFilters) this.state.searchFilters = { ...this.state.searchFilters, ...data.searchFilters };
      if (data.earnings) this.state.earnings = data.earnings;
      if (data.agentKeys) this.state.agentKeys = data.agentKeys;
      if (data.monthlyInstalls) this.state.monthlyInstalls = data.monthlyInstalls;
    } catch { /* corrupted data */ }
  }

  pushInvocationEvent(event) {
    const feed = [...(this.state.invocationFeed || []), event];
    // Keep max 50 events
    this.set('invocationFeed', feed.slice(-50));
  }

  setAgentMetric(agentId, metrics) {
    this.set('agentMetrics', { ...this.state.agentMetrics, [agentId]: metrics });
  }

  isInstalled(productId) {
    return this.state.installed.includes(productId);
  }

  install(productId) {
    if (!this.isInstalled(productId)) {
      this.update('installed', list => [...list, productId]);
    }
  }

  uninstall(productId) {
    this.update('installed', list => list.filter(id => id !== productId));
  }

  getMonthlyInstallCount() {
    const current = this.state.monthlyInstalls;
    const now = new Date().toISOString().slice(0, 7);
    if (current.month !== now) {
      this.set('monthlyInstalls', { count: 0, month: now });
      return 0;
    }
    return current.count;
  }

  incrementInstallCount() {
    const now = new Date().toISOString().slice(0, 7);
    const current = this.state.monthlyInstalls;
    if (current.month !== now) {
      this.set('monthlyInstalls', { count: 1, month: now });
    } else {
      this.set('monthlyInstalls', { count: current.count + 1, month: now });
    }
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    this.state.user = null;
    this.state.tier = 'free';
    this.state.installed = [];
    this._notify('user', null);
    this._notify('tier', 'free');
  }
}
