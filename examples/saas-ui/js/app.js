/**
 * Agents-CLI SaaS Platform — Main bootstrap, router, global event handlers.
 * Imports all modules and wires them together.
 */

import { AgentsApi } from './api.js';
import { AppStore } from './store.js';
import { AuthManager } from './auth.js';
import { initMarketplace } from './marketplace.js';
import { initProductDetail, showToast } from './product-detail.js';
import { initForgeUi } from './forge-ui.js';
import { initRegistries } from './registries.js';
import { initProfile } from './profile.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ── Initialize core modules ─────────────────────────────────────

  const api = new AgentsApi();
  const store = new AppStore();
  const auth = new AuthManager(api, store);

  // ── Product detail (must init before marketplace) ───────────────

  const productDetail = initProductDetail(api, store, auth);
  const showProductDetail = (id) => productDetail.show(id);

  // ── Marketplace ─────────────────────────────────────────────────

  const marketplace = initMarketplace(api, store, showProductDetail, auth);

  // ── Forge UI ────────────────────────────────────────────────────

  initForgeUi(api, store, auth);

  // ── Registries (auto-connect: GitHub, npm, PyPI, crates, cli-anything) ──

  initRegistries(api, store);

  // ── Profile & Settings ──────────────────────────────────────────

  initProfile(api, store);

  // ── Ambient Blob Animation ──────────────────────────────────────

  const blobs = document.querySelectorAll('.blob');
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    if (blobs[0]) blobs[0].style.transform = `translate(${x * 30}px, ${y * 30}px) scale(1.05)`;
    if (blobs[1]) blobs[1].style.transform = `translate(${x * -40}px, ${y * -40}px) scale(1.1)`;
    if (blobs[2]) blobs[2].style.transform = `translate(${x * 20}px, ${y * -20}px)`;
    document.querySelectorAll('.pricing-card, .feature-card, .plugin-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  // ── Pricing Billing Toggle ──────────────────────────────────────

  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const amountEls = document.querySelectorAll('.amount');
  let currentBilling = 'monthly';

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cycle = btn.dataset.billing;
      if (cycle === currentBilling) return;
      currentBilling = cycle;
      toggleBtns.forEach(b => b.classList.toggle('active', b.dataset.billing === cycle));
      amountEls.forEach(el => {
        if (el.textContent === '0') return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          el.textContent = el.dataset[cycle];
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 150);
      });
    });
  });

  // ── Smooth Scrolling ────────────────────────────────────────────

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Reveal on scroll ───────────────────────────────────────────

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.glass-card').forEach(card => {
    // Skip fixed overlay panels — they use their own transform for slide-in/out
    if (card.id === 'productDetailPanel') return;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out, box-shadow 0.2s';
    observer.observe(card);
  });

  // ── Sidebar pane switching ──────────────────────────────────────

  // Marketplace Panes
  const dashboardSidebarItems = document.querySelectorAll('.dashboard-sidebar .sidebar-item');
  const dashboardPanes = document.querySelectorAll('.dashboard-content .pane');
  
  // Use document-level delegation to be absolutely sure the click is caught
  document.addEventListener('click', (e) => {
      const sidebarItem = e.target.closest('.sidebar-item');
      if (sidebarItem && sidebarItem.closest('.dashboard-sidebar')) {
          const paneId = sidebarItem.dataset.pane;
          if (!paneId) return;
          
          dashboardSidebarItems.forEach(i => i.classList.remove('active'));
          dashboardPanes.forEach(p => p.classList.remove('active'));
          
          sidebarItem.classList.add('active');
          const target = document.getElementById('pane-' + paneId);
          if (target) {
              target.classList.add('active');
          }
      }
  });

  // Docs Panes
  const docLinks = document.querySelectorAll('.doc-link');
  const docPanes = document.querySelectorAll('.doc-pane');
  
  document.addEventListener('click', (e) => {
      const docLink = e.target.closest('.doc-link');
      if (docLink) {
          const docId = docLink.dataset.doc;
          if (!docId) return;
          
          docLinks.forEach(i => i.classList.remove('active'));
          docPanes.forEach(p => p.classList.remove('active'));
          
          docLink.classList.add('active');
          const target = document.getElementById('doc-' + docId);
          if (target) {
              target.classList.add('active');
          }
      }
  });

  // ── Nav state ──────────────────────────────────────────────────

  const statusEl = document.querySelector('.extension-status');
  const loginBtn = document.getElementById('loginBtn');
  const getStartedBtn = document.getElementById('getStartedBtn');
  const userProfileEl = document.getElementById('userProfile');
  const userDisplayName = document.getElementById('userDisplayName');
  const userAvatarEl = document.getElementById('userAvatar');
  const logoutBtn = document.getElementById('logoutBtn');

  const updateNavState = (user, serverOk = false) => {
    if (statusEl) {
      statusEl.className = `extension-status ${serverOk ? 'connected' : 'disconnected'}`;
      statusEl.innerHTML = `<span class="status-indicator"></span>${serverOk ? 'Server: Active' : 'Server: Offline'}`;
    }
    const loggedIn = !!user;
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink) adminLink.style.display = loggedIn ? '' : 'none';
    if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : '';
    if (getStartedBtn) getStartedBtn.style.display = loggedIn ? 'none' : '';
    if (userProfileEl) {
      userProfileEl.style.display = loggedIn ? 'flex' : 'none';
      if (loggedIn && user) {
        const name = user.name || user.email || 'User';
        if (userDisplayName) userDisplayName.textContent = name;
        if (userAvatarEl) userAvatarEl.textContent = name[0].toUpperCase();
      }
    }
    if (logoutBtn) logoutBtn.style.display = loggedIn ? '' : 'none';
  };

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => auth.signOut());
  }

  // ── Auth Modals Logic ───────────────────────────────────────────

  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');

  const _closeModals = () => document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

  // Open login modal and mount Clerk SignIn
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      loginModal?.classList.add('active');
      const mountEl = document.getElementById('clerk-sign-in');
      if (mountEl) await auth.openSignIn(mountEl);
    });
  }

  // Open signup modal and mount Clerk SignUp
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', async () => {
      signupModal?.classList.add('active');
      const mountEl = document.getElementById('clerk-sign-up');
      if (mountEl) await auth.openSignUp(mountEl);
    });
  }

  // Signup / Get Started Buttons in hero section (skip pricing buttons with checkout wiring)
  document.querySelectorAll('.btn-primary, .btn-secondary, .btn-gradient').forEach(btn => {
    if (btn.id === 'getStartedBtn') return; // already handled
    if (btn.id === 'proPricingBtn' || btn.id === 'enterprisePricingBtn') return; // handled below
    if (btn.dataset.priceId) return; // skip all pricing buttons with Stripe links
    const text = btn.textContent.trim();
    if (text.includes('Get Started') || text.includes('Build Your First Agent')) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        signupModal?.classList.add('active');
        const mountEl = document.getElementById('clerk-sign-up');
        if (mountEl) await auth.openSignUp(mountEl);
      });
    }
  });

  // ── Pricing checkout buttons (Pro & Enterprise via API) ──────────

  const handleCheckout = async (priceId) => {
    try {
      const origin = window.location.origin;
      const headers = { 'Content-Type': 'application/json' };
      if (api.token) headers['Authorization'] = `Bearer ${api.token}`;
      const resp = await fetch(api.baseUrl + '/api/billing/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          priceId,
          successUrl: origin + '/?checkout=success',
          cancelUrl: origin + '/',
        }),
      });
      const json = await resp.json().catch(() => null);
      if (json?.data?.url) {
        window.location.href = json.data.url;
      } else {
        const detail = json?.error || json?.data?.message || `HTTP ${resp.status}`;
        console.error('[checkout] server response:', json || resp.status);
        showToast(`Checkout failed: ${detail}`);
      }
    } catch (err) {
      console.error('[checkout] error:', err);
      showToast(`Checkout error: ${err.message || 'network failure'}`);
    }
  };

  document.getElementById('starterPricingBtn')?.addEventListener('click', () => handleCheckout('price_1TAumR2QpzdUwTFgUWWQsbTe'));
  document.getElementById('proPricingBtn')?.addEventListener('click', () => handleCheckout('price_1TAumW2QpzdUwTFgMyJIn89A'));
  document.getElementById('enterprisePricingBtn')?.addEventListener('click', () => handleCheckout('price_1TAumX2QpzdUwTFgDDWYS4V8'));

  // Auth state changes close modals and update nav
  auth.onAuthChange((user) => {
    if (user) _closeModals();
    updateNavState(user, lastServerOk);
  });

  // Handle ?checkout=success query param (Stripe redirect back)
  if (new URLSearchParams(window.location.search).get('checkout') === 'success') {
    setTimeout(() => showToast('Payment successful — your plan is now active!', 'success'), 800);
    // Clean up URL
    history.replaceState({}, '', window.location.pathname);
  }

  // ── Restore session + server health ────────────────────────────

  let lastServerOk = false;
  const restoreAuthSession = async () => {
    try {
      const res = await fetch(api.baseUrl + '/api/health');
      lastServerOk = res.ok;
    } catch { lastServerOk = false; }
    updateNavState(auth.getUser(), lastServerOk);
  };

  restoreAuthSession();

  // ── Tier-based upsell visibility ────────────────────────────────

  const setUpsellVisibility = (tier) => {
    const banner = document.getElementById('tierUpsellBanner');
    const valueSection = document.getElementById('valueComparisonSection');
    const isFree = !tier || tier === 'free';
    if (banner) banner.style.display = isFree ? '' : 'none';
    if (valueSection) valueSection.style.display = isFree ? '' : 'none';
  };

  store.subscribe('tier', (tier) => setUpsellVisibility(tier));
  setUpsellVisibility(store.get('tier'));

  // ── General Modal Close ───────────────────────────────────────────
  const closeBtns = document.querySelectorAll('.close-modal');
  closeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.target.closest('.modal-overlay')?.classList.remove('active');
      });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
              overlay.classList.remove('active');
          }
      });
  });

  // ── Installer Modal ─────────────────────────────────────────────
  const installerModal = document.getElementById('installerModal');
  const installBtns = document.querySelectorAll('.plugin-footer .btn:not(.shine)');
  const startInstallBtn = document.getElementById('startInstallBtn');
  const installTerminalBody = document.getElementById('installTerminal');
  const steps = document.querySelectorAll('.progress-step');
  let currentInstallBtn = null;

  installBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          currentInstallBtn = e.target;
          installerModal?.classList.add('active');
          if (steps.length > 0) {
              steps.forEach(s => s.classList.remove('active', 'done'));
              steps[0].classList.add('active');
          }
          if (installTerminalBody) installTerminalBody.innerHTML = '<p class="info">➜ Ready to initialize installation pipeline...</p>';
          if (startInstallBtn) {
              startInstallBtn.textContent = 'Confirm Installation';
              startInstallBtn.disabled = false;
              startInstallBtn.className = 'btn btn-secondary btn-block';
          }
      });
  });

  if (startInstallBtn) {
      startInstallBtn.addEventListener('click', () => {
          startInstallBtn.disabled = true;
          startInstallBtn.textContent = 'Installing...';
          
          let logIndex = 0;
          const logs = [
              '<p><span class="prompt">$</span> agents-cli add pypi:plugin-package</p>',
              '<p class="info">➜ Resolving package from PyPI...</p>',
              '<p class="success">✓ Downloaded & extracted successfully.</p>',
              '<p><span class="prompt">$</span> skill-forge --tool pypi:plugin-package --full</p>',
              '<p class="info">➜ Probing schema (depth 3)...</p>',
              '<p class="info">➜ Generating Claude Code hooks...</p>',
              '<p class="success">✓ SKILL.md and CLAUDE.md generated.</p>',
              '<p><span class="prompt">$</span> agents-cli mcp start</p>',
              '<p class="success">✓ Plugin exposed to local MCP bridge.</p>'
          ];

          if (installTerminalBody) installTerminalBody.innerHTML = '';
          
          const interval = setInterval(() => {
              if (logIndex < logs.length) {
                  if (installTerminalBody) installTerminalBody.innerHTML += logs[logIndex];
                  
                  if (logIndex === 3 && steps.length > 1) {
                      steps[0].classList.replace('active', 'done');
                      steps[1].classList.add('active');
                  } else if (logIndex === 7 && steps.length > 2) {
                      steps[1].classList.replace('active', 'done');
                      steps[2].classList.add('active');
                  }
                  logIndex++;
                  if (installTerminalBody) installTerminalBody.scrollTop = installTerminalBody.scrollHeight;
              } else {
                  clearInterval(interval);
                  if (steps.length > 2) steps[2].classList.replace('active', 'done');
                  startInstallBtn.textContent = 'Installation Complete';
                  startInstallBtn.className = 'btn btn-primary btn-block shine';
                  startInstallBtn.disabled = false;
                  startInstallBtn.onclick = () => {
                      installerModal?.classList.remove('active');
                      if (currentInstallBtn) {
                          currentInstallBtn.textContent = 'Installed';
                          currentInstallBtn.className = 'btn btn-primary btn-sm shine';
                      }
                  };
              }
          }, 600);
      });
  }

  // ── Server Connection Check ─────────────────────────────────────
  const installExtensionBtn = document.getElementById('installExtensionBtn');
  if (installExtensionBtn) {
      const checkServer = async () => {
          installExtensionBtn.disabled = true;
          installExtensionBtn.innerHTML = '<span class="pulse-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:white;animation:pulse 1s infinite"></span> Checking...';
          try {
              const res = await fetch(api.baseUrl + '/api/health');
              lastServerOk = res.ok;
              if (res.ok) {
                  installExtensionBtn.textContent = 'Server Connected';
                  installExtensionBtn.className = 'btn btn-secondary mt-4';
              } else {
                  throw new Error('not ok');
              }
          } catch {
              lastServerOk = false;
              installExtensionBtn.textContent = 'Retry Connection';
              installExtensionBtn.disabled = false;
              installExtensionBtn.className = 'btn btn-ghost mt-4';
          }
          updateNavState(auth.getUser(), lastServerOk);
      };
      installExtensionBtn.addEventListener('click', checkServer);
  }

  // ── Footer Modal Links ─────────────────────────────────────────
  const footerModals = {
    footerAboutUs:  'aboutModal',
    footerPrivacy:  'privacyModal',
    footerTerms:    'termsModal',
    footerApiRef:   'apiRefModal',
    footerSkillForge: null, // scroll to marketplace
  };

  Object.entries(footerModals).forEach(([btnId, modalId]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modalId) {
        document.getElementById(modalId)?.classList.add('active');
      } else if (btnId === 'footerSkillForge') {
        document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
