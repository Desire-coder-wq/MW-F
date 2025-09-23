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
          // Update status in the table row
          const row = btn.closest("tr");
          row.querySelector("td span").textContent = "Approved";
          row.querySelector("td span").className = "approved";
          // Remove action buttons
          row.querySelector("td:last-child").innerHTML = `<button disabled>Approved</button>`;
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
          row.querySelector("td span").textContent = "Rejected";
          row.querySelector("td span").className = "rejected";
          row.querySelector("td:last-child").innerHTML = `<button disabled>Rejected</button>`;
        }
      } catch (err) {
        console.error(err);
        alert("Error rejecting stock");
      }
    });
  });
});
