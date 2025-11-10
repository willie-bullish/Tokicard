const TOAST_ID = 'tokicard-toast';
let toastTimer = null;

export function showToast(message, { duration = 2500 } = {}) {
  if (!message) {
    return;
  }

  let toast = document.getElementById(TOAST_ID);

  if (!toast) {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className =
      'fixed inset-x-0 bottom-6 flex justify-center px-4 pointer-events-none z-[9999] transition-opacity duration-200 ease-out';

    const content = document.createElement('div');
    content.className =
      'inline-flex items-center gap-2 bg-black text-white text-[13px] sm:text-[14px] font-medium rounded-full px-4 py-2 shadow-lg pointer-events-auto';
    content.dataset.toastContent = 'true';
    toast.appendChild(content);

    document.body.appendChild(toast);
  }

  const content = toast.querySelector('[data-toast-content]');
  if (content) {
    content.textContent = message;
  }

  toast.style.opacity = '0';
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toastTimer = null;
  }, duration);
}

