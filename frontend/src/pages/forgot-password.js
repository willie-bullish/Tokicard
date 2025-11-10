import { requestPasswordReset } from '../api/password.js';

export function renderForgotPasswordPage(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div class="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div class="w-full max-w-[500px] bg-white rounded-[24px] shadow-sm px-6 sm:px-8 py-8">
          <div class="mb-6 text-center">
            <img src="/tokilogo.png" alt="Tokicard Logo" class="mx-auto mb-4" width="118">
            <h1 class="text-[26px] sm:text-[30px] font-semibold text-[#111827] mb-2">Forgot password?</h1>
            <p class="text-[13px] sm:text-[14px] text-[#6B7280]">
              Enter the email you used to create your Tokicard account and we’ll send you a reset link.
            </p>
          </div>
          <form id="forgot-password-form" class="space-y-4">
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]">
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <input
                type="email"
                id="forgot-email"
                name="email"
                placeholder="Email address"
                required
                autocomplete="email"
                class="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-10 py-3 text-[14px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-black/10"
              >
            </div>
            <button
              type="submit"
              id="forgot-submit-btn"
              class="w-full bg-black text-white rounded-[14px] py-3 text-[14px] font-semibold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span id="forgot-submit-text">Send reset link</span>
              <span id="forgot-submit-loading" class="hidden">Sending...</span>
            </button>
            <div id="forgot-status" class="text-center text-[13px] hidden"></div>
          </form>
          <div class="mt-6 text-center">
            <a href="/login" class="text-[13px] text-[#6B7280] hover:text-black hover:underline">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('forgot-email');
  const submitBtn = document.getElementById('forgot-submit-btn');
  const submitText = document.getElementById('forgot-submit-text');
  const submitLoading = document.getElementById('forgot-submit-loading');
  const status = document.getElementById('forgot-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      return;
    }

    status.classList.add('hidden');
    status.textContent = '';
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    try {
      const response = await requestPasswordReset(email);
      const message =
        response?.message || 'If an account exists for that email, a reset link has been sent.';

      status.textContent = message;
      status.classList.remove('hidden');
      status.classList.remove('text-red-500');
      status.classList.add('text-green-600');
    } catch (error) {
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
      status.textContent = error.message || 'Unable to send reset instructions. Please try again.';
      status.classList.remove('hidden');
      status.classList.remove('text-green-600');
      status.classList.add('text-red-500');
      return;
    }

    submitText.textContent = 'Link sent';
    submitText.classList.remove('hidden');
    submitLoading.classList.add('hidden');
  });
}

