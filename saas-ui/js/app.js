/**
 * Agents-CLI SaaS Platform — Main bootstrap, router, global event handlers.
 * Imports all modules and wires them together.
 */

import { AgentsApi } from './api.js';
import { AppStore } from './store.js';
import { AuthManager } from './auth.js';
import { initMarketplace } from './marketplace.js';
import { initProductDetail, showToast } from './product-detail.js';
import { initDashboard } from './dashboard.js';
import { initForgeUi } from './forge-ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ── Initialize core modules ─────────────────────────────────────

  const api = new AgentsApi();
  const store = new AppStore();
  const auth = new AuthManager(api, store);

  // ── Product detail (must init before marketplace) ───────────────

  const productDetail = initProductDetail(api, store, auth);
  const showProductDetail = (id) => productDetail.show(id);

  // ── Marketplace ─────────────────────────────────────────────────

  const marketplace = initMarketplace(api, store, showProductDetail);

  // ── Dashboard ───────────────────────────────────────────────────

  const dashboard = initDashboard(api, store, auth);

  // ── Forge UI ────────────────────────────────────────────────────

  initForgeUi(api, store, auth);

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

  // Logout Logic
  document.addEventListener('click', (e) => {
      const logoutBtn = e.target.closest('#logoutBtn');
      if (logoutBtn) {
          sessionStorage.removeItem('is_authenticated');
          window.location.reload();
      }
  });

  // Restore Session on Load
  const restoreAuthSession = () => {
      if (sessionStorage.getItem('is_authenticated') === 'true') {
          updateAuthenticatedUI();
      }
  };

  // ── Auth Modals Logic ───────────────────────────────────────────
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const stripeModal = document.getElementById('stripeModal');
  
  // Login Buttons
  document.querySelectorAll('.btn-ghost').forEach(btn => {
      if(btn.textContent.includes('Log In')) {
          btn.addEventListener('click', () => {
              loginModal?.classList.add('active');
          });
      }
  });

  // Signup / Get Started Buttons
  document.querySelectorAll('.btn-primary, .btn-secondary, .btn-gradient').forEach(btn => {
      if(btn.textContent.includes('Get Started') || 
         btn.textContent.includes('Subscribe') || 
         btn.textContent.includes('Trial') ||
         btn.textContent.includes('Build your first Agent')) {
          btn.addEventListener('click', (e) => {
              e.preventDefault();
              signupModal?.classList.add('active');
          });
      }
  });
  
  const btnGradient = document.querySelector('.btn-gradient');
  if (btnGradient) {
      btnGradient.addEventListener('click', () => {
          signupModal?.classList.add('active');
      });
  }

  // Advanced Auth & Stripe Simulation
  const authSubmitBtns = document.querySelectorAll('.auth-submit');
  const paymentLoader = document.getElementById('payment-loader');
  const paymentSuccess = document.getElementById('payment-success');

  const updateAuthenticatedUI = () => {
      const isExtensionInstalled = localStorage.getItem('agent_cli_extension') === 'true';
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
          navActions.innerHTML = `
              <div class="extension-status ${isExtensionInstalled ? 'connected' : 'disconnected'}">
                  <span class="status-indicator"></span> 
                  Ext: ${isExtensionInstalled ? 'Active' : 'Missing'}
              </div>
              <a href="#marketplace" class="user-profile" style="text-decoration:none;">
                  <span class="user-name">Cedric</span>
                  <div class="user-avatar">C</div>
              </a>
          `;
      }
  };

  authSubmitBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<span class="pulse-dot" style="display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; background:white; animation: pulse 1s infinite;"></span> Authenticating...';
          btn.disabled = true;

          setTimeout(() => {
              document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
              btn.innerHTML = originalHTML;
              btn.disabled = false;

              // If Signup flow, transition to Stripe
              if (btn.closest('#signupModal')) {
                  setTimeout(() => {
                      if (stripeModal) {
                          stripeModal.classList.add('active');
                          if (paymentLoader && paymentSuccess) {
                              paymentLoader.style.display = 'block';
                              paymentSuccess.style.display = 'none';

                              setTimeout(() => {
                                  paymentLoader.style.display = 'none';
                                  paymentSuccess.style.display = 'block';
                                  sessionStorage.setItem('is_authenticated', 'true');
                              }, 2500);
                          }
                      }
                  }, 400);
              } else {
                  // Login flow
                  sessionStorage.setItem('is_authenticated', 'true');
                  updateAuthenticatedUI();
              }
          }, 1200);
      });
  });
  
  // Finish Stripe Flow
  const checkoutDone = document.querySelector('.checkout-done');
  if (checkoutDone) {
       checkoutDone.addEventListener('click', () => {
            stripeModal?.classList.remove('active');
            updateAuthenticatedUI();
            const target = document.getElementById('marketplace');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
       });
  }

  restoreAuthSession();

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

  // ── Chrome Extension Simulation ───────────────────────────────
  const installExtensionBtn = document.getElementById('installExtensionBtn');
  if (installExtensionBtn) {
      installExtensionBtn.addEventListener('click', () => {
          installExtensionBtn.disabled = true;
          installExtensionBtn.innerHTML = '<span class="pulse-dot"></span> Installing Extension...';
          
          setTimeout(() => {
              localStorage.setItem('agent_cli_extension', 'true');
              installExtensionBtn.textContent = 'Extension Installed';
              installExtensionBtn.className = 'btn btn-secondary mt-4';
              
              // Update navigation status if logged in
              if (sessionStorage.getItem('is_authenticated') === 'true') {
                  updateAuthenticatedUI();
              }
          }, 2000);
      });
  }
});
