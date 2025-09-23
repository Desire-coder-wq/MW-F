document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector("table tbody");

  // Approve buttons
  table.querySelectorAll(".approve-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const form = btn.closest("form");
      const action = form.getAttribute("action");

      try {
        const res = await fetch(action, { method: "POST" });
        if (res.ok) {
          const row = btn.closest("tr");
          const statusCell = row.querySelector("td span"); // find the status span
          statusCell.textContent = "Approved";
          statusCell.className = "approved";
          // Replace action buttons with disabled Approved button
          row.querySelector("td:last-child").innerHTML = `<button disabled>Approved</button>`;
        } else {
          alert("Failed to approve stock");
        }
      } catch (err) {
        console.error(err);
        alert("Error approving stock");
      }
    });
  });

  // Reject buttons
  table.querySelectorAll(".reject-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Are you sure you want to reject this stock request?")) return;

      const form = btn.closest("form");
      const action = form.getAttribute("action");

      try {
        const res = await fetch(action, { method: "POST" });
        if (res.ok) {
          const row = btn.closest("tr");
          const statusCell = row.querySelector("td span");
          statusCell.textContent = "Rejected";
          statusCell.className = "rejected";
          row.querySelector("td:last-child").innerHTML = `<button disabled>Rejected</button>`;
        } else {
          alert("Failed to reject stock");
        }
      } catch (err) {
        console.error(err);
        alert("Error rejecting stock");
      }
    });
  });
});
