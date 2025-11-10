import { submitPasswordReset } from '../api/password.js';

export function renderResetPasswordPage(container, params = {}) {
  const email = params.email || '';
  const token = params.token || '';
  const resetId = params.resetId || '';

  if (!email || !token || !resetId) {
    container.innerHTML = `
      <div class="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
        <div class="max-w-[420px] text-center">
          <img src="/tokilogo.png" alt="Tokicard Logo" class="mx-auto mb-6" width="118">
          <h1 class="text-[26px] sm:text-[30px] font-semibold text-[#111827] mb-3">Invalid link</h1>
          <p class="text-[13px] sm:text-[14px] text-[#6B7280] mb-6">
            The password reset link is missing information or has expired. Request a new link to continue.
          </p>
          <a href="/forgot-password" class="inline-flex items-center justify-center bg-black text-white rounded-[14px] px-5 py-3 text-[14px] font-semibold hover:bg-black/90 transition-colors">
            Request new link
          </a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div class="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div class="w-full max-w-[500px] bg-white rounded-[24px] shadow-sm px-6 sm:px-8 py-8">
          <div class="text-center mb-6">
            <img src="/tokilogo.png" alt="Tokicard Logo" class="mx-auto mb-4" width="118">
            <h1 class="text-[26px] sm:text-[30px] font-semibold text-[#111827] mb-2">Set a new password</h1>
            <p class="text-[13px] sm:text-[14px] text-[#6B7280]">
              Enter a strong password you haven't used before to secure your account.
            </p>
          </div>
          <form id="reset-password-form" class="space-y-4">
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                id="new-password"
                name="password"
                placeholder="New password"
                required
                minlength="8"
                autocomplete="new-password"
                class="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-10 py-3 text-[14px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-black/10"
              >
            </div>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                placeholder="Confirm password"
                required
                minlength="8"
                autocomplete="new-password"
                class="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-10 py-3 text-[14px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-black/10"
              >
            </div>
            <p class="text-[12px] text-[#6B7280]">
              Password must be at least 8 characters long.
            </p>
            <button
              type="submit"
              id="reset-submit-btn"
              class="w-full bg-black text-white rounded-[14px] py-3 text-[14px] font-semibold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span id="reset-submit-text">Reset password</span>
              <span id="reset-submit-loading" class="hidden">Updating...</span>
            </button>
            <div id="reset-status" class="text-center text-[13px] hidden"></div>
          </form>
          <div id="reset-success" class="hidden text-center space-y-4">
            <div id="reset-success-message" class="text-[14px] text-green-600 font-medium"></div>
            <a
              href="/login"
              class="inline-flex items-center justify-center bg-black text-white rounded-[14px] px-5 py-3 text-[14px] font-semibold hover:bg-black/90 transition-colors"
            >
              Go to sign in
            </a>
          </div>
          <div class="mt-6 text-center">
            <a href="/login" class="text-[13px] text-[#6B7280] hover:text-black hover:underline">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('reset-password-form');
  const passwordInput = document.getElementById('new-password');
  const confirmInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('reset-submit-btn');
  const submitText = document.getElementById('reset-submit-text');
  const submitLoading = document.getElementById('reset-submit-loading');
  const status = document.getElementById('reset-status');
  const successContainer = document.getElementById('reset-success');
  const successMessage = document.getElementById('reset-success-message');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmInput.value.trim();

    if (!password || password.length < 8) {
      status.textContent = 'Password must be at least 8 characters long.';
      status.classList.remove('hidden', 'text-green-600');
      status.classList.add('text-red-500');
      return;
    }

    if (password !== confirmPassword) {
      status.textContent = 'Passwords do not match.';
      status.classList.remove('hidden', 'text-green-600');
      status.classList.add('text-red-500');
      return;
    }

    status.classList.add('hidden');
    status.textContent = '';
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    try {
      const response = await submitPasswordReset({ email, token, resetId, password });
      const message =
        response?.message || 'Password updated. You can now sign in with your new password.';

      status.classList.add('hidden');
      passwordInput.value = '';
      confirmInput.value = '';
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
      form.classList.add('hidden');
      successMessage.textContent = message;
      successContainer.classList.remove('hidden');
    } catch (error) {
      status.textContent = error.message || 'Unable to reset password. Please request a new link.';
      status.classList.remove('hidden', 'text-green-600');
      status.classList.add('text-red-500');
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
      return;
    }
  });
}

