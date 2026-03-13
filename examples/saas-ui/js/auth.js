/**
 * AuthManager — Clerk-based auth via CDN window.Clerk.
 *
 * Loads Clerk dynamically from the publishable key returned by /api/config.
 * Exposes the same surface as the old AuthManager so other modules need no changes.
 */

export class AuthManager {
  constructor(api, store) {
    this.api = api;
    this.store = store;
    this._callbacks = [];
    this._clerk = null;
    this._ready = this._init();
  }

  // ── Init ────────────────────────────────────────────────────────

  async _init() {
    // Fetch publishable key from server
    let publishableKey = null;
    try {
      const res = await fetch(this.api.baseUrl + '/api/config');
      if (res.ok) {
        const data = await res.json();
        publishableKey = data?.data?.clerkPublishableKey ?? null;
      }
    } catch {
      // Server unavailable — fall through to mock mode
    }

    if (!publishableKey) {
      // No Clerk config — run in mock/standalone mode
      this._restoreSession();
      return;
    }

    // Dynamically load Clerk JS from CDN
    try {
      await this._loadClerkScript(publishableKey);
      const clerk = window.Clerk;
      if (!clerk) throw new Error('Clerk not loaded');

      await clerk.load({ publishableKey });
      this._clerk = clerk;

      // Listen for session changes
      clerk.addListener(({ session, user }) => {
        if (session && user) {
          const authUser = {
            email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? '',
            name: user.fullName ?? user.firstName ?? '',
            avatar: (user.fullName ?? user.firstName ?? 'U')[0].toUpperCase(),
            userId: user.id,
          };
          this.store.set('user', authUser);
          this.store.set('tier', 'pro');
          // Pipe Clerk session token to API client
          session.getToken().then(token => {
            if (token) this.api.setToken(token);
          });
          this._notifyChange(authUser);
        } else {
          this.api.setToken(null);
          this.store.set('user', null);
          this.store.set('tier', 'free');
          this._notifyChange(null);
        }
      });

      // Restore existing session immediately if signed in
      if (clerk.session) {
        const user = clerk.user;
        if (user) {
          const authUser = {
            email: user.primaryEmailAddress?.emailAddress ?? '',
            name: user.fullName ?? user.firstName ?? '',
            avatar: (user.fullName ?? user.firstName ?? 'U')[0].toUpperCase(),
            userId: user.id,
          };
          this.store.set('user', authUser);
          const token = await clerk.session.getToken();
          if (token) this.api.setToken(token);
          this._notifyChange(authUser);
        }
      }
    } catch {
      // Clerk failed to load — fall back to mock mode
      this._restoreSession();
    }
  }

  _loadClerkScript(publishableKey) {
    return new Promise((resolve, reject) => {
      // Derive frontend API host from publishable key
      // pk_test_abc123 → base64 decode the third segment
      const parts = publishableKey.split('_');
      let frontendApiHost = '';
      if (parts.length >= 3) {
        try {
          // The third part is base64url-encoded frontend API host
          const decoded = atob(parts[2].replace(/-/g, '+').replace(/_/g, '/'));
          frontendApiHost = decoded.replace(/\0/g, '').replace(/\/$/, '');
        } catch {
          // ignore decode errors
        }
      }

      if (!frontendApiHost) {
        // Fallback: use Clerk CDN with clerk-js package directly
        frontendApiHost = 'https://cdn.jsdelivr.net';
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-clerk-publishable-key', publishableKey);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
        return;
      }

      const clerkUrl = `${frontendApiHost}/npm/@clerk/clerk-js@latest/dist/clerk.browser.js`;
      const script = document.createElement('script');
      script.src = clerkUrl;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-clerk-publishable-key', publishableKey);
      script.onload = resolve;
      script.onerror = () => {
        // Fallback to jsdelivr CDN
        const fallback = document.createElement('script');
        fallback.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
        fallback.crossOrigin = 'anonymous';
        fallback.setAttribute('data-clerk-publishable-key', publishableKey);
        fallback.onload = resolve;
        fallback.onerror = reject;
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
  }

  _restoreSession() {
    const user = this.store.get('user');
    if (user?.token) {
      this.api.setToken(user.token);
    }
  }

  // ── Public API ──────────────────────────────────────────────────

  isLoggedIn() {
    if (this._clerk) return !!this._clerk.session;
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

  // ── Sign in / Sign up (Clerk modal) ─────────────────────────────

  async openSignIn(mountEl) {
    await this._ready;
    if (this._clerk) {
      if (mountEl) {
        this._clerk.mountSignIn(mountEl);
      } else {
        this._clerk.openSignIn({});
      }
    } else {
      this._mockLogin('email');
    }
  }

  async openSignUp(mountEl) {
    await this._ready;
    if (this._clerk) {
      if (mountEl) {
        this._clerk.mountSignUp(mountEl);
      } else {
        this._clerk.openSignUp({});
      }
    } else {
      this._mockLogin('email');
    }
  }

  async signOut() {
    await this._ready;
    if (this._clerk) {
      await this._clerk.signOut();
    } else {
      this.api.setToken(null);
      this.store.set('user', null);
      this.store.set('tier', 'free');
      this._notifyChange(null);
    }
  }

  // ── Legacy OAuth flows (kept for backward compat, delegate to Clerk) ─

  async loginWithGoogle() {
    await this._ready;
    if (this._clerk) {
      this._clerk.openSignIn({ redirectUrl: window.location.href });
    } else {
      return this._mockLogin('google');
    }
  }

  async loginWithGithub() {
    await this._ready;
    if (this._clerk) {
      this._clerk.openSignIn({ redirectUrl: window.location.href });
    } else {
      return this._mockLogin('github');
    }
  }

  async loginWithEmail(email, _password) {
    await this._ready;
    if (this._clerk) {
      this._clerk.openSignIn({ identifier: email });
    } else {
      return this._mockLogin('email', email);
    }
  }

  async signupWithEmail(email, _password) {
    await this._ready;
    if (this._clerk) {
      this._clerk.openSignUp({});
    } else {
      return this._mockLogin('email', email);
    }
  }

  // ── Mock Auth (standalone / no Clerk config) ────────────────────

  _mockLogin(provider, email) {
    const mockEmail = email || `user@${provider}.example`;
    const user = {
      email: mockEmail,
      name: mockEmail.split('@')[0],
      avatar: mockEmail[0].toUpperCase(),
      provider,
      token: 'mock-token-' + Date.now(),
    };
    this.api.setToken(user.token);
    this.store.set('user', user);
    this.store.set('tier', 'free');
    this._notifyChange(user);
    return user;
  }

  // ── Logout (public alias) ────────────────────────────────────────

  logout() {
    this.signOut();
  }

  // ── Checkout ─────────────────────────────────────────────────────

  async checkout(priceId) {
    try {
      const res = await this.api.billingCheckout(priceId);
      const url = res.data?.url ?? res?.url;
      if (url) window.open(url, '_blank');
      return { url };
    } catch {
      return { url: null, mock: true };
    }
  }
}
