// Product icon mapping
function getProductIcon(productName) {
  const name = productName.toLowerCase();
  if (name.includes('bed')) return 'fas fa-bed';
  if (name.includes('sofa')) return 'fas fa-couch';
  if (name.includes('table') || name.includes('dinning')) return 'fas fa-utensils';
  if (name.includes('chair')) return 'fas fa-chair';
  if (name.includes('tv') || name.includes('stand')) return 'fas fa-tv';
  if (name.includes('timber') || name.includes('wood')) return 'fas fa-tree';
  if (name.includes('pole')) return 'fas fa-columns';
  return 'fas fa-cube';
}

// Image error handler
function handleImageError(img) {
  img.style.display = 'none';
  img.nextElementSibling.style.display = 'flex';
}

// Format currency
function formatCurrency(amount) {
  return 'KSH ' + amount.toString().replace(/\B(?=(\\d{3})+(?!\\d))/g, ",");
}

// Format date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle('active', i === index);
  });
  currentSlide = index;
}

function nextSlide() {
  showSlide((currentSlide + 1) % slides.length);
}

function prevSlide() {
  showSlide((currentSlide - 1 + slides.length) % slides.length);
}

// Initialize carousel
document.addEventListener('DOMContentLoaded', function() {
  // Set user name
  const userName = document.getElementById('userName').getAttribute('data-user-name');
  document.getElementById('userName').textContent = userName;

  // Start carousel auto-advance
  setInterval(nextSlide, 5000);

  // Carousel controls
  document.querySelector('.carousel-control.prev').addEventListener('click', prevSlide);
  document.querySelector('.carousel-control.next').addEventListener('click', nextSlide);

  // Carousel indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => showSlide(index));
  });
});

// Product management functions
async function loadAllProducts() {
  const productsContainer = document.getElementById('productsContainer');
  const singleProductView = document.getElementById('singleProductView');
  
  productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0b880b;"></i><p style="margin-top: 15px;">Loading products...</p></div>';
  
  try {
    const response = await fetch('/products/api');
    const result = await response.json();
    
    if (result.success) {
      displayProducts(result.data);
      singleProductView.style.display = 'none';
      productsContainer.style.display = 'grid';
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error loading products:', error);
    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i><p style="margin-top: 15px;">Failed to load products</p></div>';
  }
}

function displayProducts(products) {
  const productsContainer = document.getElementById('productsContainer');
  productsContainer.innerHTML = '';
  
  if (products.length === 0) {
    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;"><i class="fas fa-box-open" style="font-size: 2rem;"></i><p style="margin-top: 15px;">No products found</p></div>';
    return;
  }
  
  products.forEach(product => {
    const productCard = createProductCard(product);
    productsContainer.appendChild(productCard);
  });
}

function createProductCard(product) {
  const productCard = document.createElement('div');
  productCard.className = 'card product-card';
  
  const productIcon = getProductIcon(product.productName);
  const hasImage = product.image;
  
  productCard.innerHTML = `
    ${hasImage ? 
      `<img src="${product.image}" alt="${product.productName}" class="product-image" onerror="handleImageError(this)">
       <div class="product-image" style="display: none; background: linear-gradient(135deg, #f0fdf4, #dcfce7); align-items: center; justify-content: center; color: #0b880b; font-size: 3rem;">
         <i class="${productIcon}"></i>
       </div>` : 
      `<div class="product-image" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #0b880b; font-size: 3rem;">
         <i class="${productIcon}"></i>
       </div>`
    }
    <div class="card-content">
      <h4>${product.productName}</h4>
      <div class="product-info">
        <strong>Type:</strong> <span>${product.productType}</span>
      </div>
      <div class="product-info">
        <strong>Category:</strong> <span>${product.category}</span>
      </div>
      <div class="product-info">
        <strong>Quantity:</strong> <span>${product.quantity} units</span>
      </div>
      <div class="product-info">
        <strong>Price:</strong> <span>${formatCurrency(product.costPrice)}</span>
      </div>
      <div class="product-info">
        <strong>Supplier:</strong> <span>${product.supplier}</span>
      </div>
      ${product.quality ? `<div class="product-info"><strong>Quality:</strong> <span>${product.quality}</span></div>` : ''}
      ${product.color ? `<div class="product-info"><strong>Color:</strong> <span>${product.color}</span></div>` : ''}
      ${product.measurement ? `<div class="product-info"><strong>Measurement:</strong> <span>${product.measurement}</span></div>` : ''}
      <div class="product-info">
        <strong>Date Added:</strong> <span>${formatDate(product.date)}</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="action-btn view-btn" onclick="viewProduct('${product._id}')">
        <i class="fas fa-eye"></i> View Details
      </button>
      <button class="action-btn update-btn" onclick="updateProduct('${product._id}')">
        <i class="fas fa-edit"></i> Update
      </button>
      <button class="action-btn delete-btn" onclick="deleteProduct('${product._id}')">
        <i class="fas fa-trash"></i> Delete
      </button>
    </div>
  `;
  
  return productCard;
}

async function viewProduct(productId) {
  try {
    const response = await fetch('/products/' + productId);
    const result = await response.json();
    
    if (result.success) {
      displaySingleProduct(result.data);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    alert('Failed to fetch product: ' + error.message);
  }
}

function displaySingleProduct(product) {
  const singleProductView = document.getElementById('singleProductView');
  const singleProductContent = document.getElementById('singleProductContent');
  const productsContainer = document.getElementById('productsContainer');
  
  const productIcon = getProductIcon(product.productName);
  const hasImage = product.image;
  
  singleProductContent.innerHTML = `
    <div class="single-product-image">
      ${hasImage ? 
        `<img src="${product.image}" alt="${product.productName}">` : 
        `<i class="${productIcon}"></i>`
      }
    </div>
    <div class="single-product-details">
      <div class="detail-item">
        <strong>Product Name</strong>
        <span>${product.productName}</span>
      </div>
      <div class="detail-item">
        <strong>Product Type</strong>
        <span>${product.productType}</span>
      </div>
      <div class="detail-item">
        <strong>Category</strong>
        <span>${product.category}</span>
      </div>
      <div class="detail-item">
        <strong>Quantity</strong>
        <span>${product.quantity} units</span>
      </div>
      <div class="detail-item">
        <strong>Cost Price</strong>
        <span>${formatCurrency(product.costPrice)}</span>
      </div>
      <div class="detail-item">
        <strong>Supplier</strong>
        <span>${product.supplier}</span>
      </div>
      <div class="detail-item">
        <strong>Quality</strong>
        <span>${product.quality || 'Not specified'}</span>
      </div>
      ${product.color ? `
      <div class="detail-item">
        <strong>Color</strong>
        <span>${product.color}</span>
      </div>` : ''}
      ${product.measurement ? `
      <div class="detail-item">
        <strong>Measurement</strong>
        <span>${product.measurement}</span>
      </div>` : ''}
      <div class="detail-item">
        <strong>Date Added</strong>
        <span>${formatDate(product.date)}</span>
      </div>
      <div class="detail-item" style="grid-column: 1/-1; display: flex; gap: 10px; justify-content: center;">
        <button class="action-btn update-btn" onclick="updateProduct('${product._id}')">
          <i class="fas fa-edit"></i> Update Product
        </button>
        <button class="action-btn delete-btn" onclick="deleteProduct('${product._id}')">
          <i class="fas fa-trash"></i> Delete Product
        </button>
        <button class="action-btn view-btn" onclick="loadAllProducts()">
          <i class="fas fa-arrow-left"></i> Back to All
        </button>
      </div>
    </div>
  `;
  
  singleProductView.style.display = 'block';
  productsContainer.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateProduct(productId) {
  try {
    const response = await fetch('/products/' + productId);
    const result = await response.json();
    
    if (result.success) {
      const successMessage = document.getElementById('successMessage');
      successMessage.textContent = 'Ready to update: ' + result.data.productName + '. Redirecting to update form...';
      showSuccessModal();
      
      setTimeout(() => {
        window.location.href = '/stock-edit/' + productId;
      }, 2000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error updating product:', error);
    alert('Failed to update product: ' + error.message);
  }
}

async function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    try {
      const response = await fetch('/products/' + productId, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = 'Product "' + result.data.productName + '" has been deleted successfully.';
        showSuccessModal();
        
        setTimeout(() => {
          loadAllProducts();
          document.getElementById('singleProductView').style.display = 'none';
          document.getElementById('productsContainer').style.display = 'grid';
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + error.message);
    }
  }
}

function showSuccessModal() {
  document.getElementById('successModal').style.display = 'flex';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('getAllProducts').addEventListener('click', loadAllProducts);
  document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('successModal').style.display = 'none';
  });
  window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('successModal')) {
      document.getElementById('successModal').style.display = 'none';
    }
  });
});
function updateProduct(id) {
  // Fetch product details from server
  fetch(`/stock/get/${id}`)
    .then(res => res.json())
    .then(product => {
      if (!product) return alert('Product not found');

      // Fill the form fields
      document.getElementById('editStockId').value = product._id;
      document.getElementById('editProductName').value = product.productName;
      document.getElementById('editQuantity').value = product.quantity;
      document.getElementById('editCostPrice').value = product.costPrice;

      // Show modal
      document.getElementById('editStockModal').style.display = 'block';
    })
    .catch(err => console.error(err));
}

function closeEditModal() {
  document.getElementById('editStockModal').style.display = 'none';
}
