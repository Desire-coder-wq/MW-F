// auth.js

// Basic users database simulation
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "manager1", password: "manager123", role: "manager" },
  { username: "attendant1", password: "attendant123", role: "attendant" }
];

function handleLogin(event) {
  event.preventDefault(); // prevent form submit

  const form = event.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const role = form.role.value;

  const messageDiv = document.getElementById('message');
  messageDiv.textContent = ''; // Clear message

  if (!username || !password || !role) {
    messageDiv.textContent = "All fields are required.";
    return;
  }

  // Check user credentials against our users array
  const user = users.find(u =>
    u.username === username &&
    u.password === password &&
    u.role === role
  );

  if (user) {
    messageDiv.style.color = 'green';
    messageDiv.textContent = `Welcome back, ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} ${user.username}!`;
    
    // For demonstration, just clear the form
    form.reset();

    // Here you can redirect or save session token etc.
  } else {
    messageDiv.style.color = 'red';
    messageDiv.textContent = "Invalid login credentials. Please check your username, password, and role.";
  }
}
  window.addEventListener('DOMContentLoaded', () => {
    // Call any initialization if needed here
  });
  document.getElementById('loginForm').addEventListener('submit', handleLogin);