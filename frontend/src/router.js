import { renderWaitlistPage } from './pages/waitlist.js';
import { renderThankYouPage } from './pages/thankyou.js';
import { renderLoginPage } from './pages/login.js';
import { renderVerifyPage } from './pages/verify.js';
import { renderForgotPasswordPage } from './pages/forgot-password.js';
import { renderResetPasswordPage } from './pages/reset-password.js';

function normalizeReferral(ref) {
  if (!ref) return null;
  return ref.trim();
}

export function initRouter() {
  const root = document.getElementById('root');
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  
  if (path === '/login' || path === '/signin') {
    renderLoginPage(root);
    return;
  }

  if (path === '/verify' || path === '/verification') {
    const email = params.get('email') || '';
    renderVerifyPage(root, email);
    return;
  }

  if (path === '/forgot-password') {
    renderForgotPasswordPage(root);
    return;
  }

  if (path === '/reset-password') {
    renderResetPasswordPage(root, {
      email: params.get('email') || '',
      token: params.get('token') || '',
      resetId: params.get('resetId') || '',
    });
    return;
  }

  if (path === '/dashboard' || path === '/thankyou' || path === '/thank-you') {
    const ref = normalizeReferral(params.get('ref'));
    renderThankYouPage(root, ref || null);
    return;
  }

  if (path === '/register') {
    const referral = normalizeReferral(params.get('ref'));
    renderWaitlistPage(root, referral);
    return;
  }

  // default: root acts as register page but keeps compatibility with old links
  const fallbackReferral = normalizeReferral(params.get('ref'));
  renderWaitlistPage(root, fallbackReferral);
}

// Handle browser back/forward
window.addEventListener('popstate', () => {
  initRouter();
});

// Handle link clicks for client-side navigation (set up once)
if (!window.routerInitialized) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href')?.startsWith('/')) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
        e.preventDefault();
        window.history.pushState({}, '', href);
        initRouter();
      }
    }
  });
  window.routerInitialized = true;
}

