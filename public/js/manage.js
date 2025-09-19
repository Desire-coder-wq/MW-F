document.addEventListener("DOMContentLoaded", () => {
  // Approve Stock Page
  if (window.location.pathname.includes("approve-stock")) {
    fetch("/stock-requests")
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("tbody");
        tbody.innerHTML = "";
        data.forEach(req => {
          const row = `
            <tr>
              <td>${req.item}</td>
              <td>${req.quantity}</td>
              <td>${req.submittedBy}</td>
              <td>${new Date(req.dateSubmitted).toLocaleString()}</td>
              <td><span class="${req.status.toLowerCase()}">${req.status}</span></td>
              <td>
                ${
                  req.status === "Pending"
                    ? `
                      <button onclick="approveStock('${req._id}')">Approve</button>
                      <button onclick="rejectStock('${req._id}')">Reject</button>
                    `
                    : `<button disabled>${req.status}</button>`
                }
              </td>
            </tr>
          `;
          tbody.innerHTML += row;
        });
      });
  }

  // Attendants Page
  if (window.location.pathname.includes("attendants")) {
    fetch("/attendants-data")
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("tbody");
        tbody.innerHTML = "";
        data.forEach(att => {
          const row = `
            <tr>
              <td>${att.name}</td>
              <td>${att.email}</td>
              <td>${att.assignedTask}</td>
              <td><span class="${att.status.toLowerCase()}-status">${att.status}</span></td>
              <td>${new Date(att.lastActive).toLocaleString()}</td>
              <td>
                <button onclick="toggleAttendant('${att._id}')">
                  ${att.status === "Active" ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          `;
          tbody.innerHTML += row;
        });
      });
  }
});

// Approve/Reject Stock
function approveStock(id) {
  fetch(`/stock-requests/${id}/approve`, { method: "POST" })
    .then(() => location.reload());
}

function rejectStock(id) {
  fetch(`/stock-requests/${id}/reject`, { method: "POST" })
    .then(() => location.reload());
}

// Enable/Disable Attendant
function toggleAttendant(id) {
  fetch(`/attendants/${id}/toggle`, { method: "POST" })
    .then(() => location.reload());
}
