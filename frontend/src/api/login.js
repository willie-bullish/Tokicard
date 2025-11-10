import { apiRequest } from './client.js';

export async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitLoading = document.getElementById('submit-loading');
  const errorMessage = document.getElementById('error-message');
  
  // Get form data
  const formData = {
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  };
  
  // Validate
  if (!formData.email || !formData.password) {
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
  
  // Show loading state
  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  submitLoading.classList.remove('hidden');
  errorMessage.classList.add('hidden');
  
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: formData,
      auth: false,
    });
    
    // Store auth token if provided
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || {}));
    }
    
    // Redirect to dashboard or home
    window.history.pushState({}, '', '/dashboard');
    
    // Re-render page
    const { renderThankYouPage } = await import('../pages/thankyou.js');
    renderThankYouPage(document.getElementById('root'));
    
  } catch (error) {
    console.error('Error logging in:', error);
    showError(error.message || 'Failed to sign in. Please check your credentials and try again.');
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

