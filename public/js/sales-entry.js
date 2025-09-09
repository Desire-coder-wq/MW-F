// sales.js

function populateProductSelect() {
  const productSelect = document.getElementById('productSelect');
  if (!productSelect) return;

  const { products } = db();

  productSelect.innerHTML = '<option value="" disabled selected>Select a product</option>';
  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    productSelect.appendChild(option);
  });
}

function updateCalculations() {
  const productSelect = document.getElementById('productSelect');
  const quantityInput = document.querySelector('input[name="quantity"]');
  const transportSelect = document.getElementById('transport');

  const unitPriceDisplay = document.getElementById('unitPrice');
  const subtotalDisplay = document.getElementById('subtotal');
  const transportFeeDisplay = document.getElementById('transportFee');
  const totalDisplay = document.getElementById('total');

  if (!productSelect || !quantityInput || !transportSelect) return;

  const { products } = db();
  
  const selectedProduct = products.find(p => p.id == productSelect.value);
  const quantity = parseInt(quantityInput.value) || 0;
  const transportSelected = transportSelect.value === 'Yes';

  let unitPrice = selectedProduct ? selectedProduct.price || 0 : 0;
  unitPriceDisplay.textContent = unitPrice.toLocaleString();

  let subtotal = unitPrice * quantity;
  subtotalDisplay.textContent = subtotal.toLocaleString();

  let transportFee = transportSelected ? subtotal * 0.05 : 0;
  transportFeeDisplay.textContent = transportFee.toLocaleString();

  let total = subtotal + transportFee;
  totalDisplay.textContent = total.toLocaleString();
}

function wireSaleCalculations() {
  const productSelect = document.getElementById('productSelect');
  const quantityInput = document.querySelector('input[name="quantity"]');
  const transportSelect = document.getElementById('transport');

  if (!productSelect || !quantityInput || !transportSelect) return;

  productSelect.addEventListener('change', updateCalculations);
  quantityInput.addEventListener('input', updateCalculations);
  transportSelect.addEventListener('change', updateCalculations);

  updateCalculations();
}

function handleSaleSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);

  const customer = formData.get('customer');
  const productId = formData.get('productId');
  const quantity = parseInt(formData.get('quantity'), 10);
  const date = formData.get('date');
  const payment = formData.get('payment');
  const transport = formData.get('transport');
  
  const { products, sales } = db();
  const selectedProduct = products.find(p => p.id == productId);
  if (!selectedProduct) {
    alert('Please select a valid product');
    return;
  }

  const unitPrice = selectedProduct.price || 0;
  const subtotal = unitPrice * quantity;
  const transportFee = transport === 'Yes' ? subtotal * 0.05 : 0;
  const total = subtotal + transportFee;
  
  // Log the new sale to console (replace with real logic as needed)
  const newSale = {
    customer,
    productId,
    quantity,
    date,
    payment,
    transport,
    total
  };
  console.log('Sale recorded:', newSale);

  alert(`Sale recorded for ${customer}. Total: UGX ${total.toLocaleString()}`);

  form.reset();
  updateCalculations();
}
