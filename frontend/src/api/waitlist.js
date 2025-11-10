import { apiRequest } from './client.js';

export async function handleWaitlistSubmit(e, referredBy = null) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitLoading = document.getElementById('submit-loading');
  const errorMessage = document.getElementById('error-message');
  
  // Get form data
  const formData = {
    fullname: document.getElementById('fullname').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    password: document.getElementById('password').value,
    referredBy: referredBy
  };
  
  // Validate
  if (!formData.fullname || !formData.email || !formData.phone || !formData.password) {
    showError('Please fill in all fields');
    return;
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Validate password
  if (formData.password.length < 8) {
    showError('Password must be at least 8 characters long');
    return;
  }
  
  // Validate phone (basic check)
  const phoneRegex = /^\+?\d{11,15}$/;
  if (!phoneRegex.test(formData.phone)) {
    showError('Please enter a valid phone number with country code');
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  submitLoading.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  
  try {
    const data = await apiRequest('/waitlist', {
      method: 'POST',
      body: formData,
      auth: false,
    });

    if (data?.alreadyVerified) {
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');

      alert(data.message || 'Account already verified. Please sign in.');
      window.history.pushState({}, '', '/login');
      const { renderLoginPage } = await import('../pages/login.js');
      renderLoginPage(document.getElementById('root'));
      return;
    }

    // Persist pending user info for OTP flow
    const pendingUser = {
      fullname: formData.fullname,
      email: formData.email,
      phone: formData.phone
    };
    localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
    localStorage.setItem('pendingReferralName', formData.fullname);
    if (data?.verificationId) {
      localStorage.setItem('verificationId', data.verificationId);
    }

    if (data?.debugOtp) {
      console.info('Debug OTP (development only):', data.debugOtp);
    }
    
    // Redirect to OTP verification page
    const emailParam = encodeURIComponent(formData.email);
    window.history.pushState({}, '', `/verify?email=${emailParam}`);
    const { renderVerifyPage } = await import('../pages/verify.js');
    renderVerifyPage(document.getElementById('root'), formData.email);
    
  } catch (error) {
    console.error('Error submitting form:', error);
    showError(error.message || 'Failed to submit. Please try again.');
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    submitLoading.classList.add('hidden');
  }
}

function showError(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

