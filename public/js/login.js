// Login Form Validation
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Create error message elements
  function createErrorElement(inputElement) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.style.display = 'none';
    inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
    return errorDiv;
  }

  const emailError = createErrorElement(emailInput);
  const passwordError = createErrorElement(passwordInput);

  // Validate email
  function validateEmail() {
    const email = emailInput.value.trim();
    
    if (email === '') {
      showError(emailInput, emailError, 'Email is required');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      showError(emailInput, emailError, 'Please enter a valid email address');
      return false;
    }
    
    hideError(emailInput, emailError);
    return true;
  }

  // Validate password
  function validatePassword() {
    const password = passwordInput.value;
    
    if (password === '') {
      showError(passwordInput, passwordError, 'Password is required');
      return false;
    }
    
    if (password.length < 6) {
      showError(passwordInput, passwordError, 'Password must be at least 6 characters long');
      return false;
    }
    
    hideError(passwordInput, passwordError);
    return true;
  }

  // Show error
  function showError(input, errorElement, message) {
    input.style.borderColor = '#e74c3c';
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  // Hide error
  function hideError(input, errorElement) {
    input.style.borderColor = '';
    errorElement.style.display = 'none';
  }

  // Real-time validation on blur
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);

  // Clear error on input
  emailInput.addEventListener('input', function() {
    if (emailError.style.display === 'block') {
      validateEmail();
    }
  });

  passwordInput.addEventListener('input', function() {
    if (passwordError.style.display === 'block') {
      validatePassword();
    }
  });

  // Form submission validation
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (isEmailValid && isPasswordValid) {
      // If all validations pass, submit the form
      form.submit();
    } else {
      // Focus on the first invalid field
      if (!isEmailValid) {
        emailInput.focus();
      } else if (!isPasswordValid) {
        passwordInput.focus();
      }
    }
  });
});