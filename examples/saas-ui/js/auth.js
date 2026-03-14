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
    // Capture URL state immediately — before any async ops (clerk.load clears the hash).
    const _initPathname = window.location.pathname;
    const _initHash = window.location.hash;
    const _initSearch = window.location.search;

    // Priority 1: inline window.__CLERK_KEY set by index.html <script> tag
    // Priority 2: fetch from /api/config serverless function
    // Priority 3: fall through to mock mode
    let publishableKey = window.__CLERK_KEY ?? null;

    if (!publishableKey) {
      try {
        const res = await fetch(this.api.baseUrl + '/api/config');
        if (res.ok) {
          const data = await res.json();
          publishableKey = data?.data?.clerkPublishableKey ?? null;
        }
      } catch {
        // Server unavailable — fall through to mock mode
      }
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

      // Dark appearance matching the SaaS UI design system
      const _clerkAppearance = {
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#0f0f23',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8',
          colorInputBackground: '#1e1e3f',
          colorInputText: '#e2e8f0',
          colorDanger: '#f87171',
          borderRadius: '0.75rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        elements: {
          card: 'bg-transparent shadow-none border border-white/10',
          formButtonPrimary: 'bg-indigo-500 hover:bg-indigo-600',
          footerActionLink: 'text-indigo-400 hover:text-indigo-300',
          socialButtonsBlockButton: 'border-white/10 bg-white/5 hover:bg-white/10 text-white',
        },
      };

      await clerk.load({ publishableKey, appearance: _clerkAppearance });
      this._clerk = clerk;
      this._appearance = _clerkAppearance;

      // Listen for session changes.
      // session === undefined means Clerk is still initialising — ignore it entirely.
      // session === null  means the user is signed out.
      // session === object means the user is signed in.
      clerk.addListener(({ session, user }) => {
        if (session === undefined) return; // still loading — do not touch state
        if (session !== null && user !== null) {
          const authUser = {
            email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? '',
            name: user.fullName ?? user.firstName ?? '',
            avatar: (user.fullName ?? user.firstName ?? 'U')[0].toUpperCase(),
            userId: user.id,
          };
          this.store.set('user', authUser);
          this.store.set('tier', user.publicMetadata?.tier || 'free');
          // Pipe Clerk session token to API client
          session.getToken().then(token => {
            if (token) this.api.setToken(token);
          });
          this._notifyChange(authUser);
        } else {
          // session === null: explicitly signed out
          this.api.setToken(null);
          this.store.set('user', null);
          this.store.set('tier', 'free');
          this._notifyChange(null);
        }
      });

      // Handle SSO callback — Clerk uses either path-based (/sso-callback)
      // or hash-based (/#/sso-callback?after_sign_in_url=...) depending on how
      // the OAuth flow was initiated (embedded modal vs Account Portal).
      // IMPORTANT: use _initHash/_initPathname captured before clerk.load()
      // because clerk.load() clears the hash before our code can read it.
      const _isClerkCallback = (
        _initPathname === '/sso-callback' ||
        _initHash.includes('sso-callback') ||
        _initHash.includes('after_sign_in_url') ||
        _initSearch.includes('__clerk_status') ||
        _initSearch.includes('after_sign_in_url')
      );

      console.log('[Clerk] _isClerkCallback:', _isClerkCallback, { _initPathname, _initHash: _initHash.slice(0, 80) });

      if (_isClerkCallback) {
        try {
          console.log('[Clerk] calling handleRedirectCallback...');
          await clerk.handleRedirectCallback();
          console.log('[Clerk] handleRedirectCallback done, user:', clerk.user?.id ?? null);
          // Persist user to store before navigating so restoreAuthSession finds it immediately.
          if (clerk.user) {
            const u = clerk.user;
            this.store.set('user', {
              email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses?.[0]?.emailAddress ?? '',
              name: u.fullName ?? u.firstName ?? '',
              avatar: (u.fullName ?? u.firstName ?? 'U')[0].toUpperCase(),
              userId: u.id,
            });
            this.store.set('tier', u.publicMetadata?.tier || 'free');
          }
          // handleRedirectCallback navigates to after_sign_in_url on success.
          // If still here (no navigation happened), go home.
          window.location.replace('/');
        } catch (err) {
          console.error('[Clerk] handleRedirectCallback failed:', err);
          window.location.replace('/');
        }
        return;
      }

    } catch {
      // Clerk failed to load — fall back to mock mode
      this._restoreSession();
    }
  }

  _loadClerkScript(publishableKey) {
    return new Promise((resolve, reject) => {
      // Derive FAPI hostname from publishable key.
      // Format: pk_test_<base64(fapiHost + "$")> or pk_live_<base64(fapiHost + "$")>
      // The third "_"-separated segment is standard base64 (not base64url) of the hostname + "$".
      const parts = publishableKey.split('_');
      let fapiHost = '';
      if (parts.length >= 3) {
        try {
          fapiHost = atob(parts[2]).replace(/\$$/, '').trim();
        } catch {
          // ignore decode errors
        }
      }

      const _appendScript = (src, onLoad, onError) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.async = true;
        script.setAttribute('data-clerk-publishable-key', publishableKey);
        script.onload = onLoad;
        script.onerror = onError;
        document.head.appendChild(script);
      };

      if (fapiHost) {
        // Primary: load from Frontend API hostname (Clerk's recommended approach)
        _appendScript(
          `https://${fapiHost}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`,
          resolve,
          () => {
            // Fallback to jsdelivr CDN if FAPI load fails
            _appendScript(
              'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
              resolve,
              reject,
            );
          },
        );
      } else {
        // No FAPI derived — go straight to CDN
        _appendScript(
          'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
          resolve,
          reject,
        );
      }
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
      const redirectBack = window.location.href;
      const opts = {
        afterSignInUrl: redirectBack,
        afterSignUpUrl: redirectBack,
        fallbackRedirectUrl: redirectBack,
        appearance: this._appearance,
      };
      if (mountEl) {
        this._clerk.mountSignIn(mountEl, opts);
      } else {
        this._clerk.openSignIn(opts);
      }
    } else {
      this._mockLogin('email');
    }
  }

  async openSignUp(mountEl) {
    await this._ready;
    if (this._clerk) {
      const redirectBack = window.location.href;
      const opts = {
        afterSignInUrl: redirectBack,
        afterSignUpUrl: redirectBack,
        fallbackRedirectUrl: redirectBack,
        appearance: this._appearance,
      };
      if (mountEl) {
        this._clerk.mountSignUp(mountEl, opts);
      } else {
        this._clerk.openSignUp(opts);
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

  // ── Social provider login (direct redirect via Clerk OAuth) ─────

  /**
   * Directly redirect to a specific OAuth provider.
   * strategy: 'oauth_google' | 'oauth_github' | 'oauth_apple' | 'oauth_microsoft'
   * Falls back to generic sign-in modal if authenticateWithRedirect is unavailable.
   */
  async loginWithProvider(strategy) {
    await this._ready;
    if (!this._clerk) return this._mockLogin(strategy.replace('oauth_', ''));

    const redirectBack = window.location.href;
    try {
      const signIn = this._clerk.client?.signIn;
      if (signIn?.authenticateWithRedirect) {
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: redirectBack,
        });
      } else {
        this._clerk.openSignIn({ afterSignInUrl: redirectBack, afterSignUpUrl: redirectBack });
      }
    } catch {
      this._clerk.openSignIn({ afterSignInUrl: redirectBack, afterSignUpUrl: redirectBack });
    }
  }

  // ── Legacy OAuth flows (kept for backward compat, delegate to Clerk) ─

  async loginWithGoogle() {
    await this._ready;
    if (this._clerk) {
      return this.loginWithProvider('oauth_google');
    }
    return this._mockLogin('google');
  }

  async loginWithGithub() {
    await this._ready;
    if (this._clerk) {
      return this.loginWithProvider('oauth_github');
    }
    return this._mockLogin('github');
  }

  async loginWithApple() {
    await this._ready;
    if (this._clerk) {
      return this.loginWithProvider('oauth_apple');
    }
    return this._mockLogin('apple');
  }

  async loginWithMicrosoft() {
    await this._ready;
    if (this._clerk) {
      return this.loginWithProvider('oauth_microsoft');
    }
    return this._mockLogin('microsoft');
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
