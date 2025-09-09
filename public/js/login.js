

const users = [
  { username: "admin", password: "admin54", role: "admin" },
  { username: "manager1", password: "manager54", role: "manager" },
  { username: "attendant1", password: "attendant54", role: "attendant" }
];

function handleLogin(event) {
  event.preventDefault(); // prevent default form submission

  const form = event.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const role = form.role.value;
  const messageDiv = document.getElementById('message');
  
  messageDiv.textContent = '';
  
  if (!username || !password || !role) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = "All fields are required.";
    return;
  }

  // Verify credentials
  const user = users.find(u =>
    u.username === username &&
    u.password === password &&
    u.role === role
  );

  if (!user) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = "Invalid login credentials. Check username, password, and role.";
    return;
  }

  messageDiv.style.color = 'green';
  messageDiv.textContent = `Welcome, ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} ${user.username}! Redirecting...`;

  
  setTimeout(() => {
    if (role === 'attendant') {
      window.location.href = `${attendant-dashboard.html}`;
    } else if (role === 'manager') {
      window.location.href = 'manager-dashboard.html';
    } else if (role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    }
  }, 1000); 
}

window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});
