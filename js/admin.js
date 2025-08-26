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
