import { renderThankYouPage } from '../pages/thankyou.js';
import { apiRequest } from './client.js';

export async function handleOtpSubmit(e, container) {
  e.preventDefault();

  const submitBtn = document.getElementById('otp-submit-btn');
  const submitText = document.getElementById('otp-submit-text');
  const submitLoading = document.getElementById('otp-submit-loading');
  const errorMessage = document.getElementById('otp-error-message');

  const inputs = Array.from(document.querySelectorAll('.otp-input'));
  const otpCode = inputs.map((input) => input.value).join('');
  const emailInput = document.getElementById('otp-email');
  const email = emailInput?.value || getPendingUser()?.email;
  const verificationId = localStorage.getItem('verificationId') || undefined;

  if (otpCode.length !== 6) {
    showOtpError('Please enter the 6-digit code we sent to your email.');
    return;
  }

  if (!email) {
    showOtpError('We could not find your email. Please restart the registration process.');
    return;
  }

  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  submitLoading.classList.remove('hidden');
  errorMessage.classList.add('hidden');

  try {
    const data = await apiRequest('/verify-otp', {
      method: 'POST',
      body: { email, otp: otpCode, verificationId },
      auth: false,
    });
    completeVerification(container, data);
  } catch (error) {
    console.error('OTP verification failed:', error);
    showOtpError(error.message || 'Verification failed. Please try again.');
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    submitLoading.classList.add('hidden');
  }
}

export async function handleResendOtp(email) {
  if (!email) {
    throw new Error('No email found to resend code.');
  }

  const verificationId = localStorage.getItem('verificationId') || undefined;

  const data = await apiRequest('/resend-otp', {
    method: 'POST',
    body: { email, verificationId },
    auth: false,
  });

  if (data?.verificationId) {
    localStorage.setItem('verificationId', data.verificationId);
  }

  if (data?.debugOtp) {
    console.info('Debug OTP (development only):', data.debugOtp);
  }

  return data;
}

function completeVerification(container, data) {
  const pendingUser = getPendingUser();
  const referralName = localStorage.getItem('pendingReferralName') || pendingUser?.fullname || 'user';

  if (data?.token) {
    localStorage.setItem('authToken', data.token);
  }
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  const storedUser = data?.user || pendingUser || {};
  const referralCode =
    data?.user?.referralCode ||
    storedUser?.referralCode ||
    data?.referralCode ||
    `${referralName.toLowerCase().replace(/[^a-z0-9]/g, '')}-ref`;

  // Cleanup temporary data
  localStorage.removeItem('pendingUser');
  localStorage.removeItem('pendingReferralName');
  localStorage.removeItem('verificationId');

  window.history.pushState({}, '', '/dashboard');
  renderThankYouPage(container, referralCode);
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

function showOtpError(message) {
  const errorMessage = document.getElementById('otp-error-message');
  if (!errorMessage) return;
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

