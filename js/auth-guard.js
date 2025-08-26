// auth-guard.js

function checkAccess(allowedRoles) {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) {
    // Not logged in
    alert("You must log in first.");
    window.location.href = "index.html";
    return;
  }

  if (!allowedRoles.includes(user.role)) {
    // Role not allowed
    alert("Access denied! You don't have permission to view this page.");
    window.location.href = "index.html";
    return;
  }

  // If allowed, show welcome message (optional)
  console.log(`Access granted: ${user.username} (${user.role})`);
}
