document.addEventListener("DOMContentLoaded", () => {
  const stocks = JSON.parse(document.getElementById("chart-data").textContent);

  // ---- Export Functions ----
  window.exportPDF = function() {
    const { jsPDF } = window.jspdf;

    // Ensure jspdf-autotable is loaded
    if (!docAutoTableLoaded()) {
      alert("PDF export requires jsPDF AutoTable plugin.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MWF Stock Report", 14, 20);

    const table = document.querySelector("table");
    if (table) {
      doc.autoTable({
        html: table,
        startY: 30,
        theme: "grid",
        headStyles: { fillColor: [54, 162, 235] },
        styles: { fontSize: 10 }
      });
    }

    doc.save("stock-report.pdf");
  };

  // Helper to check if autoTable plugin exists
  function docAutoTableLoaded() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      return typeof doc.autoTable === "function";
    } catch {
      return false;
    }
  }

  window.exportExcel = function() {
    const table = document.querySelector("table");
    if (table) {
      const wb = XLSX.utils.table_to_book(table, { sheet: "Stock Report" });
      XLSX.writeFile(wb, "stock-report.xlsx");
    }
  };

  // ---- Charts ----
  function createChart(canvasId, type, labels, data, labelText, colors = []) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (labels.length > 0) {
      new Chart(ctx, {
        type,
        data: {
          labels,
          datasets: [{
            label: labelText,
            data,
            backgroundColor: colors.length > 0 ? colors : "rgba(54, 162, 235, 0.7)"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true }
          }
        }
      });
    } else {
      const context = ctx.getContext("2d");
      context.font = "16px Arial";
      context.fillText("No data available", 50, 50);
    }
  }

  // --- Stock Levels Chart ---
  const labels = stocks.map(s => s.productName);
  const quantities = stocks.map(s => s.quantity);
  createChart("stockLevelsChart", "bar", labels, quantities, "Stock Quantity");

  // --- Low Stock Chart ---
  const lowStock = stocks.filter(s => s.quantity < 10);
  createChart(
    "lowStockChart",
    "bar",
    lowStock.map(s => s.productName),
    lowStock.map(s => s.quantity),
    "Low Stock (<10)"
  );

  // --- Expenses by Raw Materials ---
  const rawMaterials = stocks.filter(s => s.category.toLowerCase().includes("raw"));
  createChart(
    "stockExpensesChart",
    "pie",
    rawMaterials.map(s => s.productName),
    rawMaterials.map(s => s.quantity * s.costPrice),
    "Expenses"
  );

  // --- Stock by Type ---
  const typesMap = {};
  stocks.forEach(s => { typesMap[s.productType] = (typesMap[s.productType] || 0) + s.quantity; });
  createChart(
    "stockTypeChart",
    "doughnut",
    Object.keys(typesMap),
    Object.values(typesMap),
    "Stock by Type"
  );
});
