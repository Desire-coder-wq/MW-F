document.addEventListener("DOMContentLoaded", () => {
  initializeCharts();
});

// ---------------- CHARTS ----------------
function initializeCharts() {
  // Product Chart
  const productCtx = document.getElementById("productChart").getContext("2d");
  const productLabels = chartData.topProducts.map(item => item._id);
  const productData = chartData.topProducts.map(item => item.totalQuantity);

  new Chart(productCtx, {
    type: "pie",
    data: {
      labels: productLabels,
      datasets: [{
        data: productData,
        backgroundColor: [
          "#0b880b", "#e8b067", "#1e293b", "#475569", "#334155",
          "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
        title: { display: true, text: "Top Selling Products" }
      }
    }
  });

  // Agent Chart
  const agentCtx = document.getElementById("agentChart").getContext("2d");
  const agentLabels = chartData.topAgents.map(item => item._id || "Unknown");
  const agentData = chartData.topAgents.map(item => item.totalRevenue);

  new Chart(agentCtx, {
    type: "bar",
    data: {
      labels: agentLabels,
      datasets: [{
        label: "Revenue (UGX)",
        data: agentData,
        backgroundColor: "#0b880b",
        borderColor: "#06660e",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value.toLocaleString() + " UGX"
          }
        }
      },
      plugins: {
        title: { display: true, text: "Top Agents by Revenue" }
      }
    }
  });
}

// ---------------- EXPORT PDF ----------------
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Sales Report - Mayondo Wood & Furniture", 20, 20);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

  const cards = document.querySelectorAll(".card-content");
  let cardY = 50;
  cards.forEach(card => {
    const title = card.querySelector("h4").textContent;
    const value = card.querySelector("p").textContent;
    doc.text(`${title}: ${value}`, 20, cardY);
    cardY += 10;
  });

  doc.text("Sales Records:", 20, cardY + 10);
  let yPosition = cardY + 20;
  const table = document.querySelector(".report-table table");
  const headers = table.querySelectorAll("thead th");
  const rows = table.querySelectorAll("tbody tr");

  let xPosition = 10;
  headers.forEach(header => {
    doc.text(header.textContent.trim(), xPosition, yPosition);
    xPosition += 30;
  });

  yPosition += 10;
  rows.forEach(row => {
    xPosition = 10;
    row.querySelectorAll("td").forEach(cell => {
      doc.text(cell.textContent.trim(), xPosition, yPosition, { maxWidth: 30 });
      xPosition += 30;
    });
    yPosition += 10;
    if (yPosition > 270) { doc.addPage(); yPosition = 20; }
  });

  doc.save("sales-report.pdf");
}

// ---------------- EXPORT EXCEL ----------------
function exportExcel() {
  const table = document.querySelector(".report-table table");
  const ws = XLSX.utils.table_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
  XLSX.writeFile(wb, "sales-report.xlsx");
}
