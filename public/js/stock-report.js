document.addEventListener("DOMContentLoaded", () => {
  // Get stock data from hidden JSON
  const stocks = JSON.parse(document.getElementById("chart-data").textContent);

  // ---- Export Functions ----
  window.exportPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("MWF Stock Report", 10, 10);
    if (document.querySelector("table")) {
      doc.autoTable({ html: "table" }); // requires jspdf-autotable plugin
    }
    doc.save("stock-report.pdf");
  };

  window.exportExcel = function() {
    if (document.querySelector("table")) {
      const wb = XLSX.utils.table_to_book(document.querySelector("table"), { sheet: "Stock Report" });
      XLSX.writeFile(wb, "stock-report.xlsx");
    }
  };

  // ---- Charts ----
  const stockLevelsCanvas = document.getElementById("stockLevelsChart");
  const stockExpensesCanvas = document.getElementById("stockExpensesChart");
  const lowStockCanvas = document.getElementById("lowStockChart");

  // Prepare data arrays
  const labels = stocks.map(s => s.productName);
  const quantities = stocks.map(s => s.quantity);
  const rawMaterials = stocks.filter(s => s.category === "Raw Materails");
  const expenses = rawMaterials.map(s => s.costPrice * s.quantity);
  const lowStock = stocks.filter(s => s.quantity < 5);

  // ---- Stock Levels Chart ----
  if (stocks.length > 0) {
    new Chart(stockLevelsCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Stock Quantity",
          data: quantities,
          backgroundColor: "rgba(54, 162, 235, 0.7)"
        }]
      },
      options: { responsive: true }
    });
  } else {
    const ctx = stockLevelsCanvas.getContext("2d");
    ctx.font = "16px Arial";
    ctx.fillText("No stock data yet", 50, 50);
  }

  // ---- Expenses Chart ----
  if (rawMaterials.length > 0) {
    new Chart(stockExpensesCanvas, {
      type: "pie",
      data: {
        labels: rawMaterials.map(s => s.productName),
        datasets: [{
          label: "Expenses",
          data: expenses,
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)"
          ]
        }]
      },
      options: { responsive: true }
    });
  } else {
    const ctx = stockExpensesCanvas.getContext("2d");
    ctx.font = "16px Arial";
    ctx.fillText("No expenses recorded yet", 50, 50);
  }

  // ---- Low Stock Chart ----
  if (lowStock.length > 0) {
    new Chart(lowStockCanvas, {
      type: "bar",
      data: {
        labels: lowStock.map(s => s.productName),
        datasets: [{
          label: "Low Stock (below 5)",
          data: lowStock.map(s => s.quantity),
          backgroundColor: "rgba(255, 99, 132, 0.8)"
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: "Low Stock Alert" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  } else {
    // Remove canvas and show green success message
    lowStockCanvas.insertAdjacentHTML(
      "beforebegin",
      "<p style='color: green; font-weight: bold;'>✅ No low stock issues detected!</p>"
    );
    lowStockCanvas.remove();
  }
});
