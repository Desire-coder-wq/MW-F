// Attendant chart
const ctx1 = document.getElementById("attendantChart").getContext("2d");
new Chart(ctx1, {
  type: "bar",
  data: {
    labels: attendantData.map(a => a._id),
    datasets: [{
      label: "Stock Added",
      data: attendantData.map(a => a.totalAdded)
    }]
  }
});

// Monthly expense chart
const ctx2 = document.getElementById("expenseChart").getContext("2d");
new Chart(ctx2, {
  type: "line",
  data: {
    labels: monthlyExpenses.map(e => `${e._id.month}/${e._id.year}`),
    datasets: [{
      label: "Expenses",
      data: monthlyExpenses.map(e => e.total)
    }]
  }
});
