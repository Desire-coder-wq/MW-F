
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

// Modal open/close
const profileModal = document.getElementById("profileModal");
const editProfileBtn = document.getElementById("editProfileBtn");
const profileCard = document.getElementById("profileCard");
const closeModal = document.getElementById("closeModal");

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", (e) => {
    e.preventDefault();
    profileModal.style.display = "flex";
  });
}

if (profileCard) {
  profileCard.addEventListener("click", () => {
    profileModal.style.display = "flex";
  });
}

if (closeModal) {
  closeModal.addEventListener("click", () => {
    profileModal.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    profileModal.style.display = "none";
  }
});



// Profile picture preview
const profilePicInput = document.getElementById("profilePicInput");
const profilePreview = document.getElementById("profilePreview");
const deletePicBtn = document.getElementById("deletePicBtn");
const changePicBtn = document.getElementById("changePicBtn");

if (profilePicInput) {
  profilePicInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        profilePreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}
if (deletePicBtn) {
  deletePicBtn.addEventListener("click", () => {
    profilePreview.src = "/images/default-avatar.png"; // fallback image
    profilePicInput.value = ""; // clear file input
  });
}

if (changePicBtn) {
  changePicBtn.addEventListener("click", () => {
    profilePicInput.click(); // opens file dialog
  });
}