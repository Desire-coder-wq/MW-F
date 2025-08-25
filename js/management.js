// Fake user list for demo
let users = [
  { username: "admin", role: "admin" },
  { username: "manager1", role: "manager" },
  { username: "attendant1", role: "attendant" }
];

const usersTableBody = document.querySelector("#usersTable tbody");
const addUserForm = document.getElementById("addUserForm");

// Render users table
function renderUsers() {
  usersTableBody.innerHTML = "";
  users.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td><button onclick="deleteUser(${index})">Delete</button></td>
    `;
    usersTableBody.appendChild(row);
  });
}

// Add user
addUserForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!username || !password || !role) return;

  users.push({ username, role });
  renderUsers();
  addUserForm.reset();
});

// Delete user
function deleteUser(index) {
  users.splice(index, 1);
  renderUsers();
}

// Initial render
renderUsers();
