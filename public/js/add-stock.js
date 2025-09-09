
// stock.js

// Helper: Render the current stock in the table
function renderStockTable() {
  const { products } = db();

  const stockTable = document.getElementById("stockTable");
  if (!stockTable) return;

  if (products.length === 0) {
    stockTable.innerHTML = "<tr><td colspan='9' style='text-align:center'>No stock available.</td></tr>";
    return;
  }

  let html = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Supplier</th>
        <th>Quality</th>
        <th>Color</th>
        <th>Measurements</th>
        <th>Cost Price (UGX)</th>
        <th>Price (UGX)</th>
        <th>Quantity</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
  `;

  products.forEach(p => {
    html += `
      <tr>
        <td>${p.name}</td>
        <td>${p.type}</td>
        <td>${p.supplier}</td>
        <td>${p.quality}</td>
        <td>${p.color || ""}</td>
        <td>${p.measurements || ""}</td>
        <td style="text-align:right;">${p.costPrice.toLocaleString()}</td>
        <td style="text-align:right;">${p.price.toLocaleString()}</td>
        <td style="text-align:right;">${p.quantity}</td>
        <td>${new Date(p.date).toLocaleDateString()}</td>
      </tr>
    `;
  });

  html += "</tbody>";
  stockTable.innerHTML = html;
}

// Handle stock form submission - add or update
function saveStockForm(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const name = formData.get("name").trim();
  const type = formData.get("type");
  const supplier = formData.get("supplier").trim();
  const quality = formData.get("quality").trim();
  const color = formData.get("color").trim();
  const measurements = formData.get("measurements").trim();
  const costPrice = parseInt(formData.get("costPrice"), 10);
  const price = parseInt(formData.get("price"), 10);
  const quantity = parseInt(formData.get("quantity"), 10);
  const date = formData.get("date");

  if (!name || isNaN(costPrice) || isNaN(price) || isNaN(quantity)) {
    alert("Please fill all required fields with valid data.");
    return;
  }

  const { products } = db();

  // Check if product already exists (by exact name)
  const existingIndex = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());

  if (existingIndex !== -1) {
    // Update existing product
    products[existingIndex] = {
      ...products[existingIndex],
      type,
      supplier,
      quality,
      color,
      measurements,
      costPrice,
      price,
      quantity,
      date
    };
    alert(`Updated stock for product "${name}".`);
  } else {
    // Add new product
    const newProduct = {
      id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
      name,
      type,
      supplier,
      quality,
      color,
      measurements,
      costPrice,
      price,
      quantity,
      date
    };
    products.push(newProduct);
    alert(`Added new product "${name}" to stock.`);
  }

  // Rerender stock table and reset form
  renderStockTable();
  form.reset();
}

function loadProducts() {
  const data = localStorage.getItem('products');
  return data ? JSON.parse(data) : [];
}

function saveProducts(products) {
  localStorage.setItem('products', JSON.stringify(products));
}

function renderStockTable() {
  const products = loadProducts();
  // ...render products into table as before
}

function saveStockForm(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const name = formData.get("name").trim();
  const supplier = formData.get("supplier").trim();
  const quality = formData.get("quality").trim();
  const costPrice = parseInt(formData.get("costPrice"), 10);
  const price = parseInt(formData.get("price"), 10);
  const quantity = parseInt(formData.get("quantity"), 10);
  const date = formData.get("date");

  if (!name || !supplier || !quality || isNaN(costPrice) || isNaN(price) || isNaN(quantity)) {
    showNotification('Please fill all required fields correctly.', 'error');
    return;
  }

  const products = loadProducts();
  const index = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());

  if (index !== -1) {
    products[index] = { ...products[index], supplier, quality, costPrice, price, quantity, date };
    showNotification(`Updated stock for "${name}".`, 'success');
  } else {
    const newProduct = { id: products.length + 1, name, supplier, quality, costPrice, price, quantity, date };
    products.push(newProduct);
    showNotification(`Added new product "${name}".`, 'success');
  }

  saveProducts(products);
  renderStockTable();
  form.reset();
}
