document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#stock-table tbody");

  function fetchSubmissions() {
    fetch("/stock-submissions")
      .then(res => res.json())
      .then(data => {
        tbody.innerHTML = "";
        if (data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No submissions found.</td></tr>`;
          return;
        }

        data.forEach(sub => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${sub.productName}</td>
            <td>${sub.quantity}</td>
            <td>${sub.submittedBy ? sub.submittedBy.name : "Unknown"}</td>
            <td>${new Date(sub.dateSubmitted).toLocaleDateString()}</td>
            <td><span class="${sub.status.toLowerCase()}-status">${sub.status}</span></td>
            <td>
              ${sub.status === "Pending" ? `
              <button class="approve-btn" data-id="${sub._id}">Approve</button>
              <button class="reject-btn" data-id="${sub._id}">Reject</button>
              ` : `<button class="disabled" disabled>${sub.status}</button>`}
            </td>
          `;
          tbody.appendChild(row);
        });

        // Attach button handlers
        document.querySelectorAll(".approve-btn").forEach(btn => {
          btn.addEventListener("click", () => toggleSubmission(btn.dataset.id, "approve"));
        });
        document.querySelectorAll(".reject-btn").forEach(btn => {
          btn.addEventListener("click", () => toggleSubmission(btn.dataset.id, "reject"));
        });
      });
  }

  function toggleSubmission(id, action) {
    fetch(`/stock-submissions/${id}/${action}`, { method: "POST" })
      .then(() => fetchSubmissions());
  }

  fetchSubmissions();
});
