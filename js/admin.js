

// Show/Hide Password
function togglePassword() {
  const passwordField = document.getElementById("password");
  passwordField.type = passwordField.type === "password" ? "text" : "password";
}

// Form Validation
document.getElementById("registerForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent form submission

  let name = document.getElementById("name").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value.trim();
  let role = document.getElementById("role").value;
  let errorMessage = document.getElementById("error-message");

  // Simple validation
  if (name === "" || email === "" || password === "" || role === "") {
    errorMessage.textContent = "⚠ Please fill in all fields.";
    return;
  }

  // Email validation
  let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  if (!email.match(emailPattern)) {
    errorMessage.textContent = "⚠ Please enter a valid email address.";
    return;
  }

  // Password strength validation
  if (password.length < 6) {
    errorMessage.textContent = "⚠ Password must be at least 6 characters.";
    return;
  }

  errorMessage.style.color = "green";
  errorMessage.textContent = "✅ Registration successful!";

  // Clear form after success
  document.getElementById("registerForm").reset();
});


// Save business info
document.getElementById("businessForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("companyName").value;
  const email = document.getElementById("companyEmail").value;
  const phone = document.getElementById("companyPhone").value;

  alert(`Business info saved!\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`);
});

// Theme settings
document.getElementById("themeForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const theme = document.getElementById("theme").value;

  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
});