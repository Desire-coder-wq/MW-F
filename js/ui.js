function db() {
  return {
    products: [
      { id: 1, name: 'Product 1', quantity: 40, price: 25000 },
      { id: 2, name: 'Product 2', quantity: 15, price: 45000 },
      { id: 3, name: 'Product 3', quantity: 0,  price: 30000 }
    ],
    sales: []
  };
}

//reort-ui.js


// Set the text content of the top bar header
function renderTopbar(text) {
  const topbar = document.getElementById("topbar");
  if (topbar) {
    topbar.textContent = text;
  }
}

// Placeholder requireAuth function (if needed)
function requireAuth() {
  // Add real authentication logic here
  // For now, just simulate granted access
  return true;
}