doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport", content="width=device-width, initial-scale=1")
    title MWF — Products Gallery
    link(rel="stylesheet", href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css")
    link(rel="stylesheet", href="/css/attendant-manage.css")
    style.
      .product-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 15px;
      }
      .product-card {
        cursor: default;
      }
      .product-card:hover {
        transform: translateY(-5px);
      }
      .card-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 15px;
        flex-wrap: wrap;
      }
      .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .view-btn {
        background: #3b82f6;
        color: white;
      }
      .update-btn {
        background: #0b880b;
        color: white;
      }
      .delete-btn {
        background: #ef4444;
        color: white;
      }
      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 15px;
      }
      .get-all-btn {
        background: linear-gradient(135deg, #0b880b, #0a6e0a);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      .get-all-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(11, 136, 11, 0.3);
      }
      .product-info {
        margin-bottom: 8px;
        font-size: 0.9rem;
      }
      .product-info strong {
        color: #374151;
      }
      .product-info span {
        color: #64748b;
      }
      .single-product-view {
        background: #f8fafc;
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 30px;
        border: 1px solid #e2e8f0;
        display: none;
      }
      .single-product-content {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 25px;
        align-items: start;
      }
      .single-product-image {
        width: 200px;
        height: 200px;
        border-radius: 8px;
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0b880b;
        font-size: 4rem;
        overflow: hidden;
      }
      .single-product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .single-product-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      .detail-item {
        background: white;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .detail-item strong {
        display: block;
        color: #374151;
        margin-bottom: 5px;
      }
      .detail-item span {
        color: #1e293b;
        font-weight: 500;
      }
      .carousel {
        position: relative;
        width: 100%;
        height: 400px;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 40px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      }
      .carousel-inner {
        width: 100%;
        height: 100%;
        position: relative;
      }
      .carousel-slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.8s ease-in-out;
        background-size: cover;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .carousel-slide.active {
        opacity: 1;
      }
      .carousel-slide::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(11, 136, 11, 0.3), rgba(232, 176, 103, 0.3));
      }
      .slide-content {
        position: relative;
        z-index: 2;
        text-align: center;
        color: white;
        padding: 40px;
      }
      .slide-content h2 {
        font-size: 2.5rem;
        margin-bottom: 15px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      }
      .slide-content p {
        font-size: 1.2rem;
        margin-bottom: 20px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      }
      .carousel-indicators {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 3;
      }
      .indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .indicator.active {
        background: white;
        transform: scale(1.2);
      }
      .carousel-controls {
        position: absolute;
        top: 50%;
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 3;
        transform: translateY(-50%);
      }
      .carousel-control {
        background: rgba(255, 255, 255, 0.8);
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.2rem;
        color: #0b880b;
      }
      .carousel-control:hover {
        background: white;
        transform: scale(1.1);
      }

  body
    .layout
      //- Sidebar
      aside.sidebar
        .logo-container
          img.logo-img(src="/images/logo 2.png", alt="MWF Logo")
          .logo-text Mayondo Wood & Furniture
        nav
          ul
            li
              a(href="/dashboard")
                i.fas.fa-home
                span Dashboard
            li
              a(href="/products")
                i.fas.fa-couch
                span Products Gallery
            li
              a(href="/stock")
                i.fas.fa-boxes
                span Add Stock
            li
              a(href="/stockList")
                i.fas.fa-clipboard-list
                span Stock List
            li
              a(href="/sales-report")
                i.fas.fa-chart-line
                span Sales Reports
            li
              a(href="/logout")
                i.fas.fa-sign-out-alt
                span Logout

      //- Topbar
      #topbar
        .header-content
          .company-info
            h1 Products Gallery
            h3 Explore our premium furniture collection
          .header-actions
            .notification-btn
              i.fas.fa-bell
              .notification-count 0
            .user-profile
              i.fas.fa-user-circle
              span#userName= user ? user.name : 'User'

      //- Main Content
      .container
        .page-header
          .header-text
            h2(style="margin-bottom: 10px; color: #1e293b;") Furniture Collection
            p(style="color: #64748b;") Discover our handcrafted furniture and premium raw materials
          button.get-all-btn#getAllProducts
            i.fas.fa-sync-alt
            | Refresh Products

        //- Carousel Section
        .carousel
          .carousel-inner
            .carousel-slide.active(style="background-image: url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')")
              .slide-content
                h2 Premium Furniture
                p Handcrafted with excellence and attention to detail
            .carousel-slide(style="background-image: url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')")
              .slide-content
                h2 Luxury Bedroom Sets
                p Create your perfect sanctuary with our bedroom collections
            .carousel-slide(style="background-image: url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')")
              .slide-content
                h2 Office Solutions
                p Ergonomic and stylish furniture for modern workplaces
            .carousel-slide(style="background-image: url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')")
              .slide-content
                h2 Quality Raw Materials
                p Premium wood and materials for all your projects
          
          .carousel-controls
            button.carousel-control.prev
              i.fas.fa-chevron-left
            button.carousel-control.next
              i.fas.fa-chevron-right
          
          .carousel-indicators
            .indicator.active
            .indicator
            .indicator
            .indicator

        //- Single Product View
        .single-product-view#singleProductView
          .single-product-content#singleProductContent

        //- Products Cards Section
        .cards#productsContainer
          each product in products
            .card.product-card
              if product.image
                img.product-image(src=product.image, alt=product.productName, onerror="handleImageError(this)")
                .product-image(style="display: none; background: linear-gradient(135deg, #f0fdf4, #dcfce7); align-items: center; justify-content: center; color: #0b880b; font-size: 3rem;")
                  i(class=getProductIcon(product.productName))
              else
                .product-image(style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #0b880b; font-size: 3rem;")
                  i(class=getProductIcon(product.productName))
              
              .card-content
                h4= product.productName
                .product-info
                  strong Type: 
                  span= product.productType
                .product-info
                  strong Category: 
                  span= product.category
                .product-info
                  strong Quantity: 
                  span= product.quantity + ' units'
                .product-info
                  strong Price: 
                  span= 'KSH ' + product.costPrice.toLocaleString()
                .product-info
                  strong Supplier: 
                  span= product.supplier
                if product.quality
                  .product-info
                    strong Quality: 
                    span= product.quality
                if product.color
                  .product-info
                    strong Color: 
                    span= product.color
                if product.measurement
                  .product-info
                    strong Measurement: 
                    span= product.measurement
                .product-info
                  strong Date Added: 
                  span= new Date(product.date).toLocaleDateString()

              .card-actions
                button.action-btn.view-btn(onclick="viewProduct('" + product._id + "')")
                  i.fas.fa-eye
                  | View Details
                button.action-btn.update-btn(onclick="updateProduct('" + product._id + "')")
                  i.fas.fa-edit
                  | Update
                button.action-btn.delete-btn(onclick="deleteProduct('" + product._id + "')")
                  i.fas.fa-trash
                  | Delete

    //- Footer
    footer
      .container
        p &copy; 2025 Mayondo Wood & Furniture Ltd

    //- Success Modal
    .modal(style="display: none;")#successModal
      .modal-content(style="max-width: 400px; text-align: center;")
        span.close(style="position: absolute; right: 15px; top: 10px; cursor: pointer;") &times;
        .modal-icon(style="font-size: 48px; color: #0b880b; margin-bottom: 20px;")
          i.fas.fa-check-circle
        h3(style="margin-bottom: 15px;") Success!
        p#successMessage Operation completed successfully
        button.get-all-btn(style="margin-top: 20px;") OK

  script.
    //- Product icon mapping
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

    //- Image error handler
    function handleImageError(img) {
      img.style.display = 'none';
      img.nextElementSibling.style.display = 'flex';
    }

    //- Format currency
    function formatCurrency(amount) {
      return 'KSH ' + amount.toString().replace(/\B(?=(\\d{3})+(?!\\d))/g, ",");
    }

    //- Format date
    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    //- Carousel functionality
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

    //- Initialize carousel
    document.addEventListener('DOMContentLoaded', function() {
      //- Set user name
      const userName = '#{user ? user.name : "User"}';
      document.getElementById('userName').textContent = userName;

      //- Start carousel auto-advance
      setInterval(nextSlide, 5000);

      //- Carousel controls
      document.querySelector('.carousel-control.prev').addEventListener('click', prevSlide);
      document.querySelector('.carousel-control.next').addEventListener('click', nextSlide);

      //- Carousel indicators
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showSlide(index));
      });
    });

    //- Product management functions
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

    //- Event listeners
    document.getElementById('getAllProducts').addEventListener('click', loadAllProducts);
    document.querySelector('.close').addEventListener('click', function() {
      document.getElementById('successModal').style.display = 'none';
    });
    window.addEventListener('click', function(event) {
      if (event.target === document.getElementById('successModal')) {
        document.getElementById('successModal').style.display = 'none';
      }
    });