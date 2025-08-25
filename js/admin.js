function checkAccess(allowedRoles) {
  // Simulate user role retrieval (replace this logic with actual auth check)
  const currentUserRole = localStorage.getItem('userRole') || 'guest';

  if (!allowedRoles.includes(currentUserRole)) {
    alert('Access denied. You do not have permission to view this page.');
    // Redirect to login or home page
    window.location.href = 'login.html';
  }
}