// report.js

// Helper: format number as UGX currency with commas
function formatUGX(amount) {
  return "UGX " + amount.toLocaleString();
}

// Render the sales report table based on optional filter formData
function renderReport(formData = null) {
  const { sales } = db(); // get sales data from your db()

  // Filter sales based on formData if provided
  let filteredSales = sales;

  if (formData) {
    const fromDate = formData.get("from");
    const toDate = formData.get("to");
    const agent = (formData.get("agent") || "").toLowerCase();
    const payment = formData.get("payment");

    filteredSales = sales.filter(sale => {
      // Filter by date range
      if (fromDate && new Date(sale.date) < new Date(fromDate)) return false;
      if (toDate && new Date(sale.date) > new Date(toDate)) return false;

      // Filter by agent (if provided)
      if (agent && !sale.agent.toLowerCase().includes(agent)) return false;

      // Filter by payment type (if provided)
      if (payment && payment !== "" && sale.payment !== payment) return false;

      return true;
    });
  }

  // Build table header
  let tableHtml = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Agent</th>
        <th>Product</th>
        <th>Quantity</th>
        <th>Payment Type</th>
        <th>Total (UGX)</th>
      </tr>
    </thead>
    <tbody>
  `;

  // If no sales, show message
  if (filteredSales.length === 0) {
    tableHtml += `
      <tr><td colspan="6" style="text-align:center;">No sales found matching the criteria.</td></tr>
    `;
  }

  // Sum totals for the footer
  let totalQuantity = 0;
  let totalRevenue = 0;

  // Generate table rows
  filteredSales.forEach(sale => {
    totalQuantity += sale.quantity;
    totalRevenue += sale.total;

    tableHtml += `
      <tr>
        <td>${new Date(sale.date).toLocaleDateString()}</td>
        <td>${sale.agent}</td>
        <td>${sale.productName}</td>
        <td>${sale.quantity}</td>
        <td>${sale.payment}</td>
        <td style="text-align:right;">${sale.total.toLocaleString()}</td>
      </tr>
    `;
  });

  tableHtml += `</tbody>`;


