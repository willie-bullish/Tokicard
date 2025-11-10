import { handleLoginSubmit } from '../api/login.js';
import { showToast } from '../utils/toast.js';

export function renderLoginPage(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-[#f5f5f5] flex flex-col">
      <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-[572px] flex flex-col items-center px-4 sm:px-0">
          <div class="mb-6 sm:mb-8">
            <img src="/tokilogo.png" alt="Tokicard Logo" width="118">
          </div>
          <h1 class="text-[28px] sm:text-[32px] leading-[1.2] mb-2 text-center text-black">
            Welcome Back
          </h1>
          <p class="text-[13px] sm:text-[14px] text-center text-[#666666] mb-6 max-w-[420px]">
            Sign in to access your Tokicard account
          </p>
          
          <!-- Google Sign-In Button -->
          <button 
            type="button"
            id="google-login-btn"
            class="w-full bg-white border border-gray-300 text-gray-700 rounded-[12px] py-3 text-[14px] hover:bg-gray-50 transition-colors mb-4 flex items-center justify-center gap-3 shadow-sm"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <div class="w-full flex items-center mb-4">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-4 text-[12px] text-gray-500">OR</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>
          
          <form id="login-form" class="w-full mb-8">
            <div class="relative mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]">
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <input 
                type="email" 
                id="email" 
                name="email"
                placeholder="Email address" 
                required 
                autocomplete="email"
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
                placeholder="Password" 
                required 
                autocomplete="current-password"
                class="w-full bg-white rounded-[12px] px-10 py-3 text-[14px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
            </div>
            <div class="mb-4 text-right">
              <a href="/forgot-password" class="text-[12px] text-[#666666] hover:text-black hover:underline">
                Forgot password?
              </a>
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
          <div class="text-center mt-4">
              <p class="text-[13px] text-[#666666]">
                Don't have an account? 
                <a href="/register" class="text-black font-semibold hover:underline">Join Waitlist</a>
              </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach form handler
  const form = document.getElementById('login-form');
  form.addEventListener('submit', handleLoginSubmit);
  
  // Attach Google Sign-In handler
  const googleBtn = document.getElementById('google-login-btn');
  googleBtn.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Coming soon');
  });
}

