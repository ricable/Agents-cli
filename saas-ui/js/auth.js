/**
 * AuthManager — OAuth flow, token storage, session management.
 * Supports Google & GitHub via backend OAuthManager PKCE flow.
 * Falls back to mock auth when server is unavailable.
 */

export class AuthManager {
  constructor(api, store) {
    this.api = api;
    this.store = store;
    this._callbacks = [];
    this._restoreSession();
  }

  _restoreSession() {
    const user = this.store.get('user');
    if (user?.token) {
      this.api.setToken(user.token);
    }
  }

  isLoggedIn() {
    return !!this.store.get('user');
  }

  getUser() {
    return this.store.get('user');
  }

  getTier() {
    return this.store.get('tier') || 'free';
  }

  onAuthChange(callback) {
    this._callbacks.push(callback);
    return () => {
      this._callbacks = this._callbacks.filter(cb => cb !== callback);
    };
  }

  _notifyChange(user) {
    this._callbacks.forEach(cb => cb(user));
  }

  // ── OAuth Flows ─────────────────────────────────────────────────

  async loginWithGoogle() {
    return this._oauthFlow('google');
  }

  async loginWithGithub() {
    return this._oauthFlow('github');
  }

  async _oauthFlow(provider) {
    const redirectUri = `${window.location.origin}/callback.html`;
    try {
      const res = await this.api.authInit(provider, redirectUri);
      const { authUrl, state, codeVerifier } = res.data || res;
      // Store PKCE state for callback
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_verifier', codeVerifier);
      sessionStorage.setItem('oauth_provider', provider);
      // Open popup or redirect
      const popup = window.open(authUrl, 'oauth', 'width=500,height=600,scrollbars=yes');
      if (!popup) {
        // Fallback: direct redirect
        window.location.href = authUrl;
      }
      return { pending: true };
    } catch {
      // Server not available — use mock auth
      return this._mockLogin(provider);
    }
  }

  async handleCallback(code, state) {
    const savedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('oauth_verifier');
    const provider = sessionStorage.getItem('oauth_provider');

    if (state !== savedState) {
      throw new Error('OAuth state mismatch — possible CSRF');
    }

    try {
      const res = await this.api.authCallback(provider, code, state, codeVerifier);
      const { token, user, tier } = res.data || res;
      this._setUser({ ...user, token }, tier);
      return user;
    } catch {
      return this._mockLogin(provider);
    } finally {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_verifier');
      sessionStorage.removeItem('oauth_provider');
    }
  }

  // ── Email/Password ──────────────────────────────────────────────

  async loginWithEmail(email, password) {
    // In production, this would hit a Supabase/auth endpoint
    // For now, mock it
    return this._mockLogin('email', email);
  }

  async signupWithEmail(email, password) {
    return this._mockLogin('email', email);
  }

  // ── Mock Auth (for demo/standalone mode) ─────────────────────────

  _mockLogin(provider, email) {
    const mockEmail = email || `user@${provider}.example`;
    const user = {
      email: mockEmail,
      name: mockEmail.split('@')[0],
      avatar: mockEmail[0].toUpperCase(),
      provider,
      token: 'mock-token-' + Date.now(),
    };
    this._setUser(user, 'free');
    return user;
  }

  _setUser(user, tier) {
    this.api.setToken(user.token);
    this.store.set('user', user);
    this.store.set('tier', tier || 'free');
    this._notifyChange(user);
  }

  // ── Logout ──────────────────────────────────────────────────────

  logout() {
    this.api.setToken(null);
    this.store.set('user', null);
    this.store.set('tier', 'free');
    this._notifyChange(null);
  }

  // ── Tier upgrade ────────────────────────────────────────────────

  async checkout(priceId) {
    try {
      const res = await this.api.billingCheckout(priceId);
      const { url } = res.data || res;
      if (url) window.open(url, '_blank');
      return { url };
    } catch {
      // Mock checkout
      return { url: null, mock: true };
    }
  }
}
