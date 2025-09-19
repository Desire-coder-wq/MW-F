let editId = null;

// Fetch stock from backend
async function fetchStock() {
  const res = await fetch("/api/stock");
  return await res.json();
}

// Render table
async function renderStock() {
  const stockTable = document.getElementById("stockTable");
  const stock = await fetchStock();

  if (!stock || stock.length === 0) {
    stockTable.innerHTML = `<tr><td colspan="5" style="text-align:center;">No stock available</td></tr>`;
    return;
  }

  const headers = ["Product", "Quantity", "Unit Price", "Total Value", "Actions"];
  const rows = stock.map(item => `
    <tr data-id="${item._id}">
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toLocaleString()} UGX</td>
      <td>${(item.quantity * item.price).toLocaleString()} UGX</td>
      <td>
        <button class="editBtn">✏️ Edit</button>
        <button class="deleteBtn">🗑️ Delete</button>
      </td>
    </tr>
  `).join('');

  stockTable.innerHTML = `
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  `;

  // Add event listeners for edit/delete
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const tr = e.target.closest("tr");
      const id = tr.getAttribute("data-id");
      const tds = tr.querySelectorAll("td");

      editId = id;
      document.getElementById("name").value = tds[0].innerText;
      document.getElementById("quantity").value = tds[1].innerText;
      document.getElementById("price").value = tds[2].innerText.replace(/,/g, '').replace(' UGX','');
    });
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const tr = e.target.closest("tr");
      const id = tr.getAttribute("data-id");
      if (confirm("Delete this stock item?")) {
        try {
          await fetch(`/stock/${id}`, { method: "DELETE" });
          console.log("Deleted stock:", id);
          renderStock();
        } catch (err) {
          console.error("Failed to delete stock", err);
        }
      }
    });
  });
}

// Handle Add/Edit
document.getElementById("stockForm").addEventListener("submit", async e => {
  e.preventDefault();
  
  const name = document.getElementById("name").value;
  const quantity = parseInt(document.getElementById("quantity").value, 10);
  const price = parseFloat(document.getElementById("price").value);

  try {
    if (editId) {
      // Edit mode
      const res = await fetch(`/stock/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, price })
      });
      const updated = await res.json();
      console.log("Updated stock ✅", updated);
      editId = null;
    } else {
      // Add mode
      const res = await fetch("/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, price })
      });
      const saved = await res.json();
      console.log("Saved to DB ✅", saved);
    }

    document.getElementById("stockForm").reset();
    renderStock();
  } catch (err) {
    console.error("Failed to save/edit stock", err);
  }
});

// Initial table load
renderStock();
