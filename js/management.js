
function checkAccess(allowedRoles) {
  const currentUserRole = localStorage.getItem('userRole') || 'guest';

  if (allowedRoles.includes(admin)) {
    alert('Access allowed');
  } else {
    alert('Access denied. You do not have permission to view this page.');
    // Redirect to login or home page
    window.location.href = 'index.html';
  }
}


// Function to render topbar text
function renderTopbar(text) {
  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.textContent = text;
  }
}

// Simple authentication check (for demo, replace with real auth logic)
function requireAuth() {
  // Example: check if user is authenticated (stub)
  const loggedIn = true;  // Change this as needed
  if (!loggedIn) {
    window.location.href = 'login.html'; // Redirect if not logged in
  }
}

// Database simulation (from your db() function used in the HTML)
function db() {
  return {
    products: [
      { id: 1, name: 'Product 1', quantity: 40 },
      { id: 2, name: 'Product 2', quantity: 15 },
      { id: 3, name: 'Product 3', quantity: 0 }
    ],
    sales: [
      { id: 1, total: 50000 },
      { id: 2, total: 35000 },
      { id: 3, total: 85000 }
    ]
  };
}