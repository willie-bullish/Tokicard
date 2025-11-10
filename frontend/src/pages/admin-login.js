import { adminLogin } from '../api/admin.js';
import { showToast } from '../utils/toast.js';

export function renderAdminLoginPage(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-[572px] flex flex-col items-center px-4 sm:px-0">
          <div class="mb-6 sm:mb-8">
            <img src="/tokilogo.png" alt="Tokicard Logo" width="118">
          </div>
          <h1 class="text-[28px] sm:text-[32px] leading-[1.2] mb-2 text-center text-black">
            Admin Login
          </h1>
          <p class="text-[13px] sm:text-[14px] text-center text-[#666666] mb-6 max-w-[420px]">
            Access the admin dashboard to manage tasks and view analytics
          </p>
          
          <form id="admin-login-form" class="w-full mb-8">
            <div class="relative mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                id="username" 
                name="username"
                placeholder="Admin Username" 
                required 
                autocomplete="username"
                class="w-full bg-white rounded-[12px] px-10 py-3 text-[14px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
            </div>
            <div class="relative mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type="password" 
                id="password" 
                name="password"
                placeholder="Admin Password" 
                required 
                autocomplete="current-password"
                class="w-full bg-white rounded-[12px] px-10 py-3 text-[14px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
            </div>
            <button 
              type="submit" 
              id="submit-btn"
              class="w-full bg-black text-white rounded-[12px] py-3 text-[14px] hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span id="submit-text">Sign In</span>
              <span id="submit-loading" class="hidden">Signing in...</span>
            </button>
            <div id="error-message" class="mt-3 text-red-500 text-sm text-center hidden"></div>
          </form>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('admin-login-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitLoading = document.getElementById('submit-loading');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.add('hidden');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      errorMessage.textContent = 'Please enter both username and password';
      errorMessage.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    try {
      await adminLogin(username, password);
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 500);
    } catch (error) {
      errorMessage.textContent = error.message || 'Login failed. Please try again.';
      errorMessage.classList.remove('hidden');
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  });
}

