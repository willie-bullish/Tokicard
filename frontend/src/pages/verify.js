import { handleOtpSubmit, handleResendOtp } from '../api/verify.js';

export function renderVerifyPage(container, emailFromRoute = '') {
  const pendingUser = getPendingUser();
  const email = emailFromRoute || pendingUser?.email || '';

  container.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-[500px] flex flex-col items-center px-0 sm:px-0">
          <div class="mb-6 sm:mb-8">
            <img src="/tokilogo.png" alt="Tokicard Logo" width="118">
          </div>
          <h1 class="text-[28px] sm:text-[32px] leading-[1.2] mb-2 text-center text-black">
            Verify Your Email
          </h1>
          <p class="text-[13px] sm:text-[14px] text-center text-[#666666] mb-1 max-w-[420px]">
            We sent a 6-digit verification code to
          </p>
          <p class="text-[14px] sm:text-[15px] text-center text-black font-semibold mb-4">
            ${email ? maskEmail(email) : 'your email address'}
          </p>
          <p class="text-[12px] sm:text-[13px] text-center text-[#777777] mb-6">
            Enter the code below to complete your registration.
          </p>

          <form id="otp-form" class="w-full mb-4">
            <div class="otp-grid mb-4">
              ${Array.from({ length: 6 })
                .map(
                  (_, index) => `
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="otp-input w-full min-h-[52px] text-center text-[20px] sm:text-[24px] font-semibold bg-white rounded-[12px] sm:rounded-[16px] py-3 sm:py-4 border border-gray-300 focus:border-black focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  data-index="${index}"
                  aria-label="Verification digit ${index + 1}"
                  required
                />`
                )
                .join('')}
            </div>
            <div class="hidden">
              <input type="hidden" id="otp-email" value="${email}">
            </div>
            <button
              type="submit"
              id="otp-submit-btn"
              class="w-full bg-black text-white rounded-[12px] py-3 text-[14px] hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span id="otp-submit-text">Verify Account</span>
              <span id="otp-submit-loading" class="hidden">Verifying...</span>
            </button>
            <div id="otp-error-message" class="mt-3 text-red-500 text-sm text-center hidden"></div>
          </form>

          <div class="flex flex-col items-center gap-2">
            <button
              id="resend-otp-btn"
              class="text-[13px] text-black font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
            <button
              id="change-email-btn"
              class="text-[12px] text-[#666666] hover:text-black hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach OTP handler
  const form = document.getElementById('otp-form');
  form.addEventListener('submit', (e) => handleOtpSubmit(e, container));

  // Attach resend handler
  const resendBtn = document.getElementById('resend-otp-btn');
  resendBtn.addEventListener('click', async () => {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    try {
      await handleResendOtp(email);
      resendBtn.textContent = 'Code Sent!';
      setTimeout(() => {
        resendBtn.textContent = 'Resend Code';
        resendBtn.disabled = false;
      }, 5000);
    } catch (error) {
      resendBtn.textContent = 'Resend Code';
      resendBtn.disabled = false;
      showOtpError(error.message || 'Failed to resend code. Please try again.');
    }
  });

  const changeEmailBtn = document.getElementById('change-email-btn');
  changeEmailBtn.addEventListener('click', () => {
    localStorage.removeItem('pendingUser');
    localStorage.removeItem('pendingReferralName');
    localStorage.removeItem('verificationId');
    window.history.pushState({}, '', '/');
    import('./waitlist.js').then(({ renderWaitlistPage }) => {
      renderWaitlistPage(container);
    });
  });

  wireOtpInputs();
}

function getPendingUser() {
  try {
    const stored = localStorage.getItem('pendingUser');
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Failed to parse pending user:', err);
    return null;
  }
}

function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const visibleUser = user.slice(0, 2);
  const maskedUser = `${visibleUser}${'*'.repeat(Math.max(user.length - 2, 0))}`;
  return `${maskedUser}@${domain}`;
}

function wireOtpInputs() {
  const inputs = Array.from(document.querySelectorAll('.otp-input'));

  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value.replace(/\D/g, '');
      e.target.value = value.slice(-1);
      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
      }
      if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });

  if (inputs.length) {
    inputs[0].focus();
  }
}

function showOtpError(message) {
  const errorMessage = document.getElementById('otp-error-message');
  if (!errorMessage) return;
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

