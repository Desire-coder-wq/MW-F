function db() {
  return {
    // Example sales data
    sales: [
      {
        date: "2025-08-01",
        agent: "Alice",
        productName: "Product 1",
        quantity: 10,
        payment: "Cash",
        total: 250000
      },
      {
        date: "2025-08-15",
        agent: "Bob",
        productName: "Product 2",
        quantity: 5,
        payment: "Cheque",
        total: 225000
      },
      
    ],

    // other db properties...
  };
}

   
// stock /auth.js

// Role-based access control
function requireRole(allowedRoles) {
  // This simulates current user role; replace with real authentication data
  const currentUser = { username: "admin", role: "Admin" };

  if (!allowedRoles.includes(currentUser.role)) {
    alert("Access denied: insufficient permissions.");
    window.location.href = "index.html";
  }
}
